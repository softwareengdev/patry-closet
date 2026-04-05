using FluentAssertions;
using Moq;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.Commands;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.UnitTests.Application.Features.Auth;

#region Shared Helpers

internal static class AuthTestHelpers
{
    internal static AuthResponse CreateAuthResponse(string email = "test@email.com") => new()
    {
        AccessToken = "jwt-access-token",
        RefreshToken = "jwt-refresh-token",
        ExpiresAt = DateTime.UtcNow.AddHours(1),
        User = new UserProfileResponse
        {
            Id = Guid.NewGuid().ToString(),
            Email = email,
            FirstName = "John",
            LastName = "Doe",
            Roles = ["User"],
            CreatedAt = DateTime.UtcNow,
        }
    };
}

#endregion

#region RegisterCommandHandler

public class RegisterCommandHandlerTests
{
    private readonly Mock<IAuthService> _authService = new();
    private readonly RegisterCommandHandler _sut;

    public RegisterCommandHandlerTests() => _sut = new(_authService.Object);

    [Fact]
    public async Task Handle_WhenServiceSucceeds_ReturnsSuccessWithAuthResponse()
    {
        var command = new RegisterCommand("test@email.com", "P@ssw0rd!", "P@ssw0rd!", "John", "Doe");
        var expected = AuthTestHelpers.CreateAuthResponse();
        _authService
            .Setup(s => s.RegisterAsync(command.Email, command.Password, command.FirstName, command.LastName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<AuthResponse>.Success(expected));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(expected);
    }

    [Fact]
    public async Task Handle_WhenServiceFails_ReturnsFailure()
    {
        var command = new RegisterCommand("test@email.com", "P@ssw0rd!", "P@ssw0rd!", "John", "Doe");
        _authService
            .Setup(s => s.RegisterAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<AuthResponse>.Failure("Email already registered"));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Email already registered");
    }

    [Fact]
    public async Task Handle_PassesCorrectParametersAndCancellationToken()
    {
        var command = new RegisterCommand("new@email.com", "Str0ng!Pass", "Str0ng!Pass", "Jane", "Smith");
        using var cts = new CancellationTokenSource();
        _authService
            .Setup(s => s.RegisterAsync(command.Email, command.Password, command.FirstName, command.LastName, cts.Token))
            .ReturnsAsync(Result<AuthResponse>.Success(AuthTestHelpers.CreateAuthResponse()));

        await _sut.Handle(command, cts.Token);

        _authService.Verify(
            s => s.RegisterAsync(command.Email, command.Password, command.FirstName, command.LastName, cts.Token),
            Times.Once);
    }
}

#endregion

#region LoginCommandHandler

public class LoginCommandHandlerTests
{
    private readonly Mock<IAuthService> _authService = new();
    private readonly LoginCommandHandler _sut;

    public LoginCommandHandlerTests() => _sut = new(_authService.Object);

    [Fact]
    public async Task Handle_WhenServiceSucceeds_ReturnsSuccessWithAuthResponse()
    {
        var command = new LoginCommand("test@email.com", "P@ssw0rd!");
        var expected = AuthTestHelpers.CreateAuthResponse();
        _authService
            .Setup(s => s.LoginAsync(command.Email, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<AuthResponse>.Success(expected));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(expected);
    }

    [Fact]
    public async Task Handle_WhenServiceFails_ReturnsFailure()
    {
        var command = new LoginCommand("test@email.com", "wrong-password");
        _authService
            .Setup(s => s.LoginAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<AuthResponse>.Failure("Invalid credentials"));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid credentials");
    }

    [Fact]
    public async Task Handle_PassesCorrectParametersAndCancellationToken()
    {
        var command = new LoginCommand("user@email.com", "MyP@ss1!");
        using var cts = new CancellationTokenSource();
        _authService
            .Setup(s => s.LoginAsync(command.Email, command.Password, cts.Token))
            .ReturnsAsync(Result<AuthResponse>.Success(AuthTestHelpers.CreateAuthResponse()));

        await _sut.Handle(command, cts.Token);

        _authService.Verify(s => s.LoginAsync(command.Email, command.Password, cts.Token), Times.Once);
    }
}

#endregion

#region RefreshTokenCommandHandler

public class RefreshTokenCommandHandlerTests
{
    private readonly Mock<IAuthService> _authService = new();
    private readonly RefreshTokenCommandHandler _sut;

    public RefreshTokenCommandHandlerTests() => _sut = new(_authService.Object);

    [Fact]
    public async Task Handle_WhenServiceSucceeds_ReturnsSuccessWithAuthResponse()
    {
        var command = new RefreshTokenCommand("valid-refresh-token");
        var expected = AuthTestHelpers.CreateAuthResponse();
        _authService
            .Setup(s => s.RefreshTokenAsync(command.RefreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<AuthResponse>.Success(expected));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(expected);
    }

    [Fact]
    public async Task Handle_WhenServiceFails_ReturnsFailure()
    {
        var command = new RefreshTokenCommand("expired-token");
        _authService
            .Setup(s => s.RefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<AuthResponse>.Failure("Token expired"));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Token expired");
    }

    [Fact]
    public async Task Handle_PassesCorrectParametersAndCancellationToken()
    {
        var command = new RefreshTokenCommand("my-refresh-token");
        using var cts = new CancellationTokenSource();
        _authService
            .Setup(s => s.RefreshTokenAsync(command.RefreshToken, cts.Token))
            .ReturnsAsync(Result<AuthResponse>.Success(AuthTestHelpers.CreateAuthResponse()));

        await _sut.Handle(command, cts.Token);

        _authService.Verify(s => s.RefreshTokenAsync(command.RefreshToken, cts.Token), Times.Once);
    }
}

#endregion

#region ChangePasswordCommandHandler

public class ChangePasswordCommandHandlerTests
{
    private readonly Mock<IAuthService> _authService = new();
    private readonly ChangePasswordCommandHandler _sut;

    public ChangePasswordCommandHandlerTests() => _sut = new(_authService.Object);

    [Fact]
    public async Task Handle_WhenServiceSucceeds_ReturnsSuccess()
    {
        var command = new ChangePasswordCommand("user-id-1", "OldP@ss1!", "NewP@ss2!", "NewP@ss2!");
        _authService
            .Setup(s => s.ChangePasswordAsync(command.UserId, command.CurrentPassword, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenServiceFails_ReturnsFailure()
    {
        var command = new ChangePasswordCommand("user-id-1", "wrong", "NewP@ss2!", "NewP@ss2!");
        _authService
            .Setup(s => s.ChangePasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure("Current password is incorrect"));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Current password is incorrect");
    }

    [Fact]
    public async Task Handle_PassesCorrectParametersAndCancellationToken()
    {
        var command = new ChangePasswordCommand("user-42", "Old1!Pass", "New2!Pass", "New2!Pass");
        using var cts = new CancellationTokenSource();
        _authService
            .Setup(s => s.ChangePasswordAsync(command.UserId, command.CurrentPassword, command.NewPassword, cts.Token))
            .ReturnsAsync(Result.Success());

        await _sut.Handle(command, cts.Token);

        _authService.Verify(
            s => s.ChangePasswordAsync(command.UserId, command.CurrentPassword, command.NewPassword, cts.Token),
            Times.Once);
    }
}

#endregion

#region ForgotPasswordCommandHandler

public class ForgotPasswordCommandHandlerTests
{
    private readonly Mock<IAuthService> _authService = new();
    private readonly ForgotPasswordCommandHandler _sut;

    public ForgotPasswordCommandHandlerTests() => _sut = new(_authService.Object);

    [Fact]
    public async Task Handle_WhenServiceSucceeds_ReturnsSuccess()
    {
        var command = new ForgotPasswordCommand("user@email.com");
        _authService
            .Setup(s => s.ForgotPasswordAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenServiceFails_ReturnsFailure()
    {
        var command = new ForgotPasswordCommand("unknown@email.com");
        _authService
            .Setup(s => s.ForgotPasswordAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure("User not found"));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("User not found");
    }

    [Fact]
    public async Task Handle_PassesCorrectParametersAndCancellationToken()
    {
        var command = new ForgotPasswordCommand("forgot@email.com");
        using var cts = new CancellationTokenSource();
        _authService
            .Setup(s => s.ForgotPasswordAsync(command.Email, cts.Token))
            .ReturnsAsync(Result.Success());

        await _sut.Handle(command, cts.Token);

        _authService.Verify(s => s.ForgotPasswordAsync(command.Email, cts.Token), Times.Once);
    }
}

#endregion

#region ResetPasswordCommandHandler

public class ResetPasswordCommandHandlerTests
{
    private readonly Mock<IAuthService> _authService = new();
    private readonly ResetPasswordCommandHandler _sut;

    public ResetPasswordCommandHandlerTests() => _sut = new(_authService.Object);

    [Fact]
    public async Task Handle_WhenServiceSucceeds_ReturnsSuccess()
    {
        var command = new ResetPasswordCommand("user@email.com", "reset-token", "NewP@ss1!", "NewP@ss1!");
        _authService
            .Setup(s => s.ResetPasswordAsync(command.Email, command.Token, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenServiceFails_ReturnsFailure()
    {
        var command = new ResetPasswordCommand("user@email.com", "invalid-token", "NewP@ss1!", "NewP@ss1!");
        _authService
            .Setup(s => s.ResetPasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure("Invalid or expired token"));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid or expired token");
    }

    [Fact]
    public async Task Handle_PassesCorrectParametersAndCancellationToken()
    {
        var command = new ResetPasswordCommand("reset@email.com", "valid-token", "S3cure!Pass", "S3cure!Pass");
        using var cts = new CancellationTokenSource();
        _authService
            .Setup(s => s.ResetPasswordAsync(command.Email, command.Token, command.NewPassword, cts.Token))
            .ReturnsAsync(Result.Success());

        await _sut.Handle(command, cts.Token);

        _authService.Verify(
            s => s.ResetPasswordAsync(command.Email, command.Token, command.NewPassword, cts.Token),
            Times.Once);
    }
}

#endregion

#region RevokeTokenCommandHandler

public class RevokeTokenCommandHandlerTests
{
    private readonly Mock<IAuthService> _authService = new();
    private readonly RevokeTokenCommandHandler _sut;

    public RevokeTokenCommandHandlerTests() => _sut = new(_authService.Object);

    [Fact]
    public async Task Handle_WhenServiceSucceeds_ReturnsSuccess()
    {
        var command = new RevokeTokenCommand("user-id-1");
        _authService
            .Setup(s => s.RevokeTokenAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenServiceFails_ReturnsFailure()
    {
        var command = new RevokeTokenCommand("unknown-user");
        _authService
            .Setup(s => s.RevokeTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure("User not found"));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("User not found");
    }

    [Fact]
    public async Task Handle_PassesCorrectParametersAndCancellationToken()
    {
        var command = new RevokeTokenCommand("user-to-revoke");
        using var cts = new CancellationTokenSource();
        _authService
            .Setup(s => s.RevokeTokenAsync(command.UserId, cts.Token))
            .ReturnsAsync(Result.Success());

        await _sut.Handle(command, cts.Token);

        _authService.Verify(s => s.RevokeTokenAsync(command.UserId, cts.Token), Times.Once);
    }
}

#endregion
