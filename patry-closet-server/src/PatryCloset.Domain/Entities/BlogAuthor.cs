using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class BlogAuthor : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public ICollection<BlogPost> Posts { get; set; } = [];
}
