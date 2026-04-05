namespace PatryCloset.Application.Common.Interfaces;

public interface IPaymentService
{
    Task<PaymentIntentResult> CreatePaymentIntentAsync(decimal amount, string currency, string? customerEmail, Dictionary<string, string>? metadata = null, CancellationToken ct = default);
    Task<PaymentIntentResult> ConfirmPaymentIntentAsync(string paymentIntentId, CancellationToken ct = default);
    Task<RefundResult> CreateRefundAsync(string paymentIntentId, decimal? amount = null, CancellationToken ct = default);
}

public class PaymentIntentResult
{
    public string PaymentIntentId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class RefundResult
{
    public string RefundId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
