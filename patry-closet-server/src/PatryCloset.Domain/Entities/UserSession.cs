using PatryCloset.Domain.Common;

namespace PatryCloset.Domain.Entities;

public class UserSession : AuditableEntity
{
    public string UserId { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string? Device { get; set; }
    public string? Browser { get; set; }
    public string? OperatingSystem { get; set; }
    public string? IpAddress { get; set; }
    public string? Location { get; set; }
    public DateTime LastActive { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
}
