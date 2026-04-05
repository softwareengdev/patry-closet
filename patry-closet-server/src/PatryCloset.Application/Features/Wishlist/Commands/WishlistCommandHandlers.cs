using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Wishlist.DTOs;
using PatryCloset.Application.Features.Wishlist.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Wishlist.Commands;

// ─── Add to Wishlist ───

public sealed class AddToWishlistCommandHandler(
    IRepository<WishlistItem> wishlistRepo,
    IRepository<Product> productRepo,
    IUnitOfWork unitOfWork,
    ILogger<AddToWishlistCommandHandler> logger)
    : IRequestHandler<AddToWishlistCommand, Result<WishlistItemDto>>
{
    public async Task<Result<WishlistItemDto>> Handle(AddToWishlistCommand request, CancellationToken ct)
    {
        // Check if product exists
        var product = await productRepo.GetByIdAsync(request.ProductId, ct);
        if (product is null || !product.IsActive)
            return Result<WishlistItemDto>.Failure("Producto no encontrado");

        // Check duplicate
        var exists = await wishlistRepo.ExistsAsync(
            w => w.CustomerProfileId == request.CustomerProfileId && w.ProductId == request.ProductId, ct);
        if (exists)
            return Result<WishlistItemDto>.Failure("El producto ya está en tu lista de deseos");

        var item = new WishlistItem
        {
            Id = Guid.NewGuid(),
            CustomerProfileId = request.CustomerProfileId,
            ProductId = request.ProductId,
        };

        await wishlistRepo.AddAsync(item, ct);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Wishlist item added: Product {ProductId} for Customer {CustomerId}",
            request.ProductId, request.CustomerProfileId);

        // Reload with navigation properties
        var loaded = await wishlistRepo.AsQueryable()
            .Include(w => w.Product).ThenInclude(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(w => w.Product).ThenInclude(p => p.Variants.Where(v => v.IsActive))
            .AsNoTracking()
            .FirstAsync(w => w.Id == item.Id, ct);

        return Result<WishlistItemDto>.Success(WishlistMapper.MapToDto(loaded));
    }
}

// ─── Remove from Wishlist ───

public sealed class RemoveFromWishlistCommandHandler(
    IRepository<WishlistItem> wishlistRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<RemoveFromWishlistCommand, Result>
{
    public async Task<Result> Handle(RemoveFromWishlistCommand request, CancellationToken ct)
    {
        var item = await wishlistRepo.AsQueryable()
            .FirstOrDefaultAsync(w =>
                w.CustomerProfileId == request.CustomerProfileId &&
                w.ProductId == request.ProductId, ct);

        if (item is null)
            return Result.Failure("El producto no está en tu lista de deseos");

        await wishlistRepo.DeleteAsync(item, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ─── Toggle Wishlist ───

public sealed class ToggleWishlistCommandHandler(
    IRepository<WishlistItem> wishlistRepo,
    IRepository<Product> productRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<ToggleWishlistCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ToggleWishlistCommand request, CancellationToken ct)
    {
        var existing = await wishlistRepo.AsQueryable()
            .FirstOrDefaultAsync(w =>
                w.CustomerProfileId == request.CustomerProfileId &&
                w.ProductId == request.ProductId, ct);

        if (existing is not null)
        {
            await wishlistRepo.DeleteAsync(existing, ct);
            await unitOfWork.SaveChangesAsync(ct);
            return Result<bool>.Success(false); // removed
        }

        var product = await productRepo.GetByIdAsync(request.ProductId, ct);
        if (product is null || !product.IsActive)
            return Result<bool>.Failure("Producto no encontrado");

        await wishlistRepo.AddAsync(new WishlistItem
        {
            Id = Guid.NewGuid(),
            CustomerProfileId = request.CustomerProfileId,
            ProductId = request.ProductId,
        }, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return Result<bool>.Success(true); // added
    }
}
