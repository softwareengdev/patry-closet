using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Payments.Commands;
using PatryCloset.Application.Features.Payments.DTOs;
using PatryCloset.Application.Features.Payments.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;
using System.Security.Claims;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/payments")]
[Authorize]
[Produces("application/json")]
[EnableRateLimiting("write")]
public sealed class PaymentsController(
    ISender mediator,
    IRepository<CustomerProfile> profileRepo)
    : ControllerBase
{
    /// <summary>
    /// Creates a checkout session: order + Stripe PaymentIntent.
    /// Returns clientSecret for Stripe.js confirmCardPayment.
    /// </summary>
    [HttpPost("checkout")]
    [ProducesResponseType(typeof(ApiResponse<CheckoutSessionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCheckout(
        [FromBody] CreateCheckoutRequest request, CancellationToken ct)
    {
        var (profileId, email) = await GetProfileInfo(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new CreateCheckoutSessionCommand(
            profileId.Value,
            email!,
            request.ShippingAddressId,
            request.ShippingMethod,
            request.CouponCode,
            request.Notes), ct);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created,
                ApiResponse<CheckoutSessionDto>.Ok(result.Value!, "Sesión de pago creada"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>
    /// Confirms payment after Stripe.js confirmCardPayment.
    /// Verifies PaymentIntent status and updates order accordingly.
    /// </summary>
    [HttpPost("{orderId:guid}/confirm")]
    [ProducesResponseType(typeof(ApiResponse<PaymentStatusDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmPayment(
        Guid orderId,
        [FromBody] ConfirmPaymentRequest request,
        CancellationToken ct)
    {
        var (profileId, _) = await GetProfileInfo(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(new ConfirmPaymentCommand(
            orderId, profileId.Value, request.PaymentIntentId), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<PaymentStatusDto>.Ok(result.Value!, "Pago verificado"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>
    /// Gets payment status for an order.
    /// </summary>
    [HttpGet("{orderId:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<PaymentStatusDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPaymentStatus(Guid orderId, CancellationToken ct)
    {
        var (profileId, _) = await GetProfileInfo(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(
            new GetPaymentStatusQuery(orderId, profileId.Value), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<PaymentStatusDto>.Ok(result.Value!))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>
    /// Cancels a pending payment and its associated order.
    /// </summary>
    [HttpPost("{orderId:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelPayment(Guid orderId, CancellationToken ct)
    {
        var (profileId, _) = await GetProfileInfo(ct);
        if (profileId is null) return Unauthorized();

        var result = await mediator.Send(
            new CancelPaymentCommand(orderId, profileId.Value), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Pago cancelado correctamente"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>
    /// Admin: Process refund for an order (full or partial).
    /// </summary>
    [HttpPost("{orderId:guid}/refund")]
    [Authorize(Policy = "ManagerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<RefundDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProcessRefund(
        Guid orderId,
        [FromBody] ProcessRefundRequest request,
        CancellationToken ct)
    {
        var result = await mediator.Send(
            new ProcessRefundCommand(orderId, request.Amount, request.Reason), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<RefundDto>.Ok(result.Value!, "Reembolso procesado"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    private async Task<(Guid? ProfileId, string? Email)> GetProfileInfo(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(userId)) return (null, null);

        var profile = await profileRepo.AsQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        return (profile?.Id, email);
    }

    private string? GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

    // ─── Saved Payment Methods ───

    /// <summary>
    /// Get all saved payment methods for the current user.
    /// </summary>
    [HttpGet("methods")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PaymentMethodResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentMethods(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await mediator.Send(new GetPaymentMethodsQuery(userId), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<IReadOnlyList<PaymentMethodResponse>>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>
    /// Add a payment method (Stripe PaymentMethod ID from frontend).
    /// </summary>
    [HttpPost("methods")]
    [ProducesResponseType(typeof(ApiResponse<PaymentMethodResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddPaymentMethod(
        [FromBody] AddPaymentMethodRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await mediator.Send(
            new AddPaymentMethodCommand(userId, request.ResolvedPaymentMethodId), ct);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created,
                ApiResponse<PaymentMethodResponse>.Ok(result.Value!, "Método de pago agregado"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>
    /// Remove a saved payment method.
    /// </summary>
    [HttpDelete("methods/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemovePaymentMethod(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await mediator.Send(
            new RemovePaymentMethodCommand(userId, id), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Método de pago eliminado"))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>
    /// Set a payment method as the default.
    /// </summary>
    [HttpPut("methods/{id:guid}/default")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDefaultPaymentMethod(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await mediator.Send(
            new SetDefaultPaymentMethodCommand(userId, id), ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Método de pago predeterminado actualizado"))
            : NotFound(ApiResponse<object>.Fail(result.Error!));
    }
}

public sealed record ConfirmPaymentRequest
{
    public required string PaymentIntentId { get; init; }
}
