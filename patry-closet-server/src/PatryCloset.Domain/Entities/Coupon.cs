using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class Coupon : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public int MaxUsageCount { get; set; }
    public int UsedCount { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public bool IsActive { get; set; } = true;

    public bool IsValid => IsActive
        && DateTime.UtcNow >= ValidFrom
        && DateTime.UtcNow <= ValidTo
        && UsedCount < MaxUsageCount;
}
