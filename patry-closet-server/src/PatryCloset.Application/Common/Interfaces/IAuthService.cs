using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Common.Interfaces;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(string email, string password, string firstName, string lastName, CancellationToken ct = default);
    Task<Result<AuthResponse>> LoginAsync(string email, string password, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<Result> RevokeTokenAsync(string userId, CancellationToken ct = default);
    Task<Result> ChangePasswordAsync(string userId, string currentPassword, string newPassword, CancellationToken ct = default);
    Task<Result> ForgotPasswordAsync(string email, CancellationToken ct = default);
    Task<Result> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct = default);
    Task<Result<AuthResponse>> SocialLoginAsync(string provider, string token, string? email, string? name, string? avatar, CancellationToken ct = default);
    Task<Result<UserProfileResponse>> GetCurrentUserAsync(string userId, CancellationToken ct = default);

    // Profile & Account
    Task<Result<UserProfileResponse>> UpdateProfileAsync(string userId, string? firstName, string? lastName, string? phone, DateTime? dateOfBirth, string? gender, string? preferredLanguage, string? preferredCurrency, CancellationToken ct = default);
    Task<Result<string>> UploadAvatarAsync(string userId, Stream fileStream, string fileName, string contentType, CancellationToken ct = default);
    Task<Result<UserPreferencesResponse>> GetPreferencesAsync(string userId, CancellationToken ct = default);
    Task<Result<UserPreferencesResponse>> UpdatePreferencesAsync(string userId, List<string>? stylePreferences, List<string>? favoriteSizes, List<string>? favoriteColors, List<string>? favoriteBrands, List<string>? favoriteCategories, NotificationPreferencesDto? notifications, CancellationToken ct = default);
    Task<Result> VerifyEmailAsync(string userId, string token, CancellationToken ct = default);
    Task<Result> ResendVerificationEmailAsync(string email, CancellationToken ct = default);
    Task<Result> LogoutAllDevicesAsync(string userId, CancellationToken ct = default);
    Task<Result<IReadOnlyList<SessionResponse>>> GetSessionsAsync(string userId, string? currentTokenHash, CancellationToken ct = default);
    Task<Result> RevokeSessionAsync(string userId, string sessionId, CancellationToken ct = default);
}
