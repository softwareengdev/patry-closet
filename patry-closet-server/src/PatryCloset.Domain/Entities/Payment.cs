using PatryCloset.Domain.Common;
using PatryCloset.Domain.Enums;

namespace PatryCloset.Domain.Entities;

public class Payment : AuditableEntity
{
    public string StripePaymentIntentId { get; set; } = string.Empty;
    public string? StripeChargeId { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string PaymentMethod { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public decimal RefundedAmount { get; set; }

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
}
