using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;
using PatryCloset.Domain.Entities;
using PatryCloset.Infrastructure.Persistence;

namespace PatryCloset.Infrastructure.Identity;

public sealed class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;
    private readonly ApplicationDbContext _dbContext;
    private readonly int _refreshTokenExpirationDays;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ILogger<AuthService> logger,
        ApplicationDbContext dbContext,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _logger = logger;
        _dbContext = dbContext;
        _refreshTokenExpirationDays = int.TryParse(
            configuration["Jwt:RefreshTokenExpirationDays"], out var days) ? days : 7;
    }

    public async Task<Result<AuthResponse>> RegisterAsync(
        string email, string password, string firstName, string lastName, CancellationToken ct)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null)
        {
            return Result<AuthResponse>.Failure("Ya existe una cuenta con este email");
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            EmailConfirmed = true, // auto-confirm for MVP; enable email flow later
        };

        var identityResult = await _userManager.CreateAsync(user, password);
        if (!identityResult.Succeeded)
        {
            var errors = identityResult.Errors.Select(e => e.Description).ToList();
            _logger.LogWarning("Registration failed for {Email}: {Errors}", email, string.Join(", ", errors));
            return Result<AuthResponse>.Failure(errors.AsReadOnly());
        }

        await _userManager.AddToRoleAsync(user, "Customer");

        // Create customer profile linked to user
        var profile = new CustomerProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            FirstName = firstName,
            LastName = lastName,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = user.Id,
        };

        _dbContext.CustomerProfiles.Add(profile);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("User registered successfully: {Email}", email);
        return await GenerateAuthResponseAsync(user);
    }

    public async Task<Result<AuthResponse>> LoginAsync(string email, string password, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return Result<AuthResponse>.Failure("Credenciales inválidas");
        }

        if (!user.IsActive)
        {
            return Result<AuthResponse>.Failure("Tu cuenta ha sido desactivada. Contacta con soporte.");
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            return Result<AuthResponse>.Failure("Cuenta bloqueada temporalmente por demasiados intentos fallidos");
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, password);
        if (!passwordValid)
        {
            await _userManager.AccessFailedAsync(user);
            return Result<AuthResponse>.Failure("Credenciales inválidas");
        }

        // Reset lockout on successful login
        await _userManager.ResetAccessFailedCountAsync(user);

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("User logged in: {Email}", email);
        return await GenerateAuthResponseAsync(user);
    }

    public async Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken, CancellationToken ct)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);

        if (user is null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return Result<AuthResponse>.Failure("Refresh token inválido o expirado");
        }

        if (!user.IsActive)
        {
            return Result<AuthResponse>.Failure("Cuenta desactivada");
        }

        _logger.LogInformation("Token refreshed for user: {Email}", user.Email);
        return await GenerateAuthResponseAsync(user);
    }

    public async Task<Result> RevokeTokenAsync(string userId, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Result.Failure("Usuario no encontrado");
        }

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("Token revoked for user: {Email}", user.Email);
        return Result.Success();
    }

    public async Task<Result> ChangePasswordAsync(
        string userId, string currentPassword, string newPassword, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Result.Failure("Usuario no encontrado");
        }

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return Result.Failure(errors.AsReadOnly());
        }

        // Invalidate refresh token on password change for security
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("Password changed for user: {Email}", user.Email);
        return Result.Success();
    }

    public async Task<Result> ForgotPasswordAsync(string email, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            // Don't reveal whether user exists — always return success
            return Result.Success();
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        // TODO: Send email via IEmailService with reset link
        // For now, log the token (dev only)
        _logger.LogInformation("Password reset token generated for {Email}: {Token}", email, token);

        return Result.Success();
    }

    public async Task<Result> ResetPasswordAsync(
        string email, string token, string newPassword, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return Result.Failure("Token de recuperación inválido");
        }

        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return Result.Failure(errors.AsReadOnly());
        }

        // Invalidate refresh token on password reset
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("Password reset for user: {Email}", email);
        return Result.Success();
    }

    public async Task<Result<UserProfileResponse>> GetCurrentUserAsync(string userId, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return Result<UserProfileResponse>.Failure("Usuario no encontrado");
        }

        var roles = await _userManager.GetRolesAsync(user);

        return Result<UserProfileResponse>.Success(new UserProfileResponse
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            Roles = roles.ToList().AsReadOnly(),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
        });
    }

    // ─── Private Helpers ───

    private async Task<Result<AuthResponse>> GenerateAuthResponseAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email!, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays);
        await _userManager.UpdateAsync(user);

        var expiresAt = DateTime.UtcNow.AddMinutes(60); // same as token config

        return Result<AuthResponse>.Success(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                AvatarUrl = user.AvatarUrl,
                Roles = roles.ToList().AsReadOnly(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
            },
        });
    }
}
