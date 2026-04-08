using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Reviews.DTOs;

namespace PatryCloset.Application.Features.Reviews.Queries;

public sealed record GetProductReviewsQuery(
    Guid ProductId,
    int Page = 1,
    int PageSize = 10
) : IRequest<Result<PaginatedList<ReviewDto>>>;

public sealed record GetUserReviewsQuery(
    string UserId,
    int Page = 1,
    int PageSize = 10
) : IRequest<Result<PaginatedList<ReviewDto>>>;

public sealed record GetReviewSummaryQuery(
    Guid ProductId
) : IRequest<Result<ReviewSummaryDto>>;
