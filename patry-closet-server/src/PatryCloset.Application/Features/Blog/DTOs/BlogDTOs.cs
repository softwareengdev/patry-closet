namespace PatryCloset.Application.Features.Blog.DTOs;

public sealed record BlogPostResponse
{
    public required Guid Id { get; init; }
    public required string Slug { get; init; }
    public required string TitleFallback { get; init; }
    public required string ExcerptFallback { get; init; }
    public string? CoverImage { get; init; }
    public string? CoverImageAlt { get; init; }
    public required string Category { get; init; }
    public string? Season { get; init; }
    public required List<string> Tags { get; init; }
    public required BlogAuthorResponse Author { get; init; }
    public required DateTime PublishedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public int ReadingTime { get; init; }
    public bool Featured { get; init; }
    public bool Trending { get; init; }
    public string? Badge { get; init; }
    public string? Content { get; init; }
    public List<int>? RelatedProductIds { get; init; }
}

public sealed record BlogAuthorResponse
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Role { get; init; }
    public string? Avatar { get; init; }
}

public sealed record BlogPostListResponse
{
    public required List<BlogPostResponse> Items { get; init; }
    public required int Total { get; init; }
    public required int Page { get; init; }
    public required int PerPage { get; init; }
    public required int TotalPages { get; init; }
    public required bool HasNextPage { get; init; }
    public required bool HasPrevPage { get; init; }
    public int? NextPage { get; init; }
}

public sealed record CreateBlogPostRequest
{
    public required string Title { get; init; }
    public required string Excerpt { get; init; }
    public required string Content { get; init; }
    public string? CoverImage { get; init; }
    public string? CoverImageAlt { get; init; }
    public required string Category { get; init; }
    public string? Season { get; init; }
    public List<string> Tags { get; init; } = [];
    public string? Badge { get; init; }
    public int ReadingTime { get; init; }
    public bool Featured { get; init; }
    public bool Trending { get; init; }
    public bool Published { get; init; } = true;
    public List<int>? RelatedProductIds { get; init; }
}

public sealed record UpdateBlogPostRequest
{
    public string? Title { get; init; }
    public string? Excerpt { get; init; }
    public string? Content { get; init; }
    public string? CoverImage { get; init; }
    public string? CoverImageAlt { get; init; }
    public string? Category { get; init; }
    public string? Season { get; init; }
    public List<string>? Tags { get; init; }
    public string? Badge { get; init; }
    public int? ReadingTime { get; init; }
    public bool? Featured { get; init; }
    public bool? Trending { get; init; }
    public bool? Published { get; init; }
    public List<int>? RelatedProductIds { get; init; }
}
