using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class Cart : AuditableEntity
{
    public string? SessionId { get; set; }

    public Guid? CustomerProfileId { get; set; }
    public CustomerProfile? CustomerProfile { get; set; }

    public ICollection<CartItem> Items { get; set; } = [];

    public decimal Total => Items.Sum(i => i.UnitPrice * i.Quantity);
}
