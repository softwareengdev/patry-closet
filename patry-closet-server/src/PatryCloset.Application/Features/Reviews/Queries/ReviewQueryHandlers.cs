using MediatR;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Reviews.Commands;
using PatryCloset.Application.Features.Reviews.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Reviews.Queries;

// ─── Get Product Reviews (paginated) ───

public sealed class GetProductReviewsQueryHandler(
    IRepository<Review> reviewRepo)
    : IRequestHandler<GetProductReviewsQuery, Result<PaginatedList<ReviewDto>>>
{
    public async Task<Result<PaginatedList<ReviewDto>>> Handle(
        GetProductReviewsQuery request, CancellationToken ct)
    {
        var query = reviewRepo.AsQueryable()
            .Where(r => r.ProductId == request.ProductId && r.IsApproved)
            .Include(r => r.Product)
            .Include(r => r.CustomerProfile)
            .OrderByDescending(r => r.CreatedAt)
            .AsNoTracking();

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(r => CreateReviewCommandHandler.MapToDto(
            r, r.Product, r.CustomerProfile)).ToList();

        return Result<PaginatedList<ReviewDto>>.Success(
            PaginatedList<ReviewDto>.Create(dtos, totalCount, request.Page, request.PageSize));
    }
}

// ─── Get User Reviews (paginated) ───

public sealed class GetUserReviewsQueryHandler(
    IRepository<Review> reviewRepo,
    IRepository<CustomerProfile> customerRepo)
    : IRequestHandler<GetUserReviewsQuery, Result<PaginatedList<ReviewDto>>>
{
    public async Task<Result<PaginatedList<ReviewDto>>> Handle(
        GetUserReviewsQuery request, CancellationToken ct)
    {
        var profiles = await customerRepo.FindAsync(cp => cp.UserId == request.UserId, ct);
        var profile = profiles.FirstOrDefault();
        if (profile is null)
            return Result<PaginatedList<ReviewDto>>.Failure("Perfil de cliente no encontrado");

        var query = reviewRepo.AsQueryable()
            .Where(r => r.CustomerProfileId == profile.Id)
            .Include(r => r.Product)
            .Include(r => r.CustomerProfile)
            .OrderByDescending(r => r.CreatedAt)
            .AsNoTracking();

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(r => CreateReviewCommandHandler.MapToDto(
            r, r.Product, r.CustomerProfile)).ToList();

        return Result<PaginatedList<ReviewDto>>.Success(
            PaginatedList<ReviewDto>.Create(dtos, totalCount, request.Page, request.PageSize));
    }
}

// ─── Get Review Summary (stats for a product) ───

public sealed class GetReviewSummaryQueryHandler(
    IRepository<Review> reviewRepo)
    : IRequestHandler<GetReviewSummaryQuery, Result<ReviewSummaryDto>>
{
    public async Task<Result<ReviewSummaryDto>> Handle(
        GetReviewSummaryQuery request, CancellationToken ct)
    {
        var reviews = await reviewRepo.AsQueryable()
            .Where(r => r.ProductId == request.ProductId && r.IsApproved)
            .AsNoTracking()
            .Select(r => r.Rating)
            .ToListAsync(ct);

        var distribution = Enumerable.Range(1, 5)
            .ToDictionary(star => star, star => reviews.Count(r => r == star));

        var summary = new ReviewSummaryDto
        {
            AverageRating = reviews.Count > 0
                ? Math.Round((decimal)reviews.Average(), 1)
                : 0,
            TotalReviews = reviews.Count,
            RatingDistribution = distribution.AsReadOnly(),
        };

        return Result<ReviewSummaryDto>.Success(summary);
    }
}
