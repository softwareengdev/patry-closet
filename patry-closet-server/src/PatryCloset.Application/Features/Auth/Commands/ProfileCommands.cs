using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Features.Auth.Commands;

// ─── Update Profile ───

public sealed record UpdateProfileCommand(
    string UserId,
    string? FirstName,
    string? LastName,
    string? Phone,
    DateTime? DateOfBirth,
    string? Gender,
    string? PreferredLanguage,
    string? PreferredCurrency
) : IRequest<Result<UserProfileResponse>>;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.FirstName).MaximumLength(128).When(x => x.FirstName != null);
        RuleFor(x => x.LastName).MaximumLength(128).When(x => x.LastName != null);
        RuleFor(x => x.Phone).MaximumLength(20).When(x => x.Phone != null);
        RuleFor(x => x.Gender).Must(g => g is null or "female" or "male" or "non-binary" or "prefer-not-to-say")
            .WithMessage("Género no válido");
    }
}

// ─── Upload Avatar ───

public sealed record UploadAvatarCommand(
    string UserId,
    Stream FileStream,
    string FileName,
    string ContentType
) : IRequest<Result<string>>;

// ─── Update Preferences ───

public sealed record UpdatePreferencesCommand(
    string UserId,
    List<string>? StylePreferences,
    List<string>? FavoriteSizes,
    List<string>? FavoriteColors,
    List<string>? FavoriteBrands,
    List<string>? FavoriteCategories,
    NotificationPreferencesDto? Notifications
) : IRequest<Result<UserPreferencesResponse>>;

// ─── Verify Email ───

public sealed record VerifyEmailCommand(
    string UserId,
    string Token
) : IRequest<Result>;

// ─── Resend Verification ───

public sealed record ResendVerificationCommand(
    string Email
) : IRequest<Result>;

// ─── Logout All Devices ───

public sealed record LogoutAllDevicesCommand(
    string UserId
) : IRequest<Result>;

// ─── Revoke Session ───

public sealed record RevokeSessionCommand(
    string UserId,
    string SessionId
) : IRequest<Result>;
