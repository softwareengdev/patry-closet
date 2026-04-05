using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Orders.DTOs;

namespace PatryCloset.Application.Features.Orders.Commands;

// ─── Create Order (from cart) ───

public sealed record CreateOrderCommand(
    Guid CustomerProfileId,
    Guid ShippingAddressId,
    string ShippingMethod = "Standard",
    string? CouponCode = null,
    string? Notes = null)
    : IRequest<Result<OrderDto>>;

public sealed class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.CustomerProfileId).NotEmpty();
        RuleFor(x => x.ShippingAddressId).NotEmpty().WithMessage("La dirección de envío es obligatoria");
        RuleFor(x => x.ShippingMethod).NotEmpty().WithMessage("El método de envío es obligatorio")
            .Must(m => new[] { "Standard", "Express", "NextDay", "StorePickup" }.Contains(m))
            .WithMessage("Método de envío no válido");
    }
}

// ─── Cancel Order ───

public sealed record CancelOrderCommand(Guid OrderId, Guid CustomerProfileId, string? Reason = null)
    : IRequest<Result>;

public sealed class CancelOrderCommandValidator : AbstractValidator<CancelOrderCommand>
{
    public CancelOrderCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.CustomerProfileId).NotEmpty();
    }
}

// ─── Admin: Update Order Status ───

public sealed record UpdateOrderStatusCommand(Guid OrderId, string Status, string? Note = null)
    : IRequest<Result<OrderDto>>;

public sealed class UpdateOrderStatusCommandValidator : AbstractValidator<UpdateOrderStatusCommand>
{
    public UpdateOrderStatusCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.Status).NotEmpty()
            .Must(s => new[] { "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded" }.Contains(s))
            .WithMessage("Estado de pedido no válido");
    }
}
