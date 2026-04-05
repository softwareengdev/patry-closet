namespace PatryCloset.Application.Features.Products.DTOs;

/// <summary>Lightweight product for list/grid views — matches frontend ProductCard needs.</summary>
public sealed record ProductListDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public required decimal Price { get; init; }
    public decimal? OriginalPrice { get; init; }
    public int DiscountPercent { get; init; }
    public required string Brand { get; init; }
    public required string Badge { get; init; }
    public required decimal Rating { get; init; }
    public int ReviewCount { get; init; }
    public int Popularity { get; init; }
    public required string Category { get; init; }
    public string? Subcategory { get; init; }
    public required string Image { get; init; }
    public string? HoverImage { get; init; }
    public required IReadOnlyList<string> Colors { get; init; }
    public required IReadOnlyList<string> Sizes { get; init; }
    public bool InStock { get; init; }
    public bool IsFeatured { get; init; }
}

/// <summary>Full product detail with all images, variants, and reviews.</summary>
public sealed record ProductDetailDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public required string Description { get; init; }
    public required decimal Price { get; init; }
    public decimal? OriginalPrice { get; init; }
    public int DiscountPercent { get; init; }
    public required string Brand { get; init; }
    public required string Badge { get; init; }
    public required decimal Rating { get; init; }
    public int ReviewCount { get; init; }
    public int Popularity { get; init; }
    public string? Material { get; init; }
    public required string Gender { get; init; }
    public required string Category { get; init; }
    public required string CategorySlug { get; init; }
    public string? Subcategory { get; init; }
    public bool InStock { get; init; }
    public bool IsFeatured { get; init; }
    public DateTime CreatedAt { get; init; }

    public required IReadOnlyList<ProductImageDto> Images { get; init; }
    public required IReadOnlyList<ProductVariantDto> Variants { get; init; }
    public required IReadOnlyList<string> AvailableColors { get; init; }
    public required IReadOnlyList<string> AvailableSizes { get; init; }
    public IReadOnlyList<ProductReviewDto>? RecentReviews { get; init; }
}

public sealed record ProductImageDto
{
    public required string Url { get; init; }
    public string? AltText { get; init; }
    public int SortOrder { get; init; }
    public bool IsHover { get; init; }
}

public sealed record ProductVariantDto
{
    public required Guid Id { get; init; }
    public required string Color { get; init; }
    public string? ColorHex { get; init; }
    public required string Size { get; init; }
    public required string Sku { get; init; }
    public int StockQuantity { get; init; }
    public decimal? PriceOverride { get; init; }
    public bool IsActive { get; init; }
}

public sealed record ProductReviewDto
{
    public required Guid Id { get; init; }
    public required string AuthorName { get; init; }
    public int Rating { get; init; }
    public string? Title { get; init; }
    public string? Comment { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Filter/sort/paginate parameters for product listing.</summary>
public sealed record ProductFilterParams
{
    // Filtering
    public string? Search { get; init; }
    public string? Category { get; init; }
    public string? Subcategory { get; init; }
    public string? Brand { get; init; }
    public string? Color { get; init; }
    public string? Size { get; init; }
    public string? Badge { get; init; }
    public string? Gender { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public bool? InStock { get; init; }
    public bool? IsFeatured { get; init; }

    // Sorting
    public string SortBy { get; init; } = "popularity";
    public string SortDirection { get; init; } = "desc";

    // Pagination
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

/// <summary>Admin DTO for creating/updating products.</summary>
public sealed record UpsertProductDto
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required decimal Price { get; init; }
    public decimal? OriginalPrice { get; init; }
    public int DiscountPercent { get; init; }
    public required string Brand { get; init; }
    public string? Badge { get; init; }
    public string? Material { get; init; }
    public string? Gender { get; init; }
    public required Guid CategoryId { get; init; }
    public string? SubcategorySlug { get; init; }
    public bool IsFeatured { get; init; }
    public required IReadOnlyList<UpsertProductImageDto> Images { get; init; }
    public required IReadOnlyList<UpsertProductVariantDto> Variants { get; init; }
}

public sealed record UpsertProductImageDto
{
    public required string Url { get; init; }
    public string? AltText { get; init; }
    public int SortOrder { get; init; }
    public bool IsHover { get; init; }
}

public sealed record UpsertProductVariantDto
{
    public required string Color { get; init; }
    public string? ColorHex { get; init; }
    public required string Size { get; init; }
    public required string Sku { get; init; }
    public int StockQuantity { get; init; }
    public decimal? PriceOverride { get; init; }
}
