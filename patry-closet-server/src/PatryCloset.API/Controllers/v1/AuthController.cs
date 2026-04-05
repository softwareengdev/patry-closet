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
}
