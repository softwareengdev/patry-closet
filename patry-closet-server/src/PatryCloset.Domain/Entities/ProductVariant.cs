using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public string Color { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public string Size { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public decimal? PriceOverride { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
}
