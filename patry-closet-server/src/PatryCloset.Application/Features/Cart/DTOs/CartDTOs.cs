namespace PatryCloset.Application.Features.Cart.DTOs;

public sealed record CartDto
{
    public required Guid Id { get; init; }
    public required IReadOnlyList<CartItemDto> Items { get; init; }
    public decimal Subtotal { get; init; }
    public int TotalItems { get; init; }
    public string? CouponCode { get; init; }
    public decimal DiscountAmount { get; init; }
    public decimal EstimatedShipping { get; init; }
    public decimal Total { get; init; }
}

public sealed record CartItemDto
{
    public required Guid Id { get; init; }
    public required Guid ProductId { get; init; }
    public required string ProductName { get; init; }
    public required string ProductSlug { get; init; }
    public required string ProductImage { get; init; }
    public required string Brand { get; init; }
    public required string Color { get; init; }
    public required string Size { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal? OriginalPrice { get; init; }
    public decimal LineTotal { get; init; }
    public bool InStock { get; init; }
    public int AvailableStock { get; init; }
    public Guid? ProductVariantId { get; init; }
}

public sealed record AddToCartRequest
{
    public required Guid ProductId { get; init; }
    public required string Color { get; init; }
    public required string Size { get; init; }
    public int Quantity { get; init; } = 1;
}

public sealed record UpdateCartItemRequest
{
    public int Quantity { get; init; }
}
