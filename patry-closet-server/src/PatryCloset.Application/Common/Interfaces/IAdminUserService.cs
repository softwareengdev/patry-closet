using PatryCloset.Application.Common.Models;

namespace PatryCloset.Application.Common.Interfaces;

/// <summary>
/// Abstraction for admin-level user management operations.
/// </summary>
public interface IAdminUserService
{
    Task<int> GetTotalUserCountAsync(CancellationToken ct = default);

    Task<(IReadOnlyList<AdminUserListItem> Users, int TotalCount)> GetUsersPagedAsync(
        int page, int pageSize, string? search, CancellationToken ct = default);

    Task<Dictionary<string, string>> GetEmailsByUserIdsAsync(
        IEnumerable<string> userIds, CancellationToken ct = default);

    Task<Result<bool>> UpdateUserRoleAsync(string userId, string role, CancellationToken ct = default);

    Task<Result<bool>> ToggleUserLockAsync(string userId, bool lockUser, CancellationToken ct = default);
}

public sealed class AdminUserListItem
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = [];
    public bool IsLocked { get; set; }
    public DateTime? CreatedAt { get; set; }
}
