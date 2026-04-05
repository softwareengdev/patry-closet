using System.Net;
using System.Text.Json;
using FluentAssertions;
using PatryCloset.IntegrationTests.Fixtures;

namespace PatryCloset.IntegrationTests.Controllers;

public class HealthCheckTests : IClassFixture<PatryClosetWebApplicationFactory>
{
    private readonly HttpClient _client;

    public HealthCheckTests(PatryClosetWebApplicationFactory factory)
    {
        _client = factory.CreateAnonymousClient();
    }

    [Fact]
    public async Task HealthLiveEndpoint_ReturnsOk()
    {
        var response = await _client.GetAsync("/health/live");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsJsonWithChecks()
    {
        var response = await _client.GetAsync("/health");

        // May return 200 (Healthy) or 503 (Unhealthy) depending on DB/Redis availability
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        root.TryGetProperty("status", out _).Should().BeTrue();
        root.TryGetProperty("duration", out _).Should().BeTrue();
        root.TryGetProperty("checks", out _).Should().BeTrue();
    }

    [Fact]
    public async Task HealthController_ReturnsOkWithStatus()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        root.GetProperty("status").GetString().Should().Be("healthy");
        root.GetProperty("service").GetString().Should().Be("Patry Closet API");
        root.GetProperty("version").GetString().Should().Be("1.0.0");
        root.TryGetProperty("timestamp", out _).Should().BeTrue();
    }

    [Fact]
    public async Task HealthController_ReturnsJsonContentType()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task SwaggerEndpoint_IsAvailableInDevelopment()
    {
        // The factory uses Development environment
        var response = await _client.GetAsync("/swagger/v1/swagger.json");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Patry Closet API");
    }

    [Fact]
    public async Task SwaggerUI_IsAvailableInDevelopment()
    {
        var response = await _client.GetAsync("/swagger/index.html");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
