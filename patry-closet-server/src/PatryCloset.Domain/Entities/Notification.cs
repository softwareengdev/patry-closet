using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class Notification : AuditableEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool Read { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? Data { get; set; }
    public string? ActionUrl { get; set; }
}
