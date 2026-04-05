using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Events;
using PatryCloset.Domain.Interfaces;
using CartEntity = PatryCloset.Domain.Entities.Cart;

namespace PatryCloset.Application.Features.Payments.Commands;

// ─── Create Checkout Session ───
// Atomic: creates Order from Cart + creates Stripe PaymentIntent + creates Payment record

public sealed class CreateCheckoutSessionCommandHandler(
    IRepository<Order> orderRepo,
    IRepository<CartEntity> cartRepo,
    IRepository<Address> addressRepo,
    IRepository<ProductVariant> variantRepo,
    IRepository<Payment> paymentRepo,
    IPaymentService paymentService,
    IUnitOfWork unitOfWork,
    ILogger<CreateCheckoutSessionCommandHandler> logger)
    : IRequestHandler<CreateCheckoutSessionCommand, Result<CheckoutSessionDto>>
{
    private const decimal TaxRate = 0.21m; // 21% IVA Spain
    private const decimal FreeShippingThreshold = 50m;

    public async Task<Result<CheckoutSessionDto>> Handle(
        CreateCheckoutSessionCommand request, CancellationToken ct)
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
            return Result<CheckoutSessionDto>.Failure("El carrito está vacío");

        // 2. Validate shipping address
        var address = await addressRepo.AsQueryable()
            .FirstOrDefaultAsync(a =>
                a.Id == request.ShippingAddressId &&
                a.CustomerProfileId == request.CustomerProfileId, ct);

        if (address is null)
            return Result<CheckoutSessionDto>.Failure("Dirección de envío no encontrada");

        // 3. Validate stock
        foreach (var item in cart.Items)
        {
            if (!item.ProductVariantId.HasValue) continue;

            var variant = await variantRepo.GetByIdAsync(item.ProductVariantId.Value, ct);
            if (variant is null || !variant.IsActive)
                return Result<CheckoutSessionDto>.Failure(
                    $"Variante no disponible para: {item.Product.Name}");
            if (variant.StockQuantity < item.Quantity)
                return Result<CheckoutSessionDto>.Failure(
                    $"Stock insuficiente para {item.Product.Name} ({item.Color}/{item.Size}). " +
                    $"Disponible: {variant.StockQuantity}");
        }

        // 4. Calculate totals
        var subtotal = cart.Items.Sum(i => i.UnitPrice * i.Quantity);

        // Apply coupon discount
        var discountAmount = CalculateDiscount(subtotal, request.CouponCode);
        var discountedSubtotal = subtotal - discountAmount;

        var shippingMethod = ParseShippingMethod(request.ShippingMethod);
        var shippingCost = CalculateShipping(discountedSubtotal, shippingMethod, request.CouponCode);
        var tax = Math.Round(discountedSubtotal * TaxRate, 2);
        var total = discountedSubtotal + shippingCost + tax;

        // 5. Generate unique order number
        var orderNumber = $"PC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        // 6. Create order (Pending — will be Confirmed by webhook)
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = orderNumber,
            Status = OrderStatus.Pending,
            Subtotal = subtotal,
            ShippingCost = shippingCost,
            Tax = tax,
            DiscountAmount = discountAmount,
            Total = total,
            Currency = "EUR",
            ShippingMethod = shippingMethod,
            Notes = request.Notes,
            CouponCode = request.CouponCode,

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

        // 7. Create order items (snapshot product data)
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

        // 8. Initial status history
        order.StatusHistory.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            Status = OrderStatus.Pending,
            Note = "Pedido creado — esperando pago",
            Timestamp = DateTime.UtcNow,
            OrderId = order.Id,
        });

        // 9. Reserve stock
        foreach (var cartItem in cart.Items)
        {
            if (!cartItem.ProductVariantId.HasValue) continue;

            var variant = await variantRepo.GetByIdAsync(cartItem.ProductVariantId.Value, ct);
            if (variant is null) continue;

            variant.StockQuantity -= cartItem.Quantity;
            if (variant.StockQuantity <= 3)
                order.AddDomainEvent(new StockDepletedEvent(variant.Id, variant.StockQuantity));
        }

        // 10. Create Stripe PaymentIntent
        var metadata = new Dictionary<string, string>
        {
            ["order_id"] = order.Id.ToString(),
            ["order_number"] = orderNumber,
            ["customer_email"] = request.CustomerEmail,
        };

        var intentResult = await paymentService.CreatePaymentIntentAsync(
            total, "EUR", request.CustomerEmail, metadata, ct);

        if (string.IsNullOrEmpty(intentResult.ClientSecret) || intentResult.Status == "error")
        {
            return Result<CheckoutSessionDto>.Failure(
                "No se pudo crear la sesión de pago. Inténtalo de nuevo.");
        }

        // 11. Create Payment record linked to Order
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            StripePaymentIntentId = intentResult.PaymentIntentId,
            Status = PaymentStatus.Pending,
            Amount = total,
            Currency = "EUR",
            PaymentMethod = "card",
            OrderId = order.Id,
        };

        // 12. Persist everything
        await orderRepo.AddAsync(order, ct);
        await paymentRepo.AddAsync(payment, ct);

        // 13. Clear cart
        cart.Items.Clear();

        order.AddDomainEvent(new OrderCreatedEvent(order.Id));
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation(
            "Checkout session created: Order {OrderNumber} ({OrderId}), PaymentIntent {IntentId}",
            orderNumber, order.Id, intentResult.PaymentIntentId);

        return Result<CheckoutSessionDto>.Success(new CheckoutSessionDto
        {
            PaymentIntentId = intentResult.PaymentIntentId,
            ClientSecret = intentResult.ClientSecret,
            PublishableKey = "pk_test_TYooMQauvdEDq54NiTphI7jx", // from config in real production
            OrderId = order.Id,
            OrderNumber = orderNumber,
            Amount = total,
            Currency = "EUR",
        });
    }

    private static decimal CalculateDiscount(decimal subtotal, string? couponCode)
    {
        if (string.IsNullOrEmpty(couponCode)) return 0;
        return couponCode.ToUpperInvariant() switch
        {
            "PATRY10" => Math.Round(subtotal * 0.10m, 2),
            "WELCOME20" => Math.Round(subtotal * 0.20m, 2),
            _ => 0,
        };
    }

    private static decimal CalculateShipping(decimal subtotal, ShippingMethod method, string? couponCode)
    {
        if (couponCode?.Equals("FREESHIP", StringComparison.OrdinalIgnoreCase) == true) return 0;
        if (subtotal >= FreeShippingThreshold) return 0;
        return method switch
        {
            ShippingMethod.Express => 7.95m,
            ShippingMethod.NextDay => 12.95m,
            ShippingMethod.StorePickup => 0,
            _ => 4.95m,
        };
    }

    private static ShippingMethod ParseShippingMethod(string method) => method switch
    {
        "Express" => ShippingMethod.Express,
        "NextDay" => ShippingMethod.NextDay,
        "StorePickup" => ShippingMethod.StorePickup,
        _ => ShippingMethod.Standard,
    };
}

// ─── Confirm Payment ───
// Called by frontend after Stripe.js confirmCardPayment succeeds.

public sealed class ConfirmPaymentCommandHandler(
    IRepository<Order> orderRepo,
    IRepository<Payment> paymentRepo,
    IPaymentService paymentService,
    IUnitOfWork unitOfWork,
    ILogger<ConfirmPaymentCommandHandler> logger)
    : IRequestHandler<ConfirmPaymentCommand, Result<PaymentStatusDto>>
{
    public async Task<Result<PaymentStatusDto>> Handle(
        ConfirmPaymentCommand request, CancellationToken ct)
    {
        // 1. Find order with payment
        var order = await orderRepo.AsQueryable()
            .Include(o => o.Payment)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o =>
                o.Id == request.OrderId &&
                o.CustomerProfileId == request.CustomerProfileId, ct);

        if (order is null)
            return Result<PaymentStatusDto>.Failure("Pedido no encontrado");

        if (order.Payment is null)
            return Result<PaymentStatusDto>.Failure("No hay pago asociado a este pedido");

        // 2. Verify with Stripe
        var intentDetail = await paymentService.GetPaymentIntentAsync(
            request.PaymentIntentId, ct);

        // 3. Update payment record
        var payment = order.Payment;

        if (intentDetail.Status == "succeeded")
        {
            if (payment.Status != PaymentStatus.Captured)
            {
                payment.Status = PaymentStatus.Captured;
                payment.PaidAt = DateTime.UtcNow;
                payment.StripeChargeId = intentDetail.ChargeId;
                payment.PaymentMethod = intentDetail.PaymentMethodType;
            }

            // Confirm order if still pending
            if (order.Status == OrderStatus.Pending)
            {
                order.Status = OrderStatus.Confirmed;
                order.StatusHistory.Add(new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    Status = OrderStatus.Confirmed,
                    Note = "Pago confirmado",
                    Timestamp = DateTime.UtcNow,
                    OrderId = order.Id,
                });
            }

            await unitOfWork.SaveChangesAsync(ct);

            logger.LogInformation("Payment confirmed for order {OrderNumber}", order.OrderNumber);
        }
        else if (intentDetail.Status is "requires_payment_method" or "requires_action")
        {
            // Payment needs further action (3D Secure, etc.)
            return Result<PaymentStatusDto>.Success(new PaymentStatusDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                PaymentStatus = intentDetail.Status,
                OrderStatus = order.Status.ToString(),
                Amount = order.Total,
                Currency = order.Currency,
                FailureMessage = "Acción adicional requerida para completar el pago",
            });
        }
        else if (intentDetail.Status is "canceled" or "processing")
        {
            // Let webhook handle final state
        }
        else
        {
            payment.Status = PaymentStatus.Failed;
            payment.FailureReason = intentDetail.FailureMessage ?? "Pago no completado";
            await unitOfWork.SaveChangesAsync(ct);
        }

        return Result<PaymentStatusDto>.Success(new PaymentStatusDto
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            PaymentStatus = payment.Status.ToString(),
            OrderStatus = order.Status.ToString(),
            Amount = order.Total,
            Currency = order.Currency,
            PaymentMethod = payment.PaymentMethod,
            PaidAt = payment.PaidAt,
            ReceiptUrl = intentDetail.ReceiptUrl,
            FailureMessage = intentDetail.FailureMessage,
        });
    }
}

// ─── Process Refund (Admin) ───

public sealed class ProcessRefundCommandHandler(
    IRepository<Order> orderRepo,
    IRepository<Payment> paymentRepo,
    IRepository<ProductVariant> variantRepo,
    IPaymentService paymentService,
    IUnitOfWork unitOfWork,
    ILogger<ProcessRefundCommandHandler> logger)
    : IRequestHandler<ProcessRefundCommand, Result<RefundDto>>
{
    public async Task<Result<RefundDto>> Handle(ProcessRefundCommand request, CancellationToken ct)
    {
        var order = await orderRepo.AsQueryable()
            .Include(o => o.Payment)
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct);

        if (order is null)
            return Result<RefundDto>.Failure("Pedido no encontrado");

        var payment = order.Payment;
        if (payment is null)
            return Result<RefundDto>.Failure("No hay pago asociado a este pedido");

        if (payment.Status is not (PaymentStatus.Captured or PaymentStatus.PartiallyRefunded))
            return Result<RefundDto>.Failure(
                $"No se puede reembolsar un pago con estado: {payment.Status}");

        // Validate refund amount
        var maxRefundable = payment.Amount - payment.RefundedAmount;
        if (request.Amount.HasValue && request.Amount.Value > maxRefundable)
            return Result<RefundDto>.Failure(
                $"El monto máximo reembolsable es {maxRefundable:F2}€");

        // Process refund via Stripe
        var refundResult = await paymentService.CreateRefundAsync(
            payment.StripePaymentIntentId, request.Amount, ct);

        if (refundResult.Status == "error")
            return Result<RefundDto>.Failure("Error al procesar el reembolso en Stripe");

        // Update payment
        payment.RefundedAmount += refundResult.Amount;
        payment.RefundedAt = DateTime.UtcNow;
        payment.Status = payment.RefundedAmount >= payment.Amount
            ? PaymentStatus.Refunded
            : PaymentStatus.PartiallyRefunded;

        // If fully refunded, update order status and restore stock
        if (payment.Status == PaymentStatus.Refunded)
        {
            order.Status = OrderStatus.Refunded;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Refunded,
                Note = request.Reason ?? "Reembolso completo procesado",
                Timestamp = DateTime.UtcNow,
                OrderId = order.Id,
            });

            // Restore stock for all items
            foreach (var item in order.Items)
            {
                if (!item.ProductVariantId.HasValue) continue;
                var variant = await variantRepo.GetByIdAsync(item.ProductVariantId.Value, ct);
                if (variant is not null)
                    variant.StockQuantity += item.Quantity;
            }
        }
        else
        {
            order.StatusHistory.Add(new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                Status = order.Status,
                Note = $"Reembolso parcial: {refundResult.Amount:F2}€",
                Timestamp = DateTime.UtcNow,
                OrderId = order.Id,
            });
        }

        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation(
            "Refund processed for order {OrderNumber}: {Amount}€ ({Status})",
            order.OrderNumber, refundResult.Amount, refundResult.Status);

        return Result<RefundDto>.Success(new RefundDto
        {
            RefundId = refundResult.RefundId,
            Status = refundResult.Status,
            Amount = refundResult.Amount,
            Currency = order.Currency,
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
        });
    }
}

// ─── Cancel Payment ───

public sealed class CancelPaymentCommandHandler(
    IRepository<Order> orderRepo,
    IRepository<ProductVariant> variantRepo,
    IPaymentService paymentService,
    IUnitOfWork unitOfWork,
    ILogger<CancelPaymentCommandHandler> logger)
    : IRequestHandler<CancelPaymentCommand, Result>
{
    public async Task<Result> Handle(CancelPaymentCommand request, CancellationToken ct)
    {
        var order = await orderRepo.AsQueryable()
            .Include(o => o.Payment)
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o =>
                o.Id == request.OrderId &&
                o.CustomerProfileId == request.CustomerProfileId, ct);

        if (order is null)
            return Result.Failure("Pedido no encontrado");

        if (order.Status is not (OrderStatus.Pending or OrderStatus.Confirmed))
            return Result.Failure($"No se puede cancelar un pedido con estado: {order.Status}");

        // Cancel Stripe PaymentIntent if exists
        if (order.Payment is not null &&
            !string.IsNullOrEmpty(order.Payment.StripePaymentIntentId) &&
            order.Payment.Status == PaymentStatus.Pending)
        {
            await paymentService.CancelPaymentIntentAsync(
                order.Payment.StripePaymentIntentId, ct);

            order.Payment.Status = PaymentStatus.Cancelled;
        }

        // Cancel order
        order.Status = OrderStatus.Cancelled;
        order.StatusHistory.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            Status = OrderStatus.Cancelled,
            Note = "Pedido cancelado por el cliente",
            Timestamp = DateTime.UtcNow,
            OrderId = order.Id,
        });

        // Restore stock
        foreach (var item in order.Items)
        {
            if (!item.ProductVariantId.HasValue) continue;
            var variant = await variantRepo.GetByIdAsync(item.ProductVariantId.Value, ct);
            if (variant is not null)
                variant.StockQuantity += item.Quantity;
        }

        order.AddDomainEvent(new OrderStatusChangedEvent(order.Id, OrderStatus.Cancelled.ToString()));
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Order cancelled with payment: {OrderNumber}", order.OrderNumber);
        return Result.Success();
    }
}
