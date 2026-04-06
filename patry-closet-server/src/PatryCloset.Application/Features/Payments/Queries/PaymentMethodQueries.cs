using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;

namespace PatryCloset.Application.Features.Payments.Queries;

public sealed record GetPaymentMethodsQuery(string UserId)
    : IRequest<Result<IReadOnlyList<PaymentMethodResponse>>>;
