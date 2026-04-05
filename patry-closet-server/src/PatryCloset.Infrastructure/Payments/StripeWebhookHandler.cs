using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace PatryCloset.Infrastructure.Payments;

/// <summary>
/// Handles Stripe webhook events with idempotency and robust error handling.
/// Processes payment_intent.succeeded, payment_intent.payment_failed,
/// charge.refunded, and charge.refund.updated events.
/// </summary>
public sealed class StripeWebhookHandler
{
    private readonly ILogger<StripeWebhookHandler> _logger;
    private readonly StripeSettings _settings;

    public StripeWebhookHandler(
        IOptions<StripeSettings> settings,
        ILogger<StripeWebhookHandler> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        StripeConfiguration.ApiKey = _settings.SecretKey;
    }

    /// <summary>
    /// Verifies webhook signature and returns the parsed Event, or null if invalid.
    /// </summary>
    public Event? VerifyAndParse(string rawBody, string signatureHeader)
    {
        try
        {
            return EventUtility.ConstructEvent(
                rawBody,
                signatureHeader,
                _settings.WebhookSecret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Stripe webhook signature verification failed");
            return null;
        }
    }

    /// <summary>
    /// Routes a verified Stripe event to the appropriate handler.
    /// </summary>
    public async Task HandleEventAsync(
        Event stripeEvent,
        IRepository<Payment> paymentRepo,
        IRepository<Order> orderRepo,
        IUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        _logger.LogInformation("Processing Stripe webhook: {Type} ({EventId})",
            stripeEvent.Type, stripeEvent.Id);

        switch (stripeEvent.Type)
        {
            case "payment_intent.succeeded":
                await HandlePaymentSucceededAsync(
                    (PaymentIntent)stripeEvent.Data.Object,
                    paymentRepo, orderRepo, unitOfWork, ct);
                break;

            case "payment_intent.payment_failed":
                await HandlePaymentFailedAsync(
                    (PaymentIntent)stripeEvent.Data.Object,
                    paymentRepo, unitOfWork, ct);
                break;

            case "charge.refunded":
                await HandleChargeRefundedAsync(
                    (Charge)stripeEvent.Data.Object,
                    paymentRepo, orderRepo, unitOfWork, ct);
                break;

            case "payment_intent.canceled":
                await HandlePaymentCancelledAsync(
                    (PaymentIntent)stripeEvent.Data.Object,
                    paymentRepo, unitOfWork, ct);
                break;

            default:
                _logger.LogDebug("Unhandled Stripe event type: {Type}", stripeEvent.Type);
                break;
        }
    }

    private async Task HandlePaymentSucceededAsync(
        PaymentIntent intent,
        IRepository<Payment> paymentRepo,
        IRepository<Order> orderRepo,
        IUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        var payment = await paymentRepo.AsQueryable()
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == intent.Id, ct);

        if (payment is null)
        {
            _logger.LogWarning("Payment not found for succeeded PaymentIntent: {IntentId}", intent.Id);
            return;
        }

        // Idempotency: skip if already captured
        if (payment.Status == PaymentStatus.Captured)
        {
            _logger.LogDebug("Payment {PaymentId} already captured, skipping", payment.Id);
            return;
        }

        payment.Status = PaymentStatus.Captured;
        payment.PaidAt = DateTime.UtcNow;
        payment.StripeChargeId = intent.LatestChargeId;
        payment.PaymentMethod = intent.PaymentMethod?.ToString() ?? "card";

        // Confirm the associated order
        var order = await orderRepo.AsQueryable()
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == payment.OrderId, ct);

        if (order is not null && order.Status == OrderStatus.Pending)
        {
            order.Status = OrderStatus.Confirmed;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                Status = OrderStatus.Confirmed,
                Note = $"Pago confirmado via Stripe ({intent.Id})",
                Timestamp = DateTime.UtcNow,
                OrderId = order.Id,
            });

            _logger.LogInformation("Order {OrderNumber} confirmed after payment {IntentId}",
                order.OrderNumber, intent.Id);
        }

        await unitOfWork.SaveChangesAsync(ct);
    }

    private async Task HandlePaymentFailedAsync(
        PaymentIntent intent,
        IRepository<Payment> paymentRepo,
        IUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        var payment = await paymentRepo.AsQueryable()
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == intent.Id, ct);

        if (payment is null) return;

        if (payment.Status == PaymentStatus.Failed) return;

        payment.Status = PaymentStatus.Failed;
        payment.FailureReason = intent.LastPaymentError?.Message ?? "Payment failed";

        await unitOfWork.SaveChangesAsync(ct);

        _logger.LogWarning("Payment failed for order {OrderId}: {Reason}",
            payment.OrderId, payment.FailureReason);
    }

    private async Task HandleChargeRefundedAsync(
        Charge charge,
        IRepository<Payment> paymentRepo,
        IRepository<Order> orderRepo,
        IUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        var payment = await paymentRepo.AsQueryable()
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == charge.PaymentIntentId, ct);

        if (payment is null) return;

        var refundedAmount = charge.AmountRefunded / 100m;
        var totalAmount = charge.Amount / 100m;

        payment.RefundedAmount = refundedAmount;
        payment.RefundedAt = DateTime.UtcNow;
        payment.Status = refundedAmount >= totalAmount
            ? PaymentStatus.Refunded
            : PaymentStatus.PartiallyRefunded;

        // Update order status if fully refunded
        if (payment.Status == PaymentStatus.Refunded)
        {
            var order = await orderRepo.AsQueryable()
                .Include(o => o.StatusHistory)
                .FirstOrDefaultAsync(o => o.Id == payment.OrderId, ct);

            if (order is not null)
            {
                order.Status = OrderStatus.Refunded;
                order.StatusHistory.Add(new OrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    Status = OrderStatus.Refunded,
                    Note = $"Reembolso completo procesado ({charge.Id})",
                    Timestamp = DateTime.UtcNow,
                    OrderId = order.Id,
                });
            }
        }

        await unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("Refund processed for PaymentIntent {IntentId}: {Amount}€ ({Status})",
            charge.PaymentIntentId, refundedAmount, payment.Status);
    }

    private async Task HandlePaymentCancelledAsync(
        PaymentIntent intent,
        IRepository<Payment> paymentRepo,
        IUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        var payment = await paymentRepo.AsQueryable()
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == intent.Id, ct);

        if (payment is null) return;

        if (payment.Status == PaymentStatus.Cancelled) return;

        payment.Status = PaymentStatus.Cancelled;

        await unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("Payment cancelled for PaymentIntent {IntentId}", intent.Id);
    }
}
