using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class CustomerProfile : AuditableEntity
{
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? AvatarUrl { get; set; }
    public string PreferredLanguage { get; set; } = "es";
    public string PreferredCurrency { get; set; } = "EUR";

    public string? Gender { get; set; }
    public string? StylePreferences { get; set; }
    public string? FavoriteSizes { get; set; }
    public string? FavoriteColors { get; set; }
    public string? FavoriteBrands { get; set; }
    public string? FavoriteCategories { get; set; }
    public string? NotificationPreferences { get; set; }
    public string? StripeCustomerId { get; set; }
    public bool EmailVerified { get; set; }
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }

    public ICollection<Address> Addresses { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<WishlistItem> WishlistItems { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public Cart? Cart { get; set; }
}
