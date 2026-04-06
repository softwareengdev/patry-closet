using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class BlogPost : AuditableEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CoverImage { get; set; }
    public string? CoverImageAlt { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Season { get; set; }
    public string Tags { get; set; } = "[]";
    public string? Badge { get; set; }
    public int ReadingTime { get; set; }
    public bool Featured { get; set; }
    public bool Trending { get; set; }
    public bool Published { get; set; } = true;
    public DateTime? PublishedAt { get; set; }
    public string? RelatedProductIds { get; set; }
    public Guid AuthorId { get; set; }
    public BlogAuthor Author { get; set; } = null!;
    public int ViewCount { get; set; }
}
