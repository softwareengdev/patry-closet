using MediatR;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Wishlist.Commands;
using PatryCloset.Application.Features.Wishlist.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Wishlist.Queries;

public sealed class GetWishlistQueryHandler(
    IRepository<WishlistItem> wishlistRepo)
    : IRequestHandler<GetWishlistQuery, Result<WishlistDto>>
{
    public async Task<Result<WishlistDto>> Handle(GetWishlistQuery request, CancellationToken ct)
    {
        var totalCount = await wishlistRepo.AsQueryable()
            .CountAsync(w => w.CustomerProfileId == request.CustomerProfileId, ct);

        var items = await wishlistRepo.AsQueryable()
            .Where(w => w.CustomerProfileId == request.CustomerProfileId)
            .Include(w => w.Product)
                .ThenInclude(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(w => w.Product)
                .ThenInclude(p => p.Variants.Where(v => v.IsActive))
            .OrderByDescending(w => w.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .AsNoTracking()
            .ToListAsync(ct);

        var dtos = items.Select(WishlistMapper.MapToDto).ToList();

        return Result<WishlistDto>.Success(new WishlistDto
        {
            Items = dtos.AsReadOnly(),
            TotalCount = totalCount,
        });
    }
}

// ─── Is In Wishlist ───

public sealed class IsInWishlistQueryHandler(
    IRepository<WishlistItem> wishlistRepo)
    : IRequestHandler<IsInWishlistQuery, Result<bool>>
{
    public async Task<Result<bool>> Handle(IsInWishlistQuery request, CancellationToken ct)
    {
        var exists = await wishlistRepo.ExistsAsync(
            w => w.CustomerProfileId == request.CustomerProfileId && w.ProductId == request.ProductId, ct);
        return Result<bool>.Success(exists);
    }
}

internal static class WishlistMapper
{
    internal static WishlistItemDto MapToDto(WishlistItem w)
    {
        var primaryImage = w.Product.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
        var activeVariants = w.Product.Variants.Where(v => v.IsActive).ToList();

        return new WishlistItemDto
        {
            Id = w.Id,
            ProductId = w.ProductId,
            ProductName = w.Product.Name,
            ProductSlug = w.Product.Slug,
            ProductImage = primaryImage?.Url ?? "",
            Brand = w.Product.Brand,
            Price = w.Product.Price,
            OriginalPrice = w.Product.OriginalPrice,
            DiscountPercent = w.Product.DiscountPercent,
            Badge = w.Product.Badge.ToString().ToLower() == "none" ? "" : w.Product.Badge.ToString(),
            InStock = activeVariants.Any(v => v.StockQuantity > 0),
            AddedAt = w.CreatedAt,
        };
    }
}
