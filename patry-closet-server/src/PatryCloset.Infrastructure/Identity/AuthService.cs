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
    private readonly ISocialTokenValidator _socialTokenValidator;
    private readonly int _refreshTokenExpirationDays;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ILogger<AuthService> logger,
        ApplicationDbContext dbContext,
        IConfiguration configuration,
        IFileStorageService fileStorageService,
        ISocialTokenValidator socialTokenValidator)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _logger = logger;
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
        _socialTokenValidator = socialTokenValidator;
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

    public async Task<Result<AuthResponse>> LoginAsync(string email, string password, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
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
        return await GenerateAuthResponseAsync(user, ipAddress, userAgent);
    }

    public async Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        // First check if there's a valid UserSession for this refresh token
        var session = await _dbContext.UserSessions
            .FirstOrDefaultAsync(s => s.RefreshToken == refreshToken && !s.IsRevoked, ct);

        if (session is not null && session.ExpiresAt <= DateTime.UtcNow)
        {
            session.IsRevoked = true;
            await _dbContext.SaveChangesAsync(ct);
            return Result<AuthResponse>.Failure("Refresh token inválido o expirado");
        }

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

        // Update session last active
        if (session is not null)
        {
            session.LastActive = DateTime.UtcNow;
            if (ipAddress is not null) session.IpAddress = ipAddress;
            await _dbContext.SaveChangesAsync(ct);
        }

        _logger.LogInformation("Token refreshed for user: {Email}", user.Email);
        return await GenerateAuthResponseAsync(user, ipAddress, userAgent);
    }

    public async Task<Result> RevokeTokenAsync(string userId, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Result.Failure("Usuario no encontrado");
        }

        // Revoke the active session matching the current refresh token
        if (!string.IsNullOrEmpty(user.RefreshToken))
        {
            var session = await _dbContext.UserSessions
                .FirstOrDefaultAsync(s => s.RefreshToken == user.RefreshToken && !s.IsRevoked, ct);
            if (session is not null)
            {
                session.IsRevoked = true;
                await _dbContext.SaveChangesAsync(ct);
            }
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

    public async Task<Result<AuthResponse>> SocialLoginAsync(
        string provider, string token, string? email, string? name, string? avatar, CancellationToken ct)
    {
        SocialUserInfo? userInfo = provider switch
        {
            "google" => await _socialTokenValidator.ValidateGoogleTokenAsync(token, ct),
            "apple" => await _socialTokenValidator.ValidateAppleTokenAsync(token, ct),
            _ => null,
        };

        if (userInfo is null)
            return Result<AuthResponse>.Failure("Token social inválido");

        var userEmail = userInfo.Email ?? email;
        if (string.IsNullOrEmpty(userEmail))
            return Result<AuthResponse>.Failure("No se pudo obtener el email del proveedor");

        var user = provider switch
        {
            "google" => await _userManager.Users.FirstOrDefaultAsync(u => u.GoogleId == userInfo.ProviderId, ct),
            "apple" => await _userManager.Users.FirstOrDefaultAsync(u => u.AppleId == userInfo.ProviderId, ct),
            _ => null,
        };

        user ??= await _userManager.FindByEmailAsync(userEmail);

        if (user is not null)
        {
            if (provider == "google" && string.IsNullOrEmpty(user.GoogleId))
                user.GoogleId = userInfo.ProviderId;
            if (provider == "apple" && string.IsNullOrEmpty(user.AppleId))
                user.AppleId = userInfo.ProviderId;

            if (!user.IsActive)
                return Result<AuthResponse>.Failure("Cuenta desactivada");

            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("Social login ({Provider}) for existing user: {Email}", provider, user.Email);
        }
        else
        {
            var firstName = userInfo.FirstName ?? name?.Split(' ').FirstOrDefault() ?? "";
            var lastName = userInfo.LastName ?? name?.Split(' ').Skip(1).FirstOrDefault() ?? "";

            user = new ApplicationUser
            {
                UserName = userEmail,
                Email = userEmail,
                FirstName = firstName,
                LastName = lastName,
                AvatarUrl = userInfo.AvatarUrl ?? avatar,
                EmailConfirmed = userInfo.EmailVerified,
                GoogleId = provider == "google" ? userInfo.ProviderId : null,
                AppleId = provider == "apple" ? userInfo.ProviderId : null,
                LoginProvider = provider,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow,
                IsActive = true,
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                var errors = createResult.Errors.Select(e => e.Description).ToList();
                _logger.LogWarning("Social registration failed for {Email}: {Errors}", userEmail, string.Join(", ", errors));
                return Result<AuthResponse>.Failure(errors.AsReadOnly());
            }

            await _userManager.AddToRoleAsync(user, "Customer");

            var profile = new CustomerProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                AvatarUrl = user.AvatarUrl,
                EmailVerified = userInfo.EmailVerified,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = user.Id,
            };
            _dbContext.CustomerProfiles.Add(profile);
            await _dbContext.SaveChangesAsync(ct);

            _logger.LogInformation("New user registered via social login ({Provider}): {Email}", provider, userEmail);
        }

        return await GenerateAuthResponseAsync(user);
    }

    private async Task<Result<AuthResponse>> GenerateAuthResponseAsync(
        ApplicationUser user, string? ipAddress = null, string? userAgent = null)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email!, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Revoke old session for this user's current refresh token (if refreshing)
        if (!string.IsNullOrEmpty(user.RefreshToken))
        {
            var oldSession = await _dbContext.UserSessions
                .FirstOrDefaultAsync(s => s.RefreshToken == user.RefreshToken && !s.IsRevoked);
            if (oldSession is not null)
            {
                oldSession.IsRevoked = true;
            }
        }

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays);
        await _userManager.UpdateAsync(user);

        // Create new UserSession
        var (device, browser, os) = ParseUserAgent(userAgent);
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshToken = refreshToken,
            Device = device,
            Browser = browser,
            OperatingSystem = os,
            IpAddress = ipAddress,
            LastActive = DateTime.UtcNow,
            ExpiresAt = user.RefreshTokenExpiryTime.Value,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = user.Id,
        };

        _dbContext.UserSessions.Add(session);
        await _dbContext.SaveChangesAsync();

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

    private static (string? Device, string? Browser, string? Os) ParseUserAgent(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return (null, null, null);

        string? browser = null;
        string? os = null;
        string? device = null;

        // Simple OS detection
        if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase)) os = "Windows";
        else if (userAgent.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase)) os = "macOS";
        else if (userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase)) os = "iOS";
        else if (userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase)) os = "iPadOS";
        else if (userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase)) os = "Android";
        else if (userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase)) os = "Linux";

        // Simple browser detection
        if (userAgent.Contains("Edg/", StringComparison.OrdinalIgnoreCase)) browser = "Edge";
        else if (userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)) browser = "Chrome";
        else if (userAgent.Contains("Firefox/", StringComparison.OrdinalIgnoreCase)) browser = "Firefox";
        else if (userAgent.Contains("Safari/", StringComparison.OrdinalIgnoreCase) &&
                 !userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)) browser = "Safari";

        // Simple device detection
        if (userAgent.Contains("Mobile", StringComparison.OrdinalIgnoreCase)) device = "Mobile";
        else if (userAgent.Contains("Tablet", StringComparison.OrdinalIgnoreCase) ||
                 userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase)) device = "Tablet";
        else device = "Desktop";

        return (device, browser, os);
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

        // Revoke all active sessions
        var activeSessions = await _dbContext.UserSessions
            .Where(s => s.UserId == userId && !s.IsRevoked)
            .ToListAsync(ct);

        foreach (var session in activeSessions)
            session.IsRevoked = true;

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("All sessions revoked for user: {Email}", user.Email);
        return Result.Success();
    }

    public async Task<Result<IReadOnlyList<SessionResponse>>> GetSessionsAsync(
        string userId, string? currentTokenHash, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Result<IReadOnlyList<SessionResponse>>.Failure("Usuario no encontrado");

        var activeSessions = await _dbContext.UserSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && !s.IsRevoked && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.LastActive)
            .ToListAsync(ct);

        if (activeSessions.Count == 0)
        {
            // Fallback: if no sessions in DB yet, show current based on RefreshToken
            var sessions = new List<SessionResponse>();
            if (!string.IsNullOrEmpty(user.RefreshToken))
            {
                sessions.Add(new SessionResponse
                {
                    Id = "current",
                    Device = "Sesión actual",
                    Browser = null,
                    Os = null,
                    Location = null,
                    IpAddress = "N/A",
                    LastActive = user.LastLoginAt ?? user.CreatedAt,
                    IsCurrent = true,
                });
            }
            return Result<IReadOnlyList<SessionResponse>>.Success(sessions.AsReadOnly());
        }

        var currentRefreshToken = user.RefreshToken;
        var result = activeSessions.Select(s => new SessionResponse
        {
            Id = s.Id.ToString(),
            Device = s.Device ?? "Dispositivo desconocido",
            Browser = s.Browser,
            Os = s.OperatingSystem,
            Location = s.Location,
            IpAddress = s.IpAddress ?? "N/A",
            LastActive = s.LastActive,
            IsCurrent = currentRefreshToken is not null && s.RefreshToken == currentRefreshToken,
        }).ToList();

        return Result<IReadOnlyList<SessionResponse>>.Success(result.AsReadOnly());
    }

    public async Task<Result> RevokeSessionAsync(string userId, string sessionId, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Result.Failure("Usuario no encontrado");

        if (!Guid.TryParse(sessionId, out var sessionGuid))
        {
            // Legacy "current" session handling for backward compatibility
            if (sessionId == "current")
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                await _userManager.UpdateAsync(user);
                return Result.Success();
            }
            return Result.Failure("ID de sesión inválido");
        }

        var session = await _dbContext.UserSessions
            .FirstOrDefaultAsync(s => s.Id == sessionGuid && s.UserId == userId && !s.IsRevoked, ct);

        if (session is null)
            return Result.Failure("Sesión no encontrada");

        session.IsRevoked = true;
        await _dbContext.SaveChangesAsync(ct);

        // If this session's refresh token matches the user's current one, clear it
        if (user.RefreshToken == session.RefreshToken)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _userManager.UpdateAsync(user);
        }

        _logger.LogInformation("Session {SessionId} revoked for user: {Email}", sessionId, user.Email);
        return Result.Success();
    }
}
