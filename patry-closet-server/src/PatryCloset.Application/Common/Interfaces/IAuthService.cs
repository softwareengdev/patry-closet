using PatryCloset.Application.Common.Models;

namespace PatryCloset.Application.Common.Interfaces;

public interface IAuthService
{
    Task<Result<AuthTokens>> RegisterAsync(string email, string password, string firstName, string lastName, CancellationToken ct = default);
    Task<Result<AuthTokens>> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<Result<AuthTokens>> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task<Result> RevokeTokenAsync(string userId, CancellationToken ct = default);
    Task<Result> ChangePasswordAsync(string userId, string currentPassword, string newPassword, CancellationToken ct = default);
    Task<Result> ForgotPasswordAsync(string email, CancellationToken ct = default);
    Task<Result> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct = default);
}

public class AuthTokens
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public IReadOnlyList<string> Roles { get; set; } = [];
}
