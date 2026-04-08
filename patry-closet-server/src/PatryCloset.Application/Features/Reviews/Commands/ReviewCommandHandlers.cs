using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Reviews.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Reviews.Commands;

// ─── Create Review ───

public sealed class CreateReviewCommandHandler(
    IRepository<Review> reviewRepo,
    IRepository<Product> productRepo,
    IRepository<CustomerProfile> customerRepo,
    IRepository<Order> orderRepo,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<CreateReviewCommandHandler> logger)
    : IRequestHandler<CreateReviewCommand, Result<ReviewDto>>
{
    public async Task<Result<ReviewDto>> Handle(CreateReviewCommand request, CancellationToken ct)
    {
        // Find customer profile
        var profiles = await customerRepo.FindAsync(cp => cp.UserId == request.UserId, ct);
        var profile = profiles.FirstOrDefault();
        if (profile is null)
            return Result<ReviewDto>.Failure("Perfil de cliente no encontrado");

        // Check product exists
        var product = await productRepo.GetByIdAsync(request.ProductId, ct);
        if (product is null)
            return Result<ReviewDto>.Failure("Producto no encontrado");

        // Check duplicate review
        var alreadyReviewed = await reviewRepo.ExistsAsync(
            r => r.ProductId == request.ProductId && r.CustomerProfileId == profile.Id, ct);
        if (alreadyReviewed)
            return Result<ReviewDto>.Failure("Ya has publicado una reseña para este producto");

        // Check verified purchase
        var isVerifiedPurchase = await orderRepo.AsQueryable()
            .AsNoTracking()
            .Where(o => o.CustomerProfileId == profile.Id && o.Status == OrderStatus.Delivered)
            .SelectMany(o => o.Items)
            .AnyAsync(oi => oi.ProductId == request.ProductId, ct);

        var review = new Review
        {
            Id = Guid.NewGuid(),
            ProductId = request.ProductId,
            CustomerProfileId = profile.Id,
            Rating = request.Rating,
            Title = request.Title,
            Comment = request.Comment,
            IsVerifiedPurchase = isVerifiedPurchase,
            IsApproved = true,
            CreatedBy = request.UserId,
        };

        await reviewRepo.AddAsync(review, ct);

        // Recalculate product rating
        await RecalculateProductRating(product, ct);

        await unitOfWork.SaveChangesAsync(ct);

        await InvalidateCache(request.ProductId, product.Slug, ct);

        logger.LogInformation(
            "Review {ReviewId} created by user {UserId} for product {ProductId} (Rating: {Rating})",
            review.Id, request.UserId, request.ProductId, request.Rating);

        return Result<ReviewDto>.Success(MapToDto(review, product, profile));
    }

    private async Task RecalculateProductRating(Product product, CancellationToken ct)
    {
        var approvedReviews = await reviewRepo.AsQueryable()
            .Where(r => r.ProductId == product.Id && r.IsApproved)
            .ToListAsync(ct);

        product.ReviewCount = approvedReviews.Count;
        product.Rating = approvedReviews.Count > 0
            ? Math.Round((decimal)approvedReviews.Average(r => r.Rating), 1)
            : 0;

        await productRepo.UpdateAsync(product, ct);
    }

    private async Task InvalidateCache(Guid productId, string slug, CancellationToken ct)
    {
        await cache.RemoveAsync($"product:{slug}", ct);
        await cache.RemoveByPrefixAsync("products:", ct);
    }

    internal static ReviewDto MapToDto(Review r, Product p, CustomerProfile cp) => new()
    {
        Id = r.Id,
        ProductId = p.Id,
        ProductName = p.Name,
        ProductSlug = p.Slug,
        AuthorName = FormatAuthorName(cp),
        AuthorAvatar = cp.AvatarUrl,
        Rating = r.Rating,
        Title = r.Title,
        Comment = r.Comment,
        IsVerifiedPurchase = r.IsVerifiedPurchase,
        IsApproved = r.IsApproved,
        CreatedAt = r.CreatedAt,
    };

    internal static string FormatAuthorName(CustomerProfile cp)
    {
        var lastName = cp.LastName;
        var initial = !string.IsNullOrEmpty(lastName) ? $" {lastName[0]}." : "";
        return $"{cp.FirstName}{initial}";
    }
}

// ─── Update Review ───

public sealed class UpdateReviewCommandHandler(
    IRepository<Review> reviewRepo,
    IRepository<Product> productRepo,
    IRepository<CustomerProfile> customerRepo,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<UpdateReviewCommandHandler> logger)
    : IRequestHandler<UpdateReviewCommand, Result<ReviewDto>>
{
    public async Task<Result<ReviewDto>> Handle(UpdateReviewCommand request, CancellationToken ct)
    {
        var review = await reviewRepo.AsQueryable()
            .Include(r => r.Product)
            .Include(r => r.CustomerProfile)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, ct);

        if (review is null)
            return Result<ReviewDto>.Failure("Reseña no encontrada");

        // Verify ownership
        if (review.CustomerProfile.UserId != request.UserId)
            return Result<ReviewDto>.Failure("No tienes permiso para editar esta reseña");

        review.Rating = request.Rating;
        review.Title = request.Title;
        review.Comment = request.Comment;
        review.UpdatedAt = DateTime.UtcNow;
        review.UpdatedBy = request.UserId;

        await reviewRepo.UpdateAsync(review, ct);

        // Recalculate product rating
        var product = review.Product;
        var approvedReviews = await reviewRepo.AsQueryable()
            .Where(r => r.ProductId == product.Id && r.IsApproved)
            .ToListAsync(ct);

        product.ReviewCount = approvedReviews.Count;
        product.Rating = approvedReviews.Count > 0
            ? Math.Round((decimal)approvedReviews.Average(r => r.Rating), 1)
            : 0;

        await productRepo.UpdateAsync(product, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await cache.RemoveAsync($"product:{product.Slug}", ct);
        await cache.RemoveByPrefixAsync("products:", ct);

        logger.LogInformation("Review {ReviewId} updated by user {UserId}", review.Id, request.UserId);

        return Result<ReviewDto>.Success(CreateReviewCommandHandler.MapToDto(
            review, product, review.CustomerProfile));
    }
}

// ─── Delete Review ───

public sealed class DeleteReviewCommandHandler(
    IRepository<Review> reviewRepo,
    IRepository<Product> productRepo,
    IRepository<CustomerProfile> customerRepo,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ICurrentUserService currentUser,
    ILogger<DeleteReviewCommandHandler> logger)
    : IRequestHandler<DeleteReviewCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteReviewCommand request, CancellationToken ct)
    {
        var review = await reviewRepo.AsQueryable()
            .Include(r => r.Product)
            .Include(r => r.CustomerProfile)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, ct);

        if (review is null)
            return Result<bool>.Failure("Reseña no encontrada");

        // Verify ownership or admin
        var isAdmin = currentUser.IsInRole("Admin");
        if (review.CustomerProfile.UserId != request.UserId && !isAdmin)
            return Result<bool>.Failure("No tienes permiso para eliminar esta reseña");

        var product = review.Product;

        await reviewRepo.DeleteAsync(review, ct);

        // Recalculate product rating
        var approvedReviews = await reviewRepo.AsQueryable()
            .Where(r => r.ProductId == product.Id && r.IsApproved && r.Id != review.Id)
            .ToListAsync(ct);

        product.ReviewCount = approvedReviews.Count;
        product.Rating = approvedReviews.Count > 0
            ? Math.Round((decimal)approvedReviews.Average(r => r.Rating), 1)
            : 0;

        await productRepo.UpdateAsync(product, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await cache.RemoveAsync($"product:{product.Slug}", ct);
        await cache.RemoveByPrefixAsync("products:", ct);

        logger.LogInformation("Review {ReviewId} deleted by user {UserId}", review.Id, request.UserId);

        return Result<bool>.Success(true);
    }
}

// ─── Moderate Review (Admin) ───

public sealed class ModerateReviewCommandHandler(
    IRepository<Review> reviewRepo,
    IRepository<Product> productRepo,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<ModerateReviewCommandHandler> logger)
    : IRequestHandler<ModerateReviewCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ModerateReviewCommand request, CancellationToken ct)
    {
        var review = await reviewRepo.AsQueryable()
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, ct);

        if (review is null)
            return Result<bool>.Failure("Reseña no encontrada");

        if (review.IsApproved == request.IsApproved)
            return Result<bool>.Success(true);

        review.IsApproved = request.IsApproved;
        review.UpdatedAt = DateTime.UtcNow;

        await reviewRepo.UpdateAsync(review, ct);

        // Recalculate product rating with new approval status
        var product = review.Product;
        var approvedReviews = await reviewRepo.AsQueryable()
            .Where(r => r.ProductId == product.Id && r.IsApproved)
            .ToListAsync(ct);

        product.ReviewCount = approvedReviews.Count;
        product.Rating = approvedReviews.Count > 0
            ? Math.Round((decimal)approvedReviews.Average(r => r.Rating), 1)
            : 0;

        await productRepo.UpdateAsync(product, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await cache.RemoveAsync($"product:{product.Slug}", ct);
        await cache.RemoveByPrefixAsync("products:", ct);

        logger.LogInformation(
            "Review {ReviewId} moderated: IsApproved={IsApproved}", review.Id, request.IsApproved);

        return Result<bool>.Success(true);
    }
}
