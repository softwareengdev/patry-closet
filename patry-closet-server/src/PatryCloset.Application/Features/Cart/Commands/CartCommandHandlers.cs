using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Cart.DTOs;
using PatryCloset.Application.Features.Cart.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Cart.Commands;

// ─── Add to Cart ───

public sealed class AddToCartCommandHandler(
    IRepository<Domain.Entities.Cart> cartRepo,
    IRepository<Product> productRepo,
    IRepository<ProductVariant> variantRepo,
    IUnitOfWork unitOfWork,
    ILogger<AddToCartCommandHandler> logger)
    : IRequestHandler<AddToCartCommand, Result<CartDto>>
{
    public async Task<Result<CartDto>> Handle(AddToCartCommand request, CancellationToken ct)
    {
        // Find or resolve the product variant
        var variant = await variantRepo.AsQueryable()
            .FirstOrDefaultAsync(v =>
                v.ProductId == request.ProductId &&
                v.Color.ToLower() == request.Color.ToLower() &&
                v.Size.ToLower() == request.Size.ToLower() &&
                v.IsActive, ct);

        if (variant is null)
            return Result<CartDto>.Failure("Variante de producto no encontrada (color/talla no disponible)");

        if (variant.StockQuantity < request.Quantity)
            return Result<CartDto>.Failure($"Stock insuficiente. Disponible: {variant.StockQuantity}");

        // Get product for price
        var product = await productRepo.GetByIdAsync(request.ProductId, ct);
        if (product is null || !product.IsActive)
            return Result<CartDto>.Failure("Producto no encontrado");

        // Find or create cart
        var cart = await GetOrCreateCart(cartRepo, request.CustomerProfileId, request.SessionId, ct);

        // Check if item with same variant already in cart
        var existingItem = cart.Items.FirstOrDefault(i =>
            i.ProductId == request.ProductId &&
            i.ProductVariantId == variant.Id);

        if (existingItem is not null)
        {
            var newQty = existingItem.Quantity + request.Quantity;
            if (newQty > 10)
                return Result<CartDto>.Failure("Máximo 10 unidades por artículo");
            if (newQty > variant.StockQuantity)
                return Result<CartDto>.Failure($"Stock insuficiente. Disponible: {variant.StockQuantity}");

            existingItem.Quantity = newQty;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                Id = Guid.NewGuid(),
                ProductId = request.ProductId,
                ProductVariantId = variant.Id,
                Color = variant.Color,
                Size = variant.Size,
                UnitPrice = product.Price,
                Quantity = request.Quantity,
                CartId = cart.Id,
            });
        }

        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Cart item added: Product {ProductId}, Variant {VariantId}", product.Id, variant.Id);

        // Reload cart with navigation properties
        var updated = await GetCartQueryHandler.FindCart(cartRepo, request.CustomerProfileId, request.SessionId, ct);
        return Result<CartDto>.Success(CartMapper.MapToDto(updated!));
    }

    private static async Task<Domain.Entities.Cart> GetOrCreateCart(
        IRepository<Domain.Entities.Cart> cartRepo,
        Guid? customerProfileId,
        string? sessionId,
        CancellationToken ct)
    {
        var cart = await cartRepo.AsQueryable()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (customerProfileId.HasValue && c.CustomerProfileId == customerProfileId) ||
                (!string.IsNullOrEmpty(sessionId) && c.SessionId == sessionId && c.CustomerProfileId == null), ct);

        if (cart is not null) return cart;

        cart = new Domain.Entities.Cart
        {
            Id = Guid.NewGuid(),
            CustomerProfileId = customerProfileId,
            SessionId = customerProfileId.HasValue ? null : sessionId,
        };
        await cartRepo.AddAsync(cart, ct);
        return cart;
    }
}

// ─── Update Cart Item ───

public sealed class UpdateCartItemCommandHandler(
    IRepository<Domain.Entities.Cart> cartRepo,
    IRepository<CartItem> cartItemRepo,
    IRepository<ProductVariant> variantRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateCartItemCommand, Result<CartDto>>
{
    public async Task<Result<CartDto>> Handle(UpdateCartItemCommand request, CancellationToken ct)
    {
        var cart = await cartRepo.AsQueryable()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (request.CustomerProfileId.HasValue && c.CustomerProfileId == request.CustomerProfileId) ||
                (!string.IsNullOrEmpty(request.SessionId) && c.SessionId == request.SessionId), ct);

        if (cart is null)
            return Result<CartDto>.Failure("Carrito no encontrado");

        var item = cart.Items.FirstOrDefault(i => i.Id == request.CartItemId);
        if (item is null)
            return Result<CartDto>.Failure("Artículo no encontrado en el carrito");

        // Validate stock
        if (item.ProductVariantId.HasValue)
        {
            var variant = await variantRepo.GetByIdAsync(item.ProductVariantId.Value, ct);
            if (variant is not null && request.Quantity > variant.StockQuantity)
                return Result<CartDto>.Failure($"Stock insuficiente. Disponible: {variant.StockQuantity}");
        }

        item.Quantity = request.Quantity;
        await unitOfWork.SaveChangesAsync(ct);

        var updated = await GetCartQueryHandler.FindCart(cartRepo, request.CustomerProfileId, request.SessionId, ct);
        return Result<CartDto>.Success(CartMapper.MapToDto(updated!));
    }
}

// ─── Remove Cart Item ───

public sealed class RemoveCartItemCommandHandler(
    IRepository<Domain.Entities.Cart> cartRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<RemoveCartItemCommand, Result<CartDto>>
{
    public async Task<Result<CartDto>> Handle(RemoveCartItemCommand request, CancellationToken ct)
    {
        var cart = await cartRepo.AsQueryable()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (request.CustomerProfileId.HasValue && c.CustomerProfileId == request.CustomerProfileId) ||
                (!string.IsNullOrEmpty(request.SessionId) && c.SessionId == request.SessionId), ct);

        if (cart is null)
            return Result<CartDto>.Failure("Carrito no encontrado");

        var item = cart.Items.FirstOrDefault(i => i.Id == request.CartItemId);
        if (item is null)
            return Result<CartDto>.Failure("Artículo no encontrado en el carrito");

        cart.Items.Remove(item);
        await unitOfWork.SaveChangesAsync(ct);

        var updated = await GetCartQueryHandler.FindCart(cartRepo, request.CustomerProfileId, request.SessionId, ct);
        return Result<CartDto>.Success(updated is not null ? CartMapper.MapToDto(updated) : new CartDto
        {
            Id = cart.Id, Items = [], Subtotal = 0, TotalItems = 0, Total = 0,
        });
    }
}

// ─── Clear Cart ───

public sealed class ClearCartCommandHandler(
    IRepository<Domain.Entities.Cart> cartRepo,
    IUnitOfWork unitOfWork)
    : IRequestHandler<ClearCartCommand, Result>
{
    public async Task<Result> Handle(ClearCartCommand request, CancellationToken ct)
    {
        var cart = await cartRepo.AsQueryable()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (request.CustomerProfileId.HasValue && c.CustomerProfileId == request.CustomerProfileId) ||
                (!string.IsNullOrEmpty(request.SessionId) && c.SessionId == request.SessionId), ct);

        if (cart is null) return Result.Success();

        cart.Items.Clear();
        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}

// ─── Merge Guest Cart → User Cart (on login) ───

public sealed class MergeCartCommandHandler(
    IRepository<Domain.Entities.Cart> cartRepo,
    IRepository<ProductVariant> variantRepo,
    IUnitOfWork unitOfWork,
    ILogger<MergeCartCommandHandler> logger)
    : IRequestHandler<MergeCartCommand, Result<CartDto>>
{
    public async Task<Result<CartDto>> Handle(MergeCartCommand request, CancellationToken ct)
    {
        var guestCart = await cartRepo.AsQueryable()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.SessionId == request.SessionId && c.CustomerProfileId == null, ct);

        if (guestCart is null || !guestCart.Items.Any())
        {
            var existing = await GetCartQueryHandler.FindCart(cartRepo, request.CustomerProfileId, null, ct);
            return Result<CartDto>.Success(existing is not null ? CartMapper.MapToDto(existing) : new CartDto
            {
                Id = Guid.Empty, Items = [], Subtotal = 0, TotalItems = 0, Total = 0,
            });
        }

        var userCart = await cartRepo.AsQueryable()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerProfileId == request.CustomerProfileId, ct);

        if (userCart is null)
        {
            // Assign guest cart to user
            guestCart.CustomerProfileId = request.CustomerProfileId;
            guestCart.SessionId = null;
            await unitOfWork.SaveChangesAsync(ct);

            logger.LogInformation("Guest cart assigned to customer {CustomerId}", request.CustomerProfileId);
        }
        else
        {
            // Merge items: guest items win on conflict
            foreach (var guestItem in guestCart.Items)
            {
                var existing = userCart.Items.FirstOrDefault(i =>
                    i.ProductId == guestItem.ProductId && i.ProductVariantId == guestItem.ProductVariantId);

                if (existing is not null)
                {
                    existing.Quantity = Math.Min(existing.Quantity + guestItem.Quantity, 10);
                }
                else
                {
                    userCart.Items.Add(new CartItem
                    {
                        Id = Guid.NewGuid(),
                        ProductId = guestItem.ProductId,
                        ProductVariantId = guestItem.ProductVariantId,
                        Color = guestItem.Color,
                        Size = guestItem.Size,
                        UnitPrice = guestItem.UnitPrice,
                        Quantity = guestItem.Quantity,
                        CartId = userCart.Id,
                    });
                }
            }

            // Remove guest cart
            await cartRepo.DeleteAsync(guestCart, ct);
            await unitOfWork.SaveChangesAsync(ct);

            logger.LogInformation("Guest cart merged into user cart for customer {CustomerId}", request.CustomerProfileId);
        }

        var updated = await GetCartQueryHandler.FindCart(cartRepo, request.CustomerProfileId, null, ct);
        return Result<CartDto>.Success(CartMapper.MapToDto(updated!));
    }
}
