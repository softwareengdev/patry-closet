using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace PatryCloset.IntegrationTests.Fixtures;

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestScheme";
    public const string TestUserId = "test-user-id-001";
    public const string TestUserEmail = "test@patrycloset.com";
    public const string TestUserRole = "Customer";

    public const string AdminUserId = "test-admin-id-001";
    public const string AdminUserEmail = "admin@patrycloset.com";

    // Custom header to override role in individual requests
    public const string RoleHeader = "X-Test-Role";
    public const string UserIdHeader = "X-Test-UserId";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // If no Authorization header, skip (allow anonymous endpoints)
        if (!Context.Request.Headers.ContainsKey("Authorization"))
            return Task.FromResult(AuthenticateResult.NoResult());

        var authHeader = Context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return Task.FromResult(AuthenticateResult.NoResult());

        // Allow configuring role/userId per request via custom headers
        var role = Context.Request.Headers.TryGetValue(RoleHeader, out var roleValue)
            ? roleValue.ToString()
            : TestUserRole;

        var userId = Context.Request.Headers.TryGetValue(UserIdHeader, out var userIdValue)
            ? userIdValue.ToString()
            : TestUserId;

        var email = role == "Admin" ? AdminUserEmail : TestUserEmail;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new("sub", userId),
            new(ClaimTypes.Email, email),
            new("email", email),
            new(ClaimTypes.Role, role),
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
