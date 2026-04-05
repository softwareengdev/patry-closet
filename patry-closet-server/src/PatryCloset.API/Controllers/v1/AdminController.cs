using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Admin.Commands;
using PatryCloset.Application.Features.Admin.DTOs;
using PatryCloset.Application.Features.Admin.Queries;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin")]
[Authorize(Policy = "ManagerOrAdmin")]
[Produces("application/json")]
[EnableRateLimiting("admin")]
public sealed class AdminController(ISender mediator) : ControllerBase
{
    /// <summary>Get admin dashboard statistics.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        var result = await mediator.Send(new GetDashboardStatsQuery(), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<DashboardStatsDto>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>List all users with pagination and search.</summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AdminUserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminUsersQuery(page, pageSize, search), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        var paginated = result.Value!;
        return Ok(ApiResponse<IReadOnlyList<AdminUserDto>>.Ok(
            paginated.Items,
            new PaginationMeta
            {
                CurrentPage = paginated.PageNumber,
                TotalPages = paginated.TotalPages,
                PageSize = paginated.PageSize,
                TotalCount = paginated.TotalCount,
                HasPrevious = paginated.HasPreviousPage,
                HasNext = paginated.HasNextPage,
            }));
    }

    /// <summary>Update a user's role (Admin only).</summary>
    [HttpPut("users/{userId}/role")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateUserRole(
        string userId, [FromBody] UpdateUserRoleRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateUserRoleCommand(userId, request.Role), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, $"User role updated to {request.Role}"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Lock or unlock a user account (Admin only).</summary>
    [HttpPut("users/{userId}/lock")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleUserLock(
        string userId, [FromQuery] bool locked = true, CancellationToken ct = default)
    {
        var result = await mediator.Send(new ToggleUserLockCommand(userId, locked), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, locked ? "User locked" : "User unlocked"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>List all orders with filtering, search, and pagination.</summary>
    [HttpGet("orders")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AdminOrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminOrdersQuery(page, pageSize, status, search), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        var paginated = result.Value!;
        return Ok(ApiResponse<IReadOnlyList<AdminOrderDto>>.Ok(
            paginated.Items,
            new PaginationMeta
            {
                CurrentPage = paginated.PageNumber,
                TotalPages = paginated.TotalPages,
                PageSize = paginated.PageSize,
                TotalCount = paginated.TotalCount,
                HasPrevious = paginated.HasPreviousPage,
                HasNext = paginated.HasNextPage,
            }));
    }

    /// <summary>Update order status with optional tracking number.</summary>
    [HttpPut("orders/{orderId:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateOrderStatus(
        Guid orderId, [FromBody] AdminUpdateOrderStatusRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(
            new AdminUpdateOrderStatusCommand(orderId, request.Status, request.TrackingNumber, request.Notes), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, $"Order status updated to {request.Status}"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }
}
