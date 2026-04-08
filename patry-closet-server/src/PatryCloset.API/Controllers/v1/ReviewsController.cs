using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Reviews.Commands;
using PatryCloset.Application.Features.Reviews.DTOs;
using PatryCloset.Application.Features.Reviews.Queries;
using PatryCloset.Domain.Interfaces;

namespace PatryCloset.API.Controllers.v1;

/// <summary>Endpoints for managing product reviews.</summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/reviews")]
[Produces("application/json")]
public sealed class ReviewsController(ISender mediator, ICurrentUserService currentUser) : ControllerBase
{
    /// <summary>Get paginated reviews for a product (public).</summary>
    [HttpGet("product/{productId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedList<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductReviews(
        Guid productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetProductReviewsQuery(productId, page, pageSize), ct);

        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        var paginated = result.Value!;
        return Ok(ApiResponse<IReadOnlyList<ReviewDto>>.Ok(
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

    /// <summary>Get review summary/statistics for a product (public).</summary>
    [HttpGet("product/{productId:guid}/summary")]
    [ProducesResponseType(typeof(ApiResponse<ReviewSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReviewSummary(Guid productId, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetReviewSummaryQuery(productId), ct);

        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        return Ok(ApiResponse<ReviewSummaryDto>.Ok(result.Value!));
    }

    /// <summary>Get current user's reviews (authenticated).</summary>
    [HttpGet("me")]
    [Authorize(Policy = "CustomerOrAbove")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedList<ReviewDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var userId = currentUser.UserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("No autenticado"));

        var result = await mediator.Send(new GetUserReviewsQuery(userId, page, pageSize), ct);

        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        var paginated = result.Value!;
        return Ok(ApiResponse<IReadOnlyList<ReviewDto>>.Ok(
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

    /// <summary>Create a review for a product (authenticated).</summary>
    [HttpPost]
    [Authorize(Policy = "CustomerOrAbove")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateReview(
        [FromBody] CreateReviewRequest request, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("No autenticado"));

        var result = await mediator.Send(new CreateReviewCommand(
            request.ProductId, request.Rating, request.Title, request.Comment, userId), ct);

        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));

        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ReviewDto>.Ok(result.Value!, "Reseña creada correctamente"));
    }

    /// <summary>Update your own review (authenticated).</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CustomerOrAbove")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateReview(
        Guid id, [FromBody] UpdateReviewRequest request, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("No autenticado"));

        var result = await mediator.Send(new UpdateReviewCommand(
            id, request.Rating, request.Title, request.Comment, userId), ct);

        if (!result.IsSuccess)
        {
            return result.Error!.Contains("no encontrada")
                ? NotFound(ApiResponse<object>.Fail(result.Error))
                : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
        }

        return Ok(ApiResponse<ReviewDto>.Ok(result.Value!, "Reseña actualizada correctamente"));
    }

    /// <summary>Delete your own review (authenticated, or admin can delete any).</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "CustomerOrAbove")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteReview(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("No autenticado"));

        var result = await mediator.Send(new DeleteReviewCommand(id, userId), ct);

        if (!result.IsSuccess)
        {
            return result.Error!.Contains("no encontrada")
                ? NotFound(ApiResponse<object>.Fail(result.Error))
                : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
        }

        return Ok(ApiResponse<object>.Ok(null!, "Reseña eliminada correctamente"));
    }

    /// <summary>Moderate a review — approve or reject (admin only).</summary>
    [HttpPut("{id:guid}/moderate")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ModerateReview(
        Guid id, [FromBody] ModerateReviewRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new ModerateReviewCommand(id, request.IsApproved), ct);

        if (!result.IsSuccess)
        {
            return result.Error!.Contains("no encontrada")
                ? NotFound(ApiResponse<object>.Fail(result.Error))
                : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
        }

        var status = request.IsApproved ? "aprobada" : "rechazada";
        return Ok(ApiResponse<object>.Ok(null!, $"Reseña {status} correctamente"));
    }
}

/// <summary>Request body for the moderate review endpoint.</summary>
public sealed record ModerateReviewRequest
{
    public required bool IsApproved { get; init; }
}
