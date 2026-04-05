using System.Security.Claims;

namespace PatryCloset.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(string userId, string email, IEnumerable<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateExpiredToken(string token);
}
