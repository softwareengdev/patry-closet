using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using PatryCloset.Application.Common.Interfaces;

namespace PatryCloset.Infrastructure.Identity;

public sealed class SocialTokenValidator : ISocialTokenValidator
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SocialTokenValidator> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public SocialTokenValidator(
        IConfiguration configuration,
        ILogger<SocialTokenValidator> logger,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<SocialUserInfo?> ValidateGoogleTokenAsync(string idToken, CancellationToken ct = default)
    {
        try
        {
            var clientId = _configuration["SocialLogin:Google:ClientId"];
            if (string.IsNullOrEmpty(clientId) || clientId.Contains("PLACEHOLDER"))
            {
                _logger.LogWarning("Google Client ID is not configured");
                return null;
            }

            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId],
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            return new SocialUserInfo
            {
                ProviderId = payload.Subject,
                Email = payload.Email,
                FirstName = payload.GivenName,
                LastName = payload.FamilyName,
                AvatarUrl = payload.Picture,
                EmailVerified = payload.EmailVerified,
            };
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Google token validation failed");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error validating Google token");
            return null;
        }
    }

    public async Task<SocialUserInfo?> ValidateAppleTokenAsync(string idToken, CancellationToken ct = default)
    {
        try
        {
            var clientId = _configuration["SocialLogin:Apple:ClientId"];
            if (string.IsNullOrEmpty(clientId) || clientId.Contains("PLACEHOLDER"))
            {
                _logger.LogWarning("Apple Client ID is not configured");
                return null;
            }

            var httpClient = _httpClientFactory.CreateClient();
            var jwksJson = await httpClient.GetStringAsync(
                "https://appleid.apple.com/auth/keys", ct);

            var jwks = new JsonWebKeySet(jwksJson);

            var validationParameters = new TokenValidationParameters
            {
                ValidIssuer = "https://appleid.apple.com",
                ValidAudience = clientId,
                IssuerSigningKeys = jwks.GetSigningKeys(),
                ValidateIssuerSigningKey = true,
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            tokenHandler.ValidateToken(idToken, validationParameters, out var validatedToken);

            var jwt = (JwtSecurityToken)validatedToken;
            var sub = jwt.Subject;
            var email = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
            var emailVerified = jwt.Claims.FirstOrDefault(c => c.Type == "email_verified")?.Value == "true";

            if (string.IsNullOrEmpty(sub) || string.IsNullOrEmpty(email))
            {
                _logger.LogWarning("Apple token missing required claims (sub or email)");
                return null;
            }

            return new SocialUserInfo
            {
                ProviderId = sub,
                Email = email,
                EmailVerified = emailVerified,
            };
        }
        catch (SecurityTokenValidationException ex)
        {
            _logger.LogWarning(ex, "Apple token validation failed");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error validating Apple token");
            return null;
        }
    }
}
