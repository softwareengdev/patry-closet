using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;

namespace PatryCloset.Application.Features.Payments.Commands;

// ─── Create Checkout Session (Order + PaymentIntent in one atomic operation) ───

public sealed record CreateCheckoutSessionCommand(
    Guid CustomerProfileId,
    string CustomerEmail,
    Guid ShippingAddressId,
    string ShippingMethod = "Standard",
    string? CouponCode = null,
    string? Notes = null)
    : IRequest<Result<CheckoutSessionDto>>;

public sealed class CreateCheckoutSessionCommandValidator : AbstractValidator<CreateCheckoutSessionCommand>
{
    public CreateCheckoutSessionCommandValidator()
    {
        RuleFor(x => x.CustomerProfileId).NotEmpty();
        RuleFor(x => x.CustomerEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.ShippingAddressId).NotEmpty()
            .WithMessage("La dirección de envío es obligatoria");
        RuleFor(x => x.ShippingMethod).NotEmpty()
            .Must(m => new[] { "Standard", "Express", "NextDay", "StorePickup" }.Contains(m))
            .WithMessage("Método de envío no válido");
    }
}

// ─── Confirm Payment (verify payment succeeded, update order) ───

public sealed record ConfirmPaymentCommand(
    Guid OrderId,
    Guid CustomerProfileId,
    string PaymentIntentId)
    : IRequest<Result<PaymentStatusDto>>;

public sealed class ConfirmPaymentCommandValidator : AbstractValidator<ConfirmPaymentCommand>
{
    public ConfirmPaymentCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.CustomerProfileId).NotEmpty();
        RuleFor(x => x.PaymentIntentId).NotEmpty()
            .Must(id => id.StartsWith("pi_"))
            .WithMessage("PaymentIntent ID inválido");
    }
}

// ─── Process Refund (Admin) ───

public sealed record ProcessRefundCommand(
    Guid OrderId,
    decimal? Amount = null,
    string? Reason = null)
    : IRequest<Result<RefundDto>>;

public sealed class ProcessRefundCommandValidator : AbstractValidator<ProcessRefundCommand>
{
    public ProcessRefundCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.Amount)
            .GreaterThan(0).When(x => x.Amount.HasValue)
            .WithMessage("El monto del reembolso debe ser mayor a 0");
    }
}

// ─── Cancel Payment (cancel PaymentIntent before capture) ───

public sealed record CancelPaymentCommand(
    Guid OrderId,
    Guid CustomerProfileId)
    : IRequest<Result>;

public sealed class CancelPaymentCommandValidator : AbstractValidator<CancelPaymentCommand>
{
    public CancelPaymentCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.CustomerProfileId).NotEmpty();
    }
}
