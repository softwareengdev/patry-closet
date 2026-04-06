using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class SavedPaymentMethod : AuditableEntity
{
    public string UserId { get; set; } = string.Empty;
    public string StripePaymentMethodId { get; set; } = string.Empty;
    public string StripeCustomerId { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Last4 { get; set; } = string.Empty;
    public int ExpMonth { get; set; }
    public int ExpYear { get; set; }
    public bool IsDefault { get; set; }
    public string? CardholderName { get; set; }
}
