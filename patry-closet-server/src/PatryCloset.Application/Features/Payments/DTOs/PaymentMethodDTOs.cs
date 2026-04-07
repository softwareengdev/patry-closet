namespace PatryCloset.Application.Features.Payments.DTOs;

// ─── Payment Method Response ───

public sealed record PaymentMethodResponse
{
    public required Guid Id { get; init; }
    public required string Brand { get; init; }
    public required string Last4 { get; init; }
    public required int ExpMonth { get; init; }
    public required int ExpYear { get; init; }
    public required bool IsDefault { get; init; }
    public string? CardholderName { get; init; }
}

// ─── Payment Method Requests ───

public sealed record AddPaymentMethodRequest
{
    // Accept both field names: frontend sends stripePaymentMethodId, normalize here
    public string? PaymentMethodId { get; init; }
    public string? StripePaymentMethodId { get; init; }

    public string ResolvedPaymentMethodId =>
        PaymentMethodId ?? StripePaymentMethodId ?? string.Empty;
}

public sealed record SetDefaultPaymentMethodRequest
{
    public required Guid PaymentMethodId { get; init; }
}
