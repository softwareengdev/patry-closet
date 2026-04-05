using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Admin.DTOs;

namespace PatryCloset.Application.Features.Admin.Queries;

public sealed record GetDashboardStatsQuery : IRequest<Result<DashboardStatsDto>>;

public sealed record GetAdminUsersQuery(int Page = 1, int PageSize = 20, string? Search = null)
    : IRequest<Result<PaginatedList<AdminUserDto>>>;

public sealed record GetAdminOrdersQuery(int Page = 1, int PageSize = 20, string? Status = null, string? Search = null)
    : IRequest<Result<PaginatedList<AdminOrderDto>>>;
