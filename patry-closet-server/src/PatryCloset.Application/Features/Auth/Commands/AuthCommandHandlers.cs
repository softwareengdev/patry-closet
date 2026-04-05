using MediatR;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Features.Auth.Commands;

public sealed class RegisterCommandHandler(IAuthService authService)
    : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken ct)
    {
        return await authService.RegisterAsync(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            ct);
    }
}

public sealed class LoginCommandHandler(IAuthService authService)
    : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        return await authService.LoginAsync(request.Email, request.Password, ct);
    }
}

public sealed class RefreshTokenCommandHandler(IAuthService authService)
    : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        return await authService.RefreshTokenAsync(request.RefreshToken, ct);
    }
}

public sealed class ChangePasswordCommandHandler(IAuthService authService)
    : IRequestHandler<ChangePasswordCommand, Result>
{
    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken ct)
    {
        return await authService.ChangePasswordAsync(
            request.UserId,
            request.CurrentPassword,
            request.NewPassword,
            ct);
    }
}

public sealed class ForgotPasswordCommandHandler(IAuthService authService)
    : IRequestHandler<ForgotPasswordCommand, Result>
{
    public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        return await authService.ForgotPasswordAsync(request.Email, ct);
    }
}

public sealed class ResetPasswordCommandHandler(IAuthService authService)
    : IRequestHandler<ResetPasswordCommand, Result>
{
    public async Task<Result> Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        return await authService.ResetPasswordAsync(
            request.Email,
            request.Token,
            request.NewPassword,
            ct);
    }
}

public sealed class RevokeTokenCommandHandler(IAuthService authService)
    : IRequestHandler<RevokeTokenCommand, Result>
{
    public async Task<Result> Handle(RevokeTokenCommand request, CancellationToken ct)
    {
        return await authService.RevokeTokenAsync(request.UserId, ct);
    }
}
