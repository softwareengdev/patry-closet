using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Common.Interfaces;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(string email, string password, string firstName, string lastName, CancellationToken ct = default);
    Task<Result<AuthResponse>> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task<Result> RevokeTokenAsync(string userId, CancellationToken ct = default);
    Task<Result> ChangePasswordAsync(string userId, string currentPassword, string newPassword, CancellationToken ct = default);
    Task<Result> ForgotPasswordAsync(string email, CancellationToken ct = default);
    Task<Result> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct = default);
    Task<Result<UserProfileResponse>> GetCurrentUserAsync(string userId, CancellationToken ct = default);
}
