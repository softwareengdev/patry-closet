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
}
