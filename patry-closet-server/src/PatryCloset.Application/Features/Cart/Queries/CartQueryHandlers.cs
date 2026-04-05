using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Cart.Commands;
using PatryCloset.Application.Features.Cart.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Cart.Queries;

public sealed class GetCartQueryHandler(
    IRepository<Domain.Entities.Cart> cartRepo,
    ILogger<GetCartQueryHandler> logger)
    : IRequestHandler<GetCartQuery, Result<CartDto>>
{
    public async Task<Result<CartDto>> Handle(GetCartQuery request, CancellationToken ct)
    {
        var cart = await FindCart(cartRepo, request.CustomerProfileId, request.SessionId, ct);

        if (cart is null)
        {
            return Result<CartDto>.Success(new CartDto
            {
                Id = Guid.Empty,
                Items = [],
                Subtotal = 0,
                TotalItems = 0,
                Total = 0,
            });
        }

        return Result<CartDto>.Success(CartMapper.MapToDto(cart));
    }

    internal static async Task<Domain.Entities.Cart?> FindCart(
        IRepository<Domain.Entities.Cart> cartRepo,
        Guid? customerProfileId,
        string? sessionId,
        CancellationToken ct)
    {
        var query = cartRepo.AsQueryable()
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images.OrderBy(img => img.SortOrder))
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
            .AsNoTracking();

        if (customerProfileId.HasValue)
            return await query.FirstOrDefaultAsync(c => c.CustomerProfileId == customerProfileId, ct);

        if (!string.IsNullOrEmpty(sessionId))
            return await query.FirstOrDefaultAsync(c => c.SessionId == sessionId && c.CustomerProfileId == null, ct);

        return null;
    }
}

internal static class CartMapper
{
    internal static CartDto MapToDto(Domain.Entities.Cart cart)
    {
        var items = cart.Items.Select(i =>
        {
            var primaryImage = i.Product.Images.OrderBy(img => img.SortOrder).FirstOrDefault();
            var variant = i.ProductVariant;
            var availableStock = variant?.StockQuantity ?? 0;

            return new CartItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                ProductSlug = i.Product.Slug,
                ProductImage = primaryImage?.Url ?? "",
                Brand = i.Product.Brand,
                Color = i.Color,
                Size = i.Size,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                OriginalPrice = i.Product.OriginalPrice,
                LineTotal = i.UnitPrice * i.Quantity,
                InStock = availableStock >= i.Quantity,
                AvailableStock = availableStock,
                ProductVariantId = i.ProductVariantId,
            };
        }).ToList();

        var subtotal = items.Sum(i => i.LineTotal);

        return new CartDto
        {
            Id = cart.Id,
            Items = items.AsReadOnly(),
            Subtotal = subtotal,
            TotalItems = items.Sum(i => i.Quantity),
            EstimatedShipping = subtotal >= 50 ? 0 : 4.95m, // Free shipping over €50
            Total = subtotal + (subtotal >= 50 ? 0 : 4.95m),
        };
    }
}
