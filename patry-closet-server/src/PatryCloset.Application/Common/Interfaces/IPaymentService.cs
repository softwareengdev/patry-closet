namespace PatryCloset.Application.Common.Interfaces;

/// <summary>
/// Abstraction over payment provider (Stripe). Enables testability and future provider swap.
/// </summary>
public interface IPaymentService
{
    Task<PaymentIntentResult> CreatePaymentIntentAsync(
        decimal amount, string currency, string? customerEmail,
        Dictionary<string, string>? metadata = null, CancellationToken ct = default);

    Task<PaymentIntentResult> ConfirmPaymentIntentAsync(
        string paymentIntentId, CancellationToken ct = default);

    Task<PaymentIntentResult> CancelPaymentIntentAsync(
        string paymentIntentId, CancellationToken ct = default);

    Task<PaymentIntentDetailResult> GetPaymentIntentAsync(
        string paymentIntentId, CancellationToken ct = default);

    Task<RefundResult> CreateRefundAsync(
        string paymentIntentId, decimal? amount = null, CancellationToken ct = default);
}

public sealed class PaymentIntentResult
{
    public string PaymentIntentId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public sealed class PaymentIntentDetailResult
{
    public string PaymentIntentId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string PaymentMethodType { get; set; } = string.Empty;
    public string? ChargeId { get; set; }
    public string? ReceiptUrl { get; set; }
    public string? FailureMessage { get; set; }
}

public sealed class RefundResult
{
    public string RefundId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
