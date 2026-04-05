using PatryCloset.Domain.Enums;

namespace PatryCloset.Application.Features.Orders.DTOs;

public sealed record OrderDto
{
    public required Guid Id { get; init; }
    public required string OrderNumber { get; init; }
    public required string Status { get; init; }
    public decimal Subtotal { get; init; }
    public decimal ShippingCost { get; init; }
    public decimal Tax { get; init; }
    public decimal DiscountAmount { get; init; }
    public decimal Total { get; init; }
    public required string Currency { get; init; }
    public required string ShippingMethod { get; init; }
    public string? TrackingNumber { get; init; }
    public string? Notes { get; init; }
    public string? CouponCode { get; init; }
    public required OrderAddressDto ShippingAddress { get; init; }
    public required IReadOnlyList<OrderItemDto> Items { get; init; }
    public IReadOnlyList<OrderStatusHistoryDto>? StatusHistory { get; init; }
    public OrderPaymentDto? Payment { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public sealed record OrderSummaryDto
{
    public required Guid Id { get; init; }
    public required string OrderNumber { get; init; }
    public required string Status { get; init; }
    public decimal Total { get; init; }
    public required string Currency { get; init; }
    public int ItemCount { get; init; }
    public string? FirstItemImage { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record OrderItemDto
{
    public required Guid Id { get; init; }
    public required string ProductName { get; init; }
    public string? ProductImageUrl { get; init; }
    public required string Sku { get; init; }
    public required string Color { get; init; }
    public required string Size { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal Total { get; init; }
    public Guid ProductId { get; init; }
}

public sealed record OrderAddressDto
{
    public required string FullName { get; init; }
    public required string Street { get; init; }
    public string? Street2 { get; init; }
    public required string City { get; init; }
    public required string Province { get; init; }
    public required string PostalCode { get; init; }
    public required string Country { get; init; }
    public string? Phone { get; init; }
}

public sealed record OrderStatusHistoryDto
{
    public required string Status { get; init; }
    public string? Note { get; init; }
    public DateTime Timestamp { get; init; }
}

public sealed record OrderPaymentDto
{
    public required string Status { get; init; }
    public decimal Amount { get; init; }
    public required string Currency { get; init; }
    public required string PaymentMethod { get; init; }
    public DateTime? PaidAt { get; init; }
}

public sealed record CreateOrderRequest
{
    public required Guid ShippingAddressId { get; init; }
    public string ShippingMethod { get; init; } = "Standard";
    public string? CouponCode { get; init; }
    public string? Notes { get; init; }
}

public sealed record UpdateOrderStatusRequest
{
    public required string Status { get; init; }
    public string? Note { get; init; }
}

public sealed record OrderFilterParams
{
    public string? Status { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public string SortBy { get; init; } = "newest";
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
