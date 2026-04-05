using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class WishlistItem : AuditableEntity
{
    public Guid CustomerProfileId { get; set; }
    public CustomerProfile CustomerProfile { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
}
