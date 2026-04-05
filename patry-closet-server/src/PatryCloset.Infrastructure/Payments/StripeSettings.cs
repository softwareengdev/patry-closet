namespace PatryCloset.Infrastructure.Payments;

/// <summary>
/// Strongly-typed Stripe configuration bound from appsettings.json "Stripe" section.
/// </summary>
public sealed class StripeSettings
{
    public const string SectionName = "Stripe";

    public string SecretKey { get; init; } = string.Empty;
    public string PublishableKey { get; init; } = string.Empty;
    public string WebhookSecret { get; init; } = string.Empty;
    public string Currency { get; init; } = "eur";
    public string StatementDescriptor { get; init; } = "PATRYCLOSET";

    /// <summary>Minimum charge amount in the smallest currency unit (cents).</summary>
    public long MinimumAmountCents { get; init; } = 50; // €0.50
}
