using PatryCloset.Domain.Common;
using PatryCloset.Domain.Enums;

namespace PatryCloset.Domain.Entities;

public class Order : AuditableEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal Subtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal Tax { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }
    public string Currency { get; set; } = "EUR";
    public ShippingMethod ShippingMethod { get; set; } = ShippingMethod.Standard;
    public string? TrackingNumber { get; set; }
    public string? Notes { get; set; }
    public string? CouponCode { get; set; }

    // Snapshot of shipping address at order time
    public string ShippingFullName { get; set; } = string.Empty;
    public string ShippingStreet { get; set; } = string.Empty;
    public string? ShippingStreet2 { get; set; }
    public string ShippingCity { get; set; } = string.Empty;
    public string ShippingProvince { get; set; } = string.Empty;
    public string ShippingPostalCode { get; set; } = string.Empty;
    public string ShippingCountry { get; set; } = "ES";
    public string? ShippingPhone { get; set; }

    public Guid CustomerProfileId { get; set; }
    public CustomerProfile CustomerProfile { get; set; } = null!;

    public ICollection<OrderItem> Items { get; set; } = [];
    public Payment? Payment { get; set; }
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = [];
}
