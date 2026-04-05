namespace PatryCloset.Application.Features.Wishlist.DTOs;

public sealed record WishlistDto
{
    public required IReadOnlyList<WishlistItemDto> Items { get; init; }
    public int TotalCount { get; init; }
}

public sealed record WishlistItemDto
{
    public required Guid Id { get; init; }
    public required Guid ProductId { get; init; }
    public required string ProductName { get; init; }
    public required string ProductSlug { get; init; }
    public required string ProductImage { get; init; }
    public required string Brand { get; init; }
    public required decimal Price { get; init; }
    public decimal? OriginalPrice { get; init; }
    public int DiscountPercent { get; init; }
    public required string Badge { get; init; }
    public bool InStock { get; init; }
    public DateTime AddedAt { get; init; }
}
