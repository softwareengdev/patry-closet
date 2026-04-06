using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class ContactMessage : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? RecaptchaToken { get; set; }
    public string TicketId { get; set; } = string.Empty;
    public string Status { get; set; } = "new";
    public string? AssignedTo { get; set; }
    public string? Attachments { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? UserId { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
