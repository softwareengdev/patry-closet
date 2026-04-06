using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;

namespace PatryCloset.Application.Common.Interfaces;

public interface IPaymentMethodService
{
    Task<Result<PaymentMethodResponse>> AddPaymentMethodAsync(
        string userId, string stripePaymentMethodId, CancellationToken ct = default);

    Task<Result> RemovePaymentMethodAsync(
        string userId, Guid paymentMethodId, CancellationToken ct = default);

    Task<Result> SetDefaultPaymentMethodAsync(
        string userId, Guid paymentMethodId, CancellationToken ct = default);

    Task<Result<IReadOnlyList<PaymentMethodResponse>>> GetPaymentMethodsAsync(
        string userId, CancellationToken ct = default);
}
