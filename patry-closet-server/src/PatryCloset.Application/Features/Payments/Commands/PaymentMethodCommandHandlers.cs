using MediatR;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;

namespace PatryCloset.Application.Features.Payments.Commands;

public sealed class AddPaymentMethodCommandHandler(IPaymentMethodService paymentMethodService)
    : IRequestHandler<AddPaymentMethodCommand, Result<PaymentMethodResponse>>
{
    public async Task<Result<PaymentMethodResponse>> Handle(
        AddPaymentMethodCommand request, CancellationToken ct)
    {
        return await paymentMethodService.AddPaymentMethodAsync(
            request.UserId, request.StripePaymentMethodId, ct);
    }
}

public sealed class RemovePaymentMethodCommandHandler(IPaymentMethodService paymentMethodService)
    : IRequestHandler<RemovePaymentMethodCommand, Result>
{
    public async Task<Result> Handle(RemovePaymentMethodCommand request, CancellationToken ct)
    {
        return await paymentMethodService.RemovePaymentMethodAsync(
            request.UserId, request.PaymentMethodId, ct);
    }
}

public sealed class SetDefaultPaymentMethodCommandHandler(IPaymentMethodService paymentMethodService)
    : IRequestHandler<SetDefaultPaymentMethodCommand, Result>
{
    public async Task<Result> Handle(SetDefaultPaymentMethodCommand request, CancellationToken ct)
    {
        return await paymentMethodService.SetDefaultPaymentMethodAsync(
            request.UserId, request.PaymentMethodId, ct);
    }
}
