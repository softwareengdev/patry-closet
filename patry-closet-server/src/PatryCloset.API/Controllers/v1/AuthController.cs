using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.Commands;
using PatryCloset.Application.Features.Auth.DTOs;
using PatryCloset.Application.Features.Auth.Queries;
using System.Security.Claims;

namespace PatryCloset.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
[Produces("application/json")]
[EnableRateLimiting("auth")]
public sealed class AuthController(ISender mediator) : ControllerBase
{
    /// <summary>Register a new customer account.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var command = new RegisterCommand(
            request.Email,
            request.Password,
            request.ConfirmPassword,
            request.FirstName,
            request.LastName);

        var result = await mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
        }

        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<AuthResponse>.Ok(result.Value!, "Cuenta creada correctamente"));
    }

    /// <summary>Authenticate with email and password.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            return Unauthorized(ApiResponse<object>.Fail(result.Error!));
        }

        return Ok(ApiResponse<AuthResponse>.Ok(result.Value!, "Sesión iniciada correctamente"));
    }

    /// <summary>Social login (Google / Apple).</summary>
    [HttpPost("social-login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SocialLogin([FromBody] SocialLoginRequest request, CancellationToken ct)
    {
        var command = new SocialLoginCommand(
            request.Provider,
            request.Token,
            request.Email,
            request.Name,
            request.Avatar);

        var result = await mediator.Send(command, ct);

        if (!result.IsSuccess)
            return BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));

        return Ok(ApiResponse<AuthResponse>.Ok(result.Value!, "Sesión iniciada correctamente"));
    }

    /// <summary>Refresh an expired access token.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var command = new RefreshTokenCommand(request.RefreshToken);
        var result = await mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            return Unauthorized(ApiResponse<object>.Fail(result.Error!));
        }

        return Ok(ApiResponse<AuthResponse>.Ok(result.Value!));
    }

    /// <summary>Revoke refresh token (logout).</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));
        }

        var command = new RevokeTokenCommand(userId);
        await mediator.Send(command, ct);

        return Ok(ApiResponse<object>.Ok(null!, "Sesión cerrada correctamente"));
    }

    /// <summary>Get the current authenticated user's profile.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));
        }

        var query = new GetCurrentUserQuery(userId);
        var result = await mediator.Send(query, ct);

        if (!result.IsSuccess)
        {
            return NotFound(ApiResponse<object>.Fail(result.Error!));
        }

        return Ok(ApiResponse<UserProfileResponse>.Ok(result.Value!));
    }

    /// <summary>Change the current user's password.</summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));
        }

        var command = new ChangePasswordCommand(
            userId,
            request.CurrentPassword,
            request.NewPassword,
            request.ConfirmNewPassword);

        var result = await mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
        }

        return Ok(ApiResponse<object>.Ok(null!, "Contraseña actualizada correctamente"));
    }

    /// <summary>Request a password reset email.</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        var command = new ForgotPasswordCommand(request.Email);
        await mediator.Send(command, ct);

        // Always return success to not reveal email existence
        return Ok(ApiResponse<object>.Ok(null!,
            "Si el email está registrado, recibirás instrucciones para recuperar tu contraseña"));
    }

    /// <summary>Reset password with a token from email.</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        var command = new ResetPasswordCommand(
            request.Email,
            request.Token,
            request.NewPassword,
            request.ConfirmNewPassword);

        var result = await mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            return BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
        }

        return Ok(ApiResponse<object>.Ok(null!, "Contraseña restablecida correctamente"));
    }

    // ─── Profile & Account Endpoints ───

    /// <summary>Update user profile.</summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));

        var command = new UpdateProfileCommand(
            userId,
            request.FirstName,
            request.LastName,
            request.Phone,
            request.DateOfBirth,
            request.Gender,
            request.PreferredLanguage,
            request.PreferredCurrency);

        var result = await mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<UserProfileResponse>.Ok(result.Value!, "Perfil actualizado"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
    }

    /// <summary>Upload avatar image.</summary>
    [HttpPost("avatar")]
    [Authorize]
    [RequestSizeLimit(5_242_880)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));

        if (file.Length == 0 || file.Length > 5_242_880)
            return BadRequest(ApiResponse<object>.Fail("El archivo debe ser menor a 5MB"));

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(ApiResponse<object>.Fail("Solo se permiten imágenes JPEG, PNG o WebP"));

        using var stream = file.OpenReadStream();
        var command = new UploadAvatarCommand(userId, stream, file.FileName, file.ContentType);
        var result = await mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(new { avatarUrl = result.Value }, "Avatar actualizado"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Get user preferences.</summary>
    [HttpGet("preferences")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserPreferencesResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPreferences(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));

        var query = new GetUserPreferencesQuery(userId);
        var result = await mediator.Send(query, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<UserPreferencesResponse>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Update user preferences.</summary>
    [HttpPut("preferences")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserPreferencesResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));

        var command = new UpdatePreferencesCommand(
            userId,
            request.StylePreferences,
            request.FavoriteSizes,
            request.FavoriteColors,
            request.FavoriteBrands,
            request.FavoriteCategories,
            request.Notifications);

        var result = await mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<UserPreferencesResponse>.Ok(result.Value!, "Preferencias actualizadas"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!, result.Errors));
    }

    /// <summary>Verify email address.</summary>
    [HttpPost("verify-email")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));

        var command = new VerifyEmailCommand(userId, request.Token);
        var result = await mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Email verificado correctamente"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Resend verification email.</summary>
    [HttpPost("resend-verification")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request, CancellationToken ct)
    {
        var command = new ResendVerificationCommand(request.Email);
        await mediator.Send(command, ct);

        return Ok(ApiResponse<object>.Ok(null!,
            "Si el email está registrado, recibirás un enlace de verificación"));
    }

    /// <summary>Logout from all devices.</summary>
    [HttpPost("logout-all")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LogoutAll(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));

        var command = new LogoutAllDevicesCommand(userId);
        var result = await mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Sesiones cerradas correctamente"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Get active sessions.</summary>
    [HttpGet("sessions")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SessionResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));

        var query = new GetUserSessionsQuery(userId, null);
        var result = await mediator.Send(query, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<IReadOnlyList<SessionResponse>>.Ok(result.Value!))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }

    /// <summary>Revoke a specific session.</summary>
    [HttpDelete("sessions/{sessionId}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RevokeSession(string sessionId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Token inválido"));

        var command = new RevokeSessionCommand(userId, sessionId);
        var result = await mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(ApiResponse<object>.Ok(null!, "Sesión revocada correctamente"))
            : BadRequest(ApiResponse<object>.Fail(result.Error!));
    }
}
