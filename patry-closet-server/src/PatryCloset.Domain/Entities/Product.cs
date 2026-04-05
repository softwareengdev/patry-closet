using PatryCloset.Domain.Common;
using PatryCloset.Domain.Enums;

namespace PatryCloset.Domain.Entities;

public class Product : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int DiscountPercent { get; set; }
    public string Brand { get; set; } = "Patry Originals";
    public Gender Gender { get; set; } = Gender.Female;
    public ProductBadge Badge { get; set; } = ProductBadge.None;
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    public int Popularity { get; set; }
    public string? Material { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string? SubcategorySlug { get; set; }

    public ICollection<ProductImage> Images { get; set; } = [];
    public ICollection<ProductVariant> Variants { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public ICollection<WishlistItem> WishlistItems { get; set; } = [];
}
