using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Wishlist.Commands;
using PatryCloset.Application.Features.Wishlist.DTOs;
using PatryCloset.Application.Features.Wishlist.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;
using System.Security.Claims;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/wishlist")]
[Authorize]
[Produces("application/json")]
public sealed class WishlistController(ISender mediator, IRepository<CustomerProfile> profileRepo) : ControllerBase
{
    /// <summary>Get user's wishlist.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<WishlistDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWishlist(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new GetWishlistQuery(profileId.Value, page, pageSize), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<WishlistDto>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Add product to wishlist.</summary>
    [HttpPost("{productId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<WishlistItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddToWishlist(Guid productId, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new AddToWishlistCommand(profileId.Value, productId), ct);
        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, ApiResponse<WishlistItemDto>.Ok(result.Value!, "Añadido a la lista de deseos"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Remove product from wishlist.</summary>
    [HttpDelete("{productId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveFromWishlist(Guid productId, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new RemoveFromWishlistCommand(profileId.Value, productId), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Eliminado de la lista de deseos"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Toggle product in wishlist (add/remove).</summary>
    [HttpPost("{productId:guid}/toggle")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleWishlist(Guid productId, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new ToggleWishlistCommand(profileId.Value, productId), ct);
        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!));

        var message = result.Value ? "Añadido a la lista de deseos" : "Eliminado de la lista de deseos";
        return Ok(ApiResponse<bool>.Ok(result.Value, message));
    }

    /// <summary>Check if product is in wishlist.</summary>
    [HttpGet("{productId:guid}/check")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> IsInWishlist(Guid productId, CancellationToken ct)
    {
        var profileId = await GetProfileId(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new IsInWishlistQuery(profileId.Value, productId), ct);
        return Ok(ApiResponse<bool>.Ok(result.Value));
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
