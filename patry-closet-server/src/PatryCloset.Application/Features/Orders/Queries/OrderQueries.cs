using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Orders.DTOs;

namespace PatryCloset.Application.Features.Orders.Queries;

// ─── Get User Orders (paginated) ───

public sealed record GetOrdersQuery(Guid CustomerProfileId, OrderFilterParams Filters)
    : IRequest<Result<PaginatedList<OrderSummaryDto>>>;

public sealed class GetOrdersQueryValidator : AbstractValidator<GetOrdersQuery>
{
    public GetOrdersQueryValidator()
    {
        RuleFor(x => x.CustomerProfileId).NotEmpty();
        RuleFor(x => x.Filters.Page).GreaterThan(0);
        RuleFor(x => x.Filters.PageSize).InclusiveBetween(1, 100);
    }
}

// ─── Get Single Order ───

public sealed record GetOrderByIdQuery(Guid OrderId, Guid CustomerProfileId)
    : IRequest<Result<OrderDto>>;

// ─── Admin: Get All Orders ───

public sealed record GetAllOrdersQuery(OrderFilterParams Filters)
    : IRequest<Result<PaginatedList<OrderSummaryDto>>>;

public sealed class GetAllOrdersQueryValidator : AbstractValidator<GetAllOrdersQuery>
{
    public GetAllOrdersQueryValidator()
    {
        RuleFor(x => x.Filters.Page).GreaterThan(0);
        RuleFor(x => x.Filters.PageSize).InclusiveBetween(1, 100);
    }
}
