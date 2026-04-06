namespace PatryCloset.Application.Common.Interfaces;

public interface ISocialTokenValidator
{
    Task<SocialUserInfo?> ValidateGoogleTokenAsync(string idToken, CancellationToken ct = default);
    Task<SocialUserInfo?> ValidateAppleTokenAsync(string idToken, CancellationToken ct = default);
}

public sealed record SocialUserInfo
{
    public required string ProviderId { get; init; }
    public required string Email { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? AvatarUrl { get; init; }
    public bool EmailVerified { get; init; }
}
