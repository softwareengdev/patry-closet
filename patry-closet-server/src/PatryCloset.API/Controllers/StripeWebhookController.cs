using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Interfaces;
using PatryCloset.Infrastructure.Payments;

namespace PatryCloset.API.Controllers;

/// <summary>
/// Stripe webhook endpoint. NOT versioned, NOT authenticated.
/// Stripe sends POST requests here when payment events occur.
/// Signature verification handles security.
/// </summary>
[ApiController]
[Route("api/webhooks/stripe")]
[ApiExplorerSettings(GroupName = "webhooks")]
[EnableRateLimiting("webhook")]
public sealed class StripeWebhookController(
    StripeWebhookHandler webhookHandler,
    IRepository<Payment> paymentRepo,
    IRepository<Order> orderRepo,
    IUnitOfWork unitOfWork,
    ILogger<StripeWebhookController> logger)
    : ControllerBase
{
    /// <summary>
    /// Receives Stripe webhook events.
    /// Reads raw body for signature verification.
    /// </summary>
    [HttpPost]
    [Consumes("application/json")]
    public async Task<IActionResult> HandleWebhook(CancellationToken ct)
    {
        // Read raw body (required for signature verification — cannot use model binding)
        using var reader = new StreamReader(HttpContext.Request.Body);
        var rawBody = await reader.ReadToEndAsync(ct);

        var signatureHeader = Request.Headers["Stripe-Signature"].ToString();

        if (string.IsNullOrEmpty(signatureHeader))
        {
            logger.LogWarning("Stripe webhook received without signature header");
            return BadRequest("Missing Stripe-Signature header");
        }

        // Verify signature
        var stripeEvent = webhookHandler.VerifyAndParse(rawBody, signatureHeader);
        if (stripeEvent is null)
        {
            logger.LogWarning("Stripe webhook signature verification failed");
            return BadRequest("Invalid signature");
        }

        try
        {
            await webhookHandler.HandleEventAsync(
                stripeEvent, paymentRepo, orderRepo, unitOfWork, ct);

            return Ok(new { received = true });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Stripe webhook event {EventId}", stripeEvent.Id);
            // Return 200 to prevent Stripe from retrying (log and investigate manually)
            return Ok(new { received = true, error = "Processing error logged" });
        }
    }
}
