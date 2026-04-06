using MediatR;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;

namespace PatryCloset.Application.Features.Payments.Queries;

public sealed class GetPaymentMethodsQueryHandler(IPaymentMethodService paymentMethodService)
    : IRequestHandler<GetPaymentMethodsQuery, Result<IReadOnlyList<PaymentMethodResponse>>>
{
    public async Task<Result<IReadOnlyList<PaymentMethodResponse>>> Handle(
        GetPaymentMethodsQuery request, CancellationToken ct)
    {
        return await paymentMethodService.GetPaymentMethodsAsync(request.UserId, ct);
    }
}
