namespace PatryCloset.Application.Features.Auth.DTOs;

// ─── Requests ───

public sealed record RegisterRequest
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public required string ConfirmPassword { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
}

public sealed record LoginRequest
{
    public required string Email { get; init; }
    public required string Password { get; init; }
}

public sealed record RefreshTokenRequest
{
    public required string RefreshToken { get; init; }
}

public sealed record ChangePasswordRequest
{
    public required string CurrentPassword { get; init; }
    public required string NewPassword { get; init; }
    public required string ConfirmNewPassword { get; init; }
}

public sealed record ForgotPasswordRequest
{
    public required string Email { get; init; }
}

public sealed record ResetPasswordRequest
{
    public required string Email { get; init; }
    public required string Token { get; init; }
    public required string NewPassword { get; init; }
    public required string ConfirmNewPassword { get; init; }
}

// ─── Responses ───

public sealed record AuthResponse
{
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
    public required DateTime ExpiresAt { get; init; }
    public required UserProfileResponse User { get; init; }
}

public sealed record UserProfileResponse
{
    public required string Id { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public string? AvatarUrl { get; init; }
    public required IReadOnlyList<string> Roles { get; init; }
    public required DateTime CreatedAt { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public string? Phone { get; init; }
    public DateTime? DateOfBirth { get; init; }
    public string? Gender { get; init; }
    public string? PreferredLanguage { get; init; }
    public string? PreferredCurrency { get; init; }
    public bool EmailVerified { get; init; }
}

// ─── Profile Requests ───

public sealed record UpdateProfileRequest
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Phone { get; init; }
    public DateTime? DateOfBirth { get; init; }
    public string? Gender { get; init; }
    public string? PreferredLanguage { get; init; }
    public string? PreferredCurrency { get; init; }
}

public sealed record UpdatePreferencesRequest
{
    public List<string>? StylePreferences { get; init; }
    public List<string>? FavoriteSizes { get; init; }
    public List<string>? FavoriteColors { get; init; }
    public List<string>? FavoriteBrands { get; init; }
    public List<string>? FavoriteCategories { get; init; }
    public NotificationPreferencesDto? Notifications { get; init; }
}

public sealed record NotificationPreferencesDto
{
    public bool OrderUpdates { get; init; } = true;
    public bool Promotions { get; init; }
    public bool StockAlerts { get; init; }
    public bool NewArrivals { get; init; }
    public bool PriceDrops { get; init; }
    public bool PushEnabled { get; init; }
    public bool EmailEnabled { get; init; } = true;
}

public sealed record UserPreferencesResponse
{
    public List<string> StylePreferences { get; init; } = [];
    public List<string> FavoriteSizes { get; init; } = [];
    public List<string> FavoriteColors { get; init; } = [];
    public List<string> FavoriteBrands { get; init; } = [];
    public List<string> FavoriteCategories { get; init; } = [];
    public NotificationPreferencesDto Notifications { get; init; } = new();
}

public sealed record SessionResponse
{
    public required string Id { get; init; }
    public required string Device { get; init; }
    public string? Browser { get; init; }
    public string? Os { get; init; }
    public string? Location { get; init; }
    public required string IpAddress { get; init; }
    public required DateTime LastActive { get; init; }
    public required bool IsCurrent { get; init; }
}

public sealed record SocialLoginRequest
{
    public required string Provider { get; init; }
    public required string Token { get; init; }
    public string? Email { get; init; }
    public string? Name { get; init; }
    public string? Avatar { get; init; }
}

public sealed record VerifyEmailRequest
{
    public required string Token { get; init; }
}

public sealed record ResendVerificationRequest
{
    public required string Email { get; init; }
}
