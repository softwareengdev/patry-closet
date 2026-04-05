using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class CartItem : BaseEntity
{
    public int Quantity { get; set; } = 1;
    public string Color { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }

    public Guid CartId { get; set; }
    public Cart Cart { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid? ProductVariantId { get; set; }
    public ProductVariant? ProductVariant { get; set; }
}
