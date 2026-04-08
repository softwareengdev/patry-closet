namespace PatryCloset.Application.Features.Reviews.DTOs;

/// <summary>Full review DTO with product and author information.</summary>
public sealed record ReviewDto
{
    public required Guid Id { get; init; }
    public required Guid ProductId { get; init; }
    public required string ProductName { get; init; }
    public required string ProductSlug { get; init; }
    public required string AuthorName { get; init; }
    public string? AuthorAvatar { get; init; }
    public int Rating { get; init; }
    public string? Title { get; init; }
    public string? Comment { get; init; }
    public bool IsVerifiedPurchase { get; init; }
    public bool IsApproved { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Request body for creating a new review.</summary>
public sealed record CreateReviewRequest
{
    public required Guid ProductId { get; init; }
    public required int Rating { get; init; }
    public string? Title { get; init; }
    public string? Comment { get; init; }
}

/// <summary>Request body for updating an existing review.</summary>
public sealed record UpdateReviewRequest
{
    public required int Rating { get; init; }
    public string? Title { get; init; }
    public string? Comment { get; init; }
}

/// <summary>Aggregate review statistics for a product.</summary>
public sealed record ReviewSummaryDto
{
    public decimal AverageRating { get; init; }
    public int TotalReviews { get; init; }
    public required IReadOnlyDictionary<int, int> RatingDistribution { get; init; }
}
