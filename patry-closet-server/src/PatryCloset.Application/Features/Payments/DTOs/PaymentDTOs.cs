namespace PatryCloset.Application.Features.Payments.DTOs;

// ─── Response DTOs ───

public sealed record CheckoutSessionDto
{
    public required string PaymentIntentId { get; init; }
    public required string ClientSecret { get; init; }
    public required string PublishableKey { get; init; }
    public required Guid OrderId { get; init; }
    public required string OrderNumber { get; init; }
    public decimal Amount { get; init; }
    public required string Currency { get; init; }
}

public sealed record PaymentStatusDto
{
    public required Guid OrderId { get; init; }
    public required string OrderNumber { get; init; }
    public required string PaymentStatus { get; init; }
    public required string OrderStatus { get; init; }
    public decimal Amount { get; init; }
    public required string Currency { get; init; }
    public string? PaymentMethod { get; init; }
    public DateTime? PaidAt { get; init; }
    public string? ReceiptUrl { get; init; }
    public string? FailureMessage { get; init; }
}

public sealed record RefundDto
{
    public required string RefundId { get; init; }
    public required string Status { get; init; }
    public decimal Amount { get; init; }
    public required string Currency { get; init; }
    public required Guid OrderId { get; init; }
    public required string OrderNumber { get; init; }
}

// ─── Request DTOs ───

public sealed record CreateCheckoutRequest
{
    public required Guid ShippingAddressId { get; init; }
    public string ShippingMethod { get; init; } = "Standard";
    public string? CouponCode { get; init; }
    public string? Notes { get; init; }
}

public sealed record ProcessRefundRequest
{
    public decimal? Amount { get; init; }
    public string? Reason { get; init; }
}
