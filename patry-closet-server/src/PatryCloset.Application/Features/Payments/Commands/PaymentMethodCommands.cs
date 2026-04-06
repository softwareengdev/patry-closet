using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;

namespace PatryCloset.Application.Features.Payments.Commands;

// ─── Add Payment Method ───

public sealed record AddPaymentMethodCommand(
    string UserId,
    string StripePaymentMethodId
) : IRequest<Result<PaymentMethodResponse>>;

public sealed class AddPaymentMethodCommandValidator : AbstractValidator<AddPaymentMethodCommand>
{
    public AddPaymentMethodCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.StripePaymentMethodId).NotEmpty()
            .Must(id => id.StartsWith("pm_"))
            .WithMessage("PaymentMethod ID inválido");
    }
}

// ─── Remove Payment Method ───

public sealed record RemovePaymentMethodCommand(
    string UserId,
    Guid PaymentMethodId
) : IRequest<Result>;

public sealed class RemovePaymentMethodCommandValidator : AbstractValidator<RemovePaymentMethodCommand>
{
    public RemovePaymentMethodCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PaymentMethodId).NotEmpty();
    }
}

// ─── Set Default Payment Method ───

public sealed record SetDefaultPaymentMethodCommand(
    string UserId,
    Guid PaymentMethodId
) : IRequest<Result>;

public sealed class SetDefaultPaymentMethodCommandValidator : AbstractValidator<SetDefaultPaymentMethodCommand>
{
    public SetDefaultPaymentMethodCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PaymentMethodId).NotEmpty();
    }
}
