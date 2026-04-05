using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Events;

public sealed class OrderCreatedEvent(Guid orderId) : DomainEvent
{
    public Guid OrderId { get; } = orderId;
}

public sealed class OrderStatusChangedEvent(Guid orderId, string newStatus) : DomainEvent
{
    public Guid OrderId { get; } = orderId;
    public string NewStatus { get; } = newStatus;
}

public sealed class StockDepletedEvent(Guid productVariantId, int remaining) : DomainEvent
{
    public Guid ProductVariantId { get; } = productVariantId;
    public int Remaining { get; } = remaining;
}

public sealed class PaymentCompletedEvent(Guid orderId, string paymentIntentId) : DomainEvent
{
    public Guid OrderId { get; } = orderId;
    public string PaymentIntentId { get; } = paymentIntentId;
}
