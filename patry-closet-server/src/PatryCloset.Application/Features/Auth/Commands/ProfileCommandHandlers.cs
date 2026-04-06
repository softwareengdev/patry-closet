using MediatR;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Features.Auth.Commands;

public sealed class UpdateProfileCommandHandler(IAuthService authService)
    : IRequestHandler<UpdateProfileCommand, Result<UserProfileResponse>>
{
    public async Task<Result<UserProfileResponse>> Handle(UpdateProfileCommand request, CancellationToken ct)
    {
        return await authService.UpdateProfileAsync(
            request.UserId,
            request.FirstName,
            request.LastName,
            request.Phone,
            request.DateOfBirth,
            request.Gender,
            request.PreferredLanguage,
            request.PreferredCurrency,
            ct);
    }
}

public sealed class UploadAvatarCommandHandler(IAuthService authService)
    : IRequestHandler<UploadAvatarCommand, Result<string>>
{
    public async Task<Result<string>> Handle(UploadAvatarCommand request, CancellationToken ct)
    {
        return await authService.UploadAvatarAsync(
            request.UserId,
            request.FileStream,
            request.FileName,
            request.ContentType,
            ct);
    }
}

public sealed class UpdatePreferencesCommandHandler(IAuthService authService)
    : IRequestHandler<UpdatePreferencesCommand, Result<UserPreferencesResponse>>
{
    public async Task<Result<UserPreferencesResponse>> Handle(UpdatePreferencesCommand request, CancellationToken ct)
    {
        return await authService.UpdatePreferencesAsync(
            request.UserId,
            request.StylePreferences,
            request.FavoriteSizes,
            request.FavoriteColors,
            request.FavoriteBrands,
            request.FavoriteCategories,
            request.Notifications,
            ct);
    }
}

public sealed class VerifyEmailCommandHandler(IAuthService authService)
    : IRequestHandler<VerifyEmailCommand, Result>
{
    public async Task<Result> Handle(VerifyEmailCommand request, CancellationToken ct)
    {
        return await authService.VerifyEmailAsync(request.UserId, request.Token, ct);
    }
}

public sealed class ResendVerificationCommandHandler(IAuthService authService)
    : IRequestHandler<ResendVerificationCommand, Result>
{
    public async Task<Result> Handle(ResendVerificationCommand request, CancellationToken ct)
    {
        return await authService.ResendVerificationEmailAsync(request.Email, ct);
    }
}

public sealed class LogoutAllDevicesCommandHandler(IAuthService authService)
    : IRequestHandler<LogoutAllDevicesCommand, Result>
{
    public async Task<Result> Handle(LogoutAllDevicesCommand request, CancellationToken ct)
    {
        return await authService.LogoutAllDevicesAsync(request.UserId, ct);
    }
}

public sealed class RevokeSessionCommandHandler(IAuthService authService)
    : IRequestHandler<RevokeSessionCommand, Result>
{
    public async Task<Result> Handle(RevokeSessionCommand request, CancellationToken ct)
    {
        return await authService.RevokeSessionAsync(request.UserId, request.SessionId, ct);
    }
}
