using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;

namespace PatryCloset.Infrastructure.Identity;

public sealed class AdminUserService : IAdminUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(UserManager<ApplicationUser> userManager, ILogger<AdminUserService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<int> GetTotalUserCountAsync(CancellationToken ct = default)
    {
        return await _userManager.Users.CountAsync(ct);
    }

    public async Task<(IReadOnlyList<AdminUserListItem> Users, int TotalCount)> GetUsersPagedAsync(
        int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u =>
                u.Email!.ToLower().Contains(s) ||
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync(ct);
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = new List<AdminUserListItem>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            items.Add(new AdminUserListItem
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles.ToList(),
                IsLocked = await _userManager.IsLockedOutAsync(user),
                CreatedAt = user.CreatedAt,
            });
        }

        return (items, totalCount);
    }

    public async Task<Dictionary<string, string>> GetEmailsByUserIdsAsync(
        IEnumerable<string> userIds, CancellationToken ct = default)
    {
        var ids = userIds.ToList();
        if (ids.Count == 0) return new Dictionary<string, string>();

        return await _userManager.Users
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Email ?? "", ct);
    }

    public async Task<Result<bool>> UpdateUserRoleAsync(string userId, string role, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Result<bool>.Failure("User not found");

        var validRoles = new[] { "Admin", "Manager", "Customer" };
        if (!validRoles.Contains(role))
            return Result<bool>.Failure($"Invalid role: {role}");

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, role);

        _logger.LogInformation("User {UserId} role updated to {Role} by admin", user.Id, role);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ToggleUserLockAsync(string userId, bool lockUser, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Result<bool>.Failure("User not found");

        if (lockUser)
        {
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
            _logger.LogWarning("User {UserId} locked by admin", user.Id);
        }
        else
        {
            await _userManager.SetLockoutEndDateAsync(user, null);
            await _userManager.ResetAccessFailedCountAsync(user);
            _logger.LogInformation("User {UserId} unlocked by admin", user.Id);
        }

        return Result<bool>.Success(true);
    }
}
