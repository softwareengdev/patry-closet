namespace PatryCloset.Application.Features.Categories.DTOs;

/// <summary>Category with optional children and product count for tree views.</summary>
public sealed record CategoryDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public string? Description { get; init; }
    public string? ImageUrl { get; init; }
    public int SortOrder { get; init; }
    public int ProductCount { get; init; }
    public Guid? ParentCategoryId { get; init; }
    public IReadOnlyList<CategoryDto>? SubCategories { get; init; }
}

/// <summary>Flat category reference for dropdowns.</summary>
public sealed record CategorySummaryDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public Guid? ParentCategoryId { get; init; }
}
