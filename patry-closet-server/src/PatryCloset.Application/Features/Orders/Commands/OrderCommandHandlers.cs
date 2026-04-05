using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Orders.DTOs;
using PatryCloset.Application.Features.Orders.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Events;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.Application.Features.Orders.Commands;

// ─── Create Order (from cart) ───

public sealed class CreateOrderCommandHandler(
    IRepository<Order> orderRepo,
    IRepository<Domain.Entities.Cart> cartRepo,
    IRepository<Address> addressRepo,
    IRepository<ProductVariant> variantRepo,
    IUnitOfWork unitOfWork,
    ILogger<CreateOrderCommandHandler> logger)
    : IRequestHandler<CreateOrderCommand, Result<OrderDto>>
{
    public async Task<Result<OrderDto>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        // 1. Get cart with items
        var cart = await cartRepo.AsQueryable()
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images.OrderBy(img => img.SortOrder))
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
            .FirstOrDefaultAsync(c => c.CustomerProfileId == request.CustomerProfileId, ct);

        if (cart is null || !cart.Items.Any())
            return Result<OrderDto>.Failure("El carrito está vacío");

        // 2. Validate shipping address
        var address = await addressRepo.AsQueryable()
            .FirstOrDefaultAsync(a =>
                a.Id == request.ShippingAddressId &&
                a.CustomerProfileId == request.CustomerProfileId, ct);

        if (address is null)
            return Result<OrderDto>.Failure("Dirección de envío no encontrada");

        // 3. Validate stock for all items
        foreach (var item in cart.Items)
        {
            if (item.ProductVariantId.HasValue)
            {
                var variant = await variantRepo.GetByIdAsync(item.ProductVariantId.Value, ct);
                if (variant is null || !variant.IsActive)
                    return Result<OrderDto>.Failure($"Variante no disponible para: {item.Product.Name}");
                if (variant.StockQuantity < item.Quantity)
                    return Result<OrderDto>.Failure(
                        $"Stock insuficiente para {item.Product.Name} ({item.Color}/{item.Size}). Disponible: {variant.StockQuantity}");
            }
        }

        // 4. Calculate totals
        var subtotal = cart.Items.Sum(i => i.UnitPrice * i.Quantity);
        var shippingMethod = ParseShippingMethod(request.ShippingMethod);
        var shippingCost = CalculateShipping(subtotal, shippingMethod);
        var tax = Math.Round(subtotal * 0.21m, 2); // 21% IVA Spain
        var total = subtotal + shippingCost + tax;

        // 5. Generate unique order number
        var orderNumber = $"PC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        // 6. Create order
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = orderNumber,
            Status = OrderStatus.Pending,
            Subtotal = subtotal,
            ShippingCost = shippingCost,
            Tax = tax,
            DiscountAmount = 0,
            Total = total,
            Currency = "EUR",
            ShippingMethod = shippingMethod,
            Notes = request.Notes,
            CouponCode = request.CouponCode,

            // Snapshot shipping address
            ShippingFullName = address.FullName,
            ShippingStreet = address.Street,
            ShippingStreet2 = address.Street2,
            ShippingCity = address.City,
            ShippingProvince = address.Province,
            ShippingPostalCode = address.PostalCode,
            ShippingCountry = address.Country,
            ShippingPhone = address.Phone,

            CustomerProfileId = request.CustomerProfileId,
        };

        // 7. Create order items from cart (snapshot product data)
        foreach (var cartItem in cart.Items)
        {
            var primaryImage = cartItem.Product.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
            order.Items.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                ProductName = cartItem.Product.Name,
                ProductImageUrl = primaryImage?.Url,
                Sku = cartItem.ProductVariant?.Sku ?? $"{cartItem.Product.Slug}-{cartItem.Color}-{cartItem.Size}",
                Color = cartItem.Color,
                Size = cartItem.Size,
                Quantity = cartItem.Quantity,
                UnitPrice = cartItem.UnitPrice,
                Total = cartItem.UnitPrice * cartItem.Quantity,
                ProductId = cartItem.ProductId,
                ProductVariantId = cartItem.ProductVariantId,
                OrderId = order.Id,
            });
        }

        // 8. Add initial status history
        order.StatusHistory.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            Status = OrderStatus.Pending,
            Note = "Pedido creado",
            Timestamp = DateTime.UtcNow,
            OrderId = order.Id,
        });

        // 9. Reserve stock (decrement variant quantities)
        foreach (var cartItem in cart.Items)
        {
            if (cartItem.ProductVariantId.HasValue)
            {
                var variant = await variantRepo.GetByIdAsync(cartItem.ProductVariantId.Value, ct);
                if (variant is not null)
                {
                    variant.StockQuantity -= cartItem.Quantity;

                    // Raise domain event if stock is low
                    if (variant.StockQuantity <= 3)
                    {
                        order.AddDomainEvent(new StockDepletedEvent(variant.Id, variant.StockQuantity));
                    }
                }
            }
        }

        // 10. Raise order created domain event
        order.AddDomainEvent(new OrderCreatedEvent(order.Id));

        // 11. Persist order
        await orderRepo.AddAsync(order, ct);

        // 12. Clear cart
        cart.Items.Clear();

        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Order created: {OrderNumber} ({OrderId}) for Customer {CustomerId}",
            order.OrderNumber, order.Id, request.CustomerProfileId);

        // 13. Reload for response
        var created = await orderRepo.AsQueryable()
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .Include(o => o.StatusHistory)
            .AsNoTracking()
            .FirstAsync(o => o.Id == order.Id, ct);

        return Result<OrderDto>.Success(OrderMapper.MapToDto(created));
    }

    private static ShippingMethod ParseShippingMethod(string method) => method switch
    {
        "Express" => ShippingMethod.Express,
        "NextDay" => ShippingMethod.NextDay,
        "StorePickup" => ShippingMethod.StorePickup,
        _ => ShippingMethod.Standard,
    };

    private static decimal CalculateShipping(decimal subtotal, ShippingMethod method)
    {
        if (subtotal >= 50) return 0; // Free shipping over €50
        return method switch
        {
            ShippingMethod.Express => 7.95m,
            ShippingMethod.NextDay => 12.95m,
            ShippingMethod.StorePickup => 0,
            _ => 4.95m,
        };
    }
}

// ─── Cancel Order ───

public sealed class CancelOrderCommandHandler(
    IRepository<Order> orderRepo,
    IRepository<ProductVariant> variantRepo,
    IUnitOfWork unitOfWork,
    ILogger<CancelOrderCommandHandler> logger)
    : IRequestHandler<CancelOrderCommand, Result>
{
    public async Task<Result> Handle(CancelOrderCommand request, CancellationToken ct)
    {
        var order = await orderRepo.AsQueryable()
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o =>
                o.Id == request.OrderId &&
                o.CustomerProfileId == request.CustomerProfileId, ct);

        if (order is null)
            return Result.Failure("Pedido no encontrado");

        // Only pending or confirmed orders can be cancelled
        if (order.Status is not (OrderStatus.Pending or OrderStatus.Confirmed))
            return Result.Failure($"No se puede cancelar un pedido con estado: {order.Status}");

        order.Status = OrderStatus.Cancelled;
        order.StatusHistory.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            Status = OrderStatus.Cancelled,
            Note = request.Reason ?? "Cancelado por el cliente",
            Timestamp = DateTime.UtcNow,
            OrderId = order.Id,
        });

        // Restore stock
        foreach (var item in order.Items)
        {
            if (item.ProductVariantId.HasValue)
            {
                var variant = await variantRepo.GetByIdAsync(item.ProductVariantId.Value, ct);
                if (variant is not null)
                    variant.StockQuantity += item.Quantity;
            }
        }

        order.AddDomainEvent(new OrderStatusChangedEvent(order.Id, OrderStatus.Cancelled.ToString()));
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Order cancelled: {OrderNumber} ({OrderId})", order.OrderNumber, order.Id);
        return Result.Success();
    }
}

// ─── Admin: Update Order Status ───

public sealed class UpdateOrderStatusCommandHandler(
    IRepository<Order> orderRepo,
    IUnitOfWork unitOfWork,
    ILogger<UpdateOrderStatusCommandHandler> logger)
    : IRequestHandler<UpdateOrderStatusCommand, Result<OrderDto>>
{
    public async Task<Result<OrderDto>> Handle(UpdateOrderStatusCommand request, CancellationToken ct)
    {
        var order = await orderRepo.AsQueryable()
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct);

        if (order is null)
            return Result<OrderDto>.Failure("Pedido no encontrado");

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            return Result<OrderDto>.Failure("Estado de pedido no válido");

        // Validate state transitions
        if (!IsValidTransition(order.Status, newStatus))
            return Result<OrderDto>.Failure(
                $"Transición no válida: {order.Status} → {newStatus}");

        order.Status = newStatus;
        order.StatusHistory.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            Status = newStatus,
            Note = request.Note,
            Timestamp = DateTime.UtcNow,
            OrderId = order.Id,
        });

        order.AddDomainEvent(new OrderStatusChangedEvent(order.Id, newStatus.ToString()));
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Order status updated: {OrderNumber} → {Status}", order.OrderNumber, newStatus);
        return Result<OrderDto>.Success(OrderMapper.MapToDto(order));
    }

    private static bool IsValidTransition(OrderStatus current, OrderStatus target) => (current, target) switch
    {
        (OrderStatus.Pending, OrderStatus.Confirmed) => true,
        (OrderStatus.Pending, OrderStatus.Cancelled) => true,
        (OrderStatus.Confirmed, OrderStatus.Processing) => true,
        (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,
        (OrderStatus.Processing, OrderStatus.Shipped) => true,
        (OrderStatus.Processing, OrderStatus.Cancelled) => true,
        (OrderStatus.Shipped, OrderStatus.Delivered) => true,
        (OrderStatus.Delivered, OrderStatus.ReturnRequested) => true,
        (OrderStatus.ReturnRequested, OrderStatus.Returned) => true,
        (OrderStatus.Delivered, OrderStatus.Refunded) => true,
        (OrderStatus.Returned, OrderStatus.Refunded) => true,
        _ => false,
    };
}
