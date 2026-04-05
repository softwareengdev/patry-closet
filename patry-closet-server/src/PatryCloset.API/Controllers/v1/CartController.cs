using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Cart.Commands;
using PatryCloset.Application.Features.Cart.DTOs;
using PatryCloset.Application.Features.Cart.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;
using System.Security.Claims;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cart")]
[Produces("application/json")]
public sealed class CartController(ISender mediator, IRepository<CustomerProfile> profileRepo) : ControllerBase
{
    private const string SessionCookieName = "PatryCloset-Session";

    /// <summary>Get current cart.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<CartDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCart(CancellationToken ct)
    {
        var (profileId, sessionId) = await ResolveCartIdentity(ct);
        var result = await mediator.Send(new GetCartQuery(profileId, sessionId), ct);
        return result.IsSuccess
            ? Ok(ApiResponse<CartDto>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Add item to cart.</summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(ApiResponse<CartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request, CancellationToken ct)
    {
        var (profileId, sessionId) = await ResolveCartIdentity(ct);
        var result = await mediator.Send(new AddToCartCommand(
            profileId, sessionId, request.ProductId, request.Color, request.Size, request.Quantity), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<CartDto>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Update cart item quantity.</summary>
    [HttpPut("items/{itemId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CartDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCartItem(
        Guid itemId, [FromBody] UpdateCartItemRequest request, CancellationToken ct)
    {
        var (profileId, sessionId) = await ResolveCartIdentity(ct);
        var result = await mediator.Send(new UpdateCartItemCommand(itemId, profileId, sessionId, request.Quantity), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<CartDto>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Remove item from cart.</summary>
    [HttpDelete("items/{itemId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CartDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveCartItem(Guid itemId, CancellationToken ct)
    {
        var (profileId, sessionId) = await ResolveCartIdentity(ct);
        var result = await mediator.Send(new RemoveCartItemCommand(itemId, profileId, sessionId), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<CartDto>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Clear all items from cart.</summary>
    [HttpDelete]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ClearCart(CancellationToken ct)
    {
        var (profileId, sessionId) = await ResolveCartIdentity(ct);
        var result = await mediator.Send(new ClearCartCommand(profileId, sessionId), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Carrito vaciado"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Merge guest cart into authenticated user cart (call after login).</summary>
    [HttpPost("merge")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<CartDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MergeCart(CancellationToken ct)
    {
        var profileId = await GetCustomerProfileId(ct);
        if (profileId is null)
            return Unauthorized(ApiResponse<object>.Fail("Usuario no encontrado"));

        var sessionId = GetOrCreateSessionId();
        var result = await mediator.Send(new MergeCartCommand(sessionId, profileId.Value), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<CartDto>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    private async Task<(Guid? ProfileId, string? SessionId)> ResolveCartIdentity(CancellationToken ct)
    {
        var profileId = await GetCustomerProfileId(ct);
        if (profileId.HasValue) return (profileId, null);

        return (null, GetOrCreateSessionId());
    }

    private async Task<Guid?> GetCustomerProfileId(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return null;

        var profile = await profileRepo.AsQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return profile?.Id;
    }

    private string GetOrCreateSessionId()
    {
        if (Request.Cookies.TryGetValue(SessionCookieName, out var sessionId) && !string.IsNullOrEmpty(sessionId))
            return sessionId;

        sessionId = Guid.NewGuid().ToString();
        Response.Cookies.Append(SessionCookieName, sessionId, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromDays(30),
        });
        return sessionId;
    }
}
