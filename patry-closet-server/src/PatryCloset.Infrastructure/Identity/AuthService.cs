using System.Text.Json;
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
    private readonly IFileStorageService _fileStorageService;
    private readonly int _refreshTokenExpirationDays;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ILogger<AuthService> logger,
        ApplicationDbContext dbContext,
        IConfiguration configuration,
        IFileStorageService fileStorageService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _logger = logger;
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
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
        var profile = await _dbContext.CustomerProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

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
            Phone = profile?.Phone,
            DateOfBirth = profile?.DateOfBirth,
            Gender = profile?.Gender,
            PreferredLanguage = profile?.PreferredLanguage ?? "es",
            PreferredCurrency = profile?.PreferredCurrency ?? "EUR",
            EmailVerified = profile?.EmailVerified ?? user.EmailConfirmed,
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

        var profile = await _dbContext.CustomerProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == user.Id);

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
                Phone = profile?.Phone,
                DateOfBirth = profile?.DateOfBirth,
                Gender = profile?.Gender,
                PreferredLanguage = profile?.PreferredLanguage ?? "es",
                PreferredCurrency = profile?.PreferredCurrency ?? "EUR",
                EmailVerified = profile?.EmailVerified ?? user.EmailConfirmed,
            },
        });
    }

    private async Task<CustomerProfile> GetOrCreateProfileAsync(string userId, CancellationToken ct)
    {
        var profile = await _dbContext.CustomerProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (profile is not null) return profile;

        var user = await _userManager.FindByIdAsync(userId);
        profile = new CustomerProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FirstName = user?.FirstName ?? string.Empty,
            LastName = user?.LastName ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
        };

        _dbContext.CustomerProfiles.Add(profile);
        await _dbContext.SaveChangesAsync(ct);
        return profile;
    }

    private static List<string> DeserializeJsonList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? []; }
        catch { return []; }
    }

    private static NotificationPreferencesDto DeserializeNotifications(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new NotificationPreferencesDto();
        try { return JsonSerializer.Deserialize<NotificationPreferencesDto>(json) ?? new(); }
        catch { return new NotificationPreferencesDto(); }
    }

    // ─── Profile & Account Methods ───

    public async Task<Result<UserProfileResponse>> UpdateProfileAsync(
        string userId, string? firstName, string? lastName, string? phone,
        DateTime? dateOfBirth, string? gender, string? preferredLanguage,
        string? preferredCurrency, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
            return Result<UserProfileResponse>.Failure("Usuario no encontrado");

        if (firstName is not null) user.FirstName = firstName;
        if (lastName is not null) user.LastName = lastName;
        await _userManager.UpdateAsync(user);

        var profile = await GetOrCreateProfileAsync(userId, ct);
        if (firstName is not null) profile.FirstName = firstName;
        if (lastName is not null) profile.LastName = lastName;
        if (phone is not null) profile.Phone = phone;
        if (dateOfBirth.HasValue) profile.DateOfBirth = dateOfBirth;
        if (gender is not null) profile.Gender = gender;
        if (preferredLanguage is not null) profile.PreferredLanguage = preferredLanguage;
        if (preferredCurrency is not null) profile.PreferredCurrency = preferredCurrency;
        profile.UpdatedAt = DateTime.UtcNow;
        profile.UpdatedBy = userId;

        await _dbContext.SaveChangesAsync(ct);

        var roles = await _userManager.GetRolesAsync(user);
        _logger.LogInformation("Profile updated for user: {Email}", user.Email);

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
            Phone = profile.Phone,
            DateOfBirth = profile.DateOfBirth,
            Gender = profile.Gender,
            PreferredLanguage = profile.PreferredLanguage,
            PreferredCurrency = profile.PreferredCurrency,
            EmailVerified = profile.EmailVerified,
        });
    }

    public async Task<Result<string>> UploadAvatarAsync(
        string userId, Stream fileStream, string fileName, string contentType, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
            return Result<string>.Failure("Usuario no encontrado");

        // Delete old avatar if exists
        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            try { await _fileStorageService.DeleteAsync(user.AvatarUrl, ct); }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete old avatar for user {UserId}", userId); }
        }

        var newUrl = await _fileStorageService.UploadAsync(fileStream, fileName, contentType, "avatars", ct);

        user.AvatarUrl = newUrl;
        await _userManager.UpdateAsync(user);

        var profile = await _dbContext.CustomerProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile is not null)
        {
            profile.AvatarUrl = newUrl;
            profile.UpdatedAt = DateTime.UtcNow;
            profile.UpdatedBy = userId;
            await _dbContext.SaveChangesAsync(ct);
        }

        _logger.LogInformation("Avatar uploaded for user: {Email}", user.Email);
        return Result<string>.Success(newUrl);
    }

    public async Task<Result<UserPreferencesResponse>> GetPreferencesAsync(string userId, CancellationToken ct)
    {
        var profile = await _dbContext.CustomerProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (profile is null)
        {
            return Result<UserPreferencesResponse>.Success(new UserPreferencesResponse());
        }

        return Result<UserPreferencesResponse>.Success(new UserPreferencesResponse
        {
            StylePreferences = DeserializeJsonList(profile.StylePreferences),
            FavoriteSizes = DeserializeJsonList(profile.FavoriteSizes),
            FavoriteColors = DeserializeJsonList(profile.FavoriteColors),
            FavoriteBrands = DeserializeJsonList(profile.FavoriteBrands),
            FavoriteCategories = DeserializeJsonList(profile.FavoriteCategories),
            Notifications = DeserializeNotifications(profile.NotificationPreferences),
        });
    }

    public async Task<Result<UserPreferencesResponse>> UpdatePreferencesAsync(
        string userId, List<string>? stylePreferences, List<string>? favoriteSizes,
        List<string>? favoriteColors, List<string>? favoriteBrands,
        List<string>? favoriteCategories, NotificationPreferencesDto? notifications,
        CancellationToken ct)
    {
        var profile = await GetOrCreateProfileAsync(userId, ct);

        if (stylePreferences is not null)
            profile.StylePreferences = JsonSerializer.Serialize(stylePreferences);
        if (favoriteSizes is not null)
            profile.FavoriteSizes = JsonSerializer.Serialize(favoriteSizes);
        if (favoriteColors is not null)
            profile.FavoriteColors = JsonSerializer.Serialize(favoriteColors);
        if (favoriteBrands is not null)
            profile.FavoriteBrands = JsonSerializer.Serialize(favoriteBrands);
        if (favoriteCategories is not null)
            profile.FavoriteCategories = JsonSerializer.Serialize(favoriteCategories);
        if (notifications is not null)
            profile.NotificationPreferences = JsonSerializer.Serialize(notifications);

        profile.UpdatedAt = DateTime.UtcNow;
        profile.UpdatedBy = userId;
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("Preferences updated for user: {UserId}", userId);

        return Result<UserPreferencesResponse>.Success(new UserPreferencesResponse
        {
            StylePreferences = DeserializeJsonList(profile.StylePreferences),
            FavoriteSizes = DeserializeJsonList(profile.FavoriteSizes),
            FavoriteColors = DeserializeJsonList(profile.FavoriteColors),
            FavoriteBrands = DeserializeJsonList(profile.FavoriteBrands),
            FavoriteCategories = DeserializeJsonList(profile.FavoriteCategories),
            Notifications = DeserializeNotifications(profile.NotificationPreferences),
        });
    }

    public async Task<Result> VerifyEmailAsync(string userId, string token, CancellationToken ct)
    {
        var profile = await _dbContext.CustomerProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (profile is null)
            return Result.Failure("Perfil no encontrado");

        if (profile.EmailVerificationToken != token)
            return Result.Failure("Token de verificación inválido");

        if (profile.EmailVerificationTokenExpiry.HasValue && profile.EmailVerificationTokenExpiry < DateTime.UtcNow)
            return Result.Failure("El token de verificación ha expirado");

        profile.EmailVerified = true;
        profile.EmailVerificationToken = null;
        profile.EmailVerificationTokenExpiry = null;
        profile.UpdatedAt = DateTime.UtcNow;
        profile.UpdatedBy = userId;

        var user = await _userManager.FindByIdAsync(userId);
        if (user is not null)
        {
            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);
        }

        await _dbContext.SaveChangesAsync(ct);
        _logger.LogInformation("Email verified for user: {UserId}", userId);
        return Result.Success();
    }

    public async Task<Result> ResendVerificationEmailAsync(string email, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
            return Result.Success(); // Don't reveal user existence

        var profile = await GetOrCreateProfileAsync(user.Id, ct);

        var token = Guid.NewGuid().ToString("N");
        profile.EmailVerificationToken = token;
        profile.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
        profile.UpdatedAt = DateTime.UtcNow;
        profile.UpdatedBy = user.Id;

        await _dbContext.SaveChangesAsync(ct);

        // TODO: Send email via IEmailService with verification link
        _logger.LogInformation("Email verification token generated for {Email}: {Token}", email, token);
        return Result.Success();
    }

    public async Task<Result> LogoutAllDevicesAsync(string userId, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Result.Failure("Usuario no encontrado");

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("All sessions revoked for user: {Email}", user.Email);
        return Result.Success();
    }

    public async Task<Result<IReadOnlyList<SessionResponse>>> GetSessionsAsync(
        string userId, string? currentTokenHash, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Result<IReadOnlyList<SessionResponse>>.Failure("Usuario no encontrado");

        var sessions = new List<SessionResponse>();

        // Simple implementation: report current session based on RefreshToken existence
        if (!string.IsNullOrEmpty(user.RefreshToken))
        {
            sessions.Add(new SessionResponse
            {
                Id = "current",
                Device = "Sesión actual",
                Location = null,
                IpAddress = "N/A",
                LastActive = user.LastLoginAt ?? user.CreatedAt,
                IsCurrent = true,
            });
        }

        return Result<IReadOnlyList<SessionResponse>>.Success(sessions.AsReadOnly());
    }

    public async Task<Result> RevokeSessionAsync(string userId, string sessionId, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Result.Failure("Usuario no encontrado");

        // Simple implementation: clear refresh token
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("Session {SessionId} revoked for user: {Email}", sessionId, user.Email);
        return Result.Success();
    }
}
