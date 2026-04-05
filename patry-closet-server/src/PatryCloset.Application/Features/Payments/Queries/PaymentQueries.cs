using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.DTOs;

namespace PatryCloset.Application.Features.Payments.Queries;

// ─── Get Payment Status for an Order ───

public sealed record GetPaymentStatusQuery(
    Guid OrderId,
    Guid CustomerProfileId)
    : IRequest<Result<PaymentStatusDto>>;

public sealed class GetPaymentStatusQueryValidator : AbstractValidator<GetPaymentStatusQuery>
{
    public GetPaymentStatusQueryValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.CustomerProfileId).NotEmpty();
    }
}
