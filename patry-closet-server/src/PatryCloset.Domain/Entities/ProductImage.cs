using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class ProductImage : BaseEntity
{
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsHover { get; set; }

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
}
