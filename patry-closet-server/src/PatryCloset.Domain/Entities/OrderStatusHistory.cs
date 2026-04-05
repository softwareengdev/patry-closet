using PatryCloset.Domain.Common;
using PatryCloset.Domain.Enums;

namespace PatryCloset.Domain.Entities;

public class OrderStatusHistory : BaseEntity
{
    public OrderStatus Status { get; set; }
    public string? Note { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
}
