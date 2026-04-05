using System.Net;
using FluentAssertions;
using PatryCloset.IntegrationTests.Fixtures;

namespace PatryCloset.IntegrationTests.Middleware;

public class SecurityHeadersTests : IClassFixture<PatryClosetWebApplicationFactory>
{
    private readonly HttpClient _client;

    public SecurityHeadersTests(PatryClosetWebApplicationFactory factory)
    {
        _client = factory.CreateAnonymousClient();
    }

    [Fact]
    public async Task Response_HasXContentTypeOptionsNosniff()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("X-Content-Type-Options", out var values).Should().BeTrue();
        values.Should().Contain("nosniff");
    }

    [Fact]
    public async Task Response_HasXFrameOptionsDeny()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("X-Frame-Options", out var values).Should().BeTrue();
        values.Should().Contain("DENY");
    }

    [Fact]
    public async Task Response_HasCorrelationId()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("X-Correlation-Id", out var values).Should().BeTrue();
        values!.First().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Response_PreservesClientCorrelationId()
    {
        var clientCorrelationId = "my-custom-trace-id-123";
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/health");
        request.Headers.Add("X-Correlation-Id", clientCorrelationId);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("X-Correlation-Id", out var values).Should().BeTrue();
        values!.First().Should().Be(clientCorrelationId);
    }

    [Fact]
    public async Task Response_HasServerTimingHeader()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("Server-Timing", out var values).Should().BeTrue();
        values!.First().Should().StartWith("total;dur=");
    }

    [Fact]
    public async Task Response_HasXXSSProtection()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("X-XSS-Protection", out var values).Should().BeTrue();
        values.Should().Contain("1; mode=block");
    }

    [Fact]
    public async Task Response_HasReferrerPolicy()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("Referrer-Policy", out var values).Should().BeTrue();
        values.Should().Contain("strict-origin-when-cross-origin");
    }

    [Fact]
    public async Task Response_HasPermissionsPolicy()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("Permissions-Policy", out var values).Should().BeTrue();
        values!.First().Should().Contain("camera=()");
    }

    [Fact]
    public async Task SecurityHeaders_PresentOnAllEndpoints()
    {
        // Test on a different endpoint to ensure middleware is global
        var response = await _client.GetAsync("/api/v1/products");

        response.Headers.TryGetValues("X-Content-Type-Options", out _).Should().BeTrue();
        response.Headers.TryGetValues("X-Correlation-Id", out _).Should().BeTrue();
        response.Headers.TryGetValues("Server-Timing", out _).Should().BeTrue();
    }
}
