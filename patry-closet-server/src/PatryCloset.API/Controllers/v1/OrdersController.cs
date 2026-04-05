using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Orders.Commands;
using PatryCloset.Application.Features.Orders.DTOs;
using PatryCloset.Application.Features.Orders.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;
using System.Security.Claims;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/orders")]
[Authorize]
[Produces("application/json")]
public sealed class OrdersController(ISender mediator, IRepository<CustomerProfile> profileRepo) : ControllerBase
{
    /// <summary>Get current user's orders.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OrderSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string sortBy = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var filters = new OrderFilterParams
        {
            Status = status,
            FromDate = fromDate,
            ToDate = toDate,
            SortBy = sortBy,
            Page = page,
            PageSize = pageSize,
        };

        var result = await mediator.Send(new GetOrdersQuery(profileId.Value, filters), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        var paginated = result.Value!;
        return Ok(ApiResponse<IReadOnlyList<OrderSummaryDto>>.Ok(
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

    /// <summary>Get order detail by ID.</summary>
    [HttpGet("{orderId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById(Guid orderId, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new GetOrderByIdQuery(orderId, profileId.Value), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<OrderDto>.Ok(result.Value!))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Create a new order from the current cart.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new CreateOrderCommand(
            profileId.Value,
            request.ShippingAddressId,
            request.ShippingMethod,
            request.CouponCode,
            request.Notes), ct);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created,
                ApiResponse<OrderDto>.Ok(result.Value!, "Pedido creado correctamente"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Cancel an order (only if Pending or Confirmed).</summary>
    [HttpPost("{orderId:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelOrder(
        Guid orderId, [FromBody] CancelOrderRequest? request, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new CancelOrderCommand(orderId, profileId.Value, request?.Reason), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Pedido cancelado correctamente"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    // ─── Admin Endpoints ───

    /// <summary>Get all orders (Admin/Manager only).</summary>
    [HttpGet("admin/all")]
    [Authorize(Policy = "ManagerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OrderSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllOrders(
        [FromQuery] string? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var filters = new OrderFilterParams
        {
            Status = status, FromDate = fromDate, ToDate = toDate, Page = page, PageSize = pageSize,
        };

        var result = await mediator.Send(new GetAllOrdersQuery(filters), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        var paginated = result.Value!;
        return Ok(ApiResponse<IReadOnlyList<OrderSummaryDto>>.Ok(
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

    /// <summary>Update order status (Admin/Manager only).</summary>
    [HttpPut("{orderId:guid}/status")]
    [Authorize(Policy = "ManagerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateOrderStatus(
        Guid orderId, [FromBody] UpdateOrderStatusRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(
            new UpdateOrderStatusCommand(orderId, request.Status, request.Note), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<OrderDto>.Ok(result.Value!, "Estado del pedido actualizado"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    private async Task<Guid?> GetProfileId(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return null;
        var profile = await profileRepo.AsQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return profile?.Id;
    }
}

public sealed record CancelOrderRequest
{
    public string? Reason { get; init; }
}
