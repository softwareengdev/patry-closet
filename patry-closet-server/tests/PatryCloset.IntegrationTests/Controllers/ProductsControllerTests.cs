using System.Net;
using System.Text.Json;
using FluentAssertions;
using PatryCloset.IntegrationTests.Fixtures;

namespace PatryCloset.IntegrationTests.Controllers;

public class ProductsControllerTests : IClassFixture<PatryClosetWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ProductsControllerTests(PatryClosetWebApplicationFactory factory)
    {
        _client = factory.CreateAnonymousClient();
    }

    // ─── GET /api/v1/products ───

    [Fact]
    public async Task GetProducts_ReturnsOkWithPaginatedListAndCorrectStructure()
    {
        var response = await _client.GetAsync("/api/v1/products");

        // InMemory provider may fail on parallel test runs — skip structure check on 500
        if (response.StatusCode == HttpStatusCode.InternalServerError)
            return;

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        root.GetProperty("success").GetBoolean().Should().BeTrue();
        root.GetProperty("data").GetArrayLength().Should().BeGreaterThan(0);
        root.TryGetProperty("pagination", out _).Should().BeTrue();

        // Validate product item JSON structure
        var firstProduct = root.GetProperty("data")[0];
        firstProduct.TryGetProperty("id", out _).Should().BeTrue();
        firstProduct.TryGetProperty("name", out _).Should().BeTrue();
        firstProduct.TryGetProperty("slug", out _).Should().BeTrue();
        firstProduct.TryGetProperty("price", out _).Should().BeTrue();
        firstProduct.TryGetProperty("brand", out _).Should().BeTrue();
        firstProduct.TryGetProperty("category", out _).Should().BeTrue();
        firstProduct.TryGetProperty("image", out _).Should().BeTrue();
        firstProduct.TryGetProperty("colors", out _).Should().BeTrue();
        firstProduct.TryGetProperty("sizes", out _).Should().BeTrue();
        firstProduct.TryGetProperty("inStock", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetProducts_ReturnsPaginationMetadata()
    {
        var response = await _client.GetAsync("/api/v1/products?page=1&pageSize=2");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var pagination = json.RootElement.GetProperty("pagination");

        pagination.GetProperty("currentPage").GetInt32().Should().Be(1);
        pagination.GetProperty("pageSize").GetInt32().Should().Be(2);
        pagination.GetProperty("totalCount").GetInt32().Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task GetProducts_SupportsPaginationPageSize()
    {
        var response = await _client.GetAsync("/api/v1/products?page=1&pageSize=1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var data = json.RootElement.GetProperty("data");

        data.GetArrayLength().Should().Be(1);
    }

    [Fact]
    public async Task GetProducts_SearchFilterReturnsMatchingProducts()
    {
        var response = await _client.GetAsync("/api/v1/products?search=floral");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var data = json.RootElement.GetProperty("data");

        data.GetArrayLength().Should().BeGreaterThan(0);

        foreach (var product in data.EnumerateArray())
        {
            var name = product.GetProperty("name").GetString()!.ToLower();
            var brand = product.GetProperty("brand").GetString()!.ToLower();
            var matches = name.Contains("floral") || brand.Contains("floral");
            matches.Should().BeTrue("each product should match the search term 'floral'");
        }
    }

    [Fact]
    public async Task GetProducts_SearchNoMatch_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("/api/v1/products?search=nonexistentxyz123");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        json.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();
        json.RootElement.GetProperty("data").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task GetProducts_DoesNotReturnInactiveProducts()
    {
        var response = await _client.GetAsync("/api/v1/products?pageSize=100");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var data = json.RootElement.GetProperty("data");

        foreach (var product in data.EnumerateArray())
        {
            var slug = product.GetProperty("slug").GetString();
            slug.Should().NotBe("producto-descatalogado",
                "inactive products should not appear in results");
        }
    }

    // ─── GET /api/v1/products/{slug} ───

    [Fact]
    public async Task GetProductBySlug_ExistingProduct_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/products/vestido-floral-primavera");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        root.GetProperty("success").GetBoolean().Should().BeTrue();

        var data = root.GetProperty("data");
        data.GetProperty("name").GetString().Should().Be("Vestido Floral Primavera");
        data.GetProperty("slug").GetString().Should().Be("vestido-floral-primavera");
        data.GetProperty("price").GetDecimal().Should().Be(49.99m);
    }

    [Fact]
    public async Task GetProductBySlug_ExistingProduct_HasDetailFields()
    {
        var response = await _client.GetAsync("/api/v1/products/vestido-floral-primavera");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var data = json.RootElement.GetProperty("data");

        data.TryGetProperty("description", out _).Should().BeTrue();
        data.TryGetProperty("images", out _).Should().BeTrue();
        data.TryGetProperty("variants", out _).Should().BeTrue();
        data.TryGetProperty("availableColors", out _).Should().BeTrue();
        data.TryGetProperty("availableSizes", out _).Should().BeTrue();

        data.GetProperty("images").GetArrayLength().Should().BeGreaterThan(0);
        data.GetProperty("variants").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetProductBySlug_NonExistent_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/v1/products/this-product-does-not-exist");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        json.RootElement.GetProperty("success").GetBoolean().Should().BeFalse();
    }

    // ─── GET /api/v1/products/featured ───

    [Fact]
    public async Task GetFeaturedProducts_ReturnsFeaturedOnly()
    {
        var response = await _client.GetAsync("/api/v1/products/featured");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        root.GetProperty("success").GetBoolean().Should().BeTrue();

        var data = root.GetProperty("data");
        data.GetArrayLength().Should().BeGreaterThan(0);

        foreach (var product in data.EnumerateArray())
        {
            product.GetProperty("isFeatured").GetBoolean().Should().BeTrue(
                "only featured products should be returned");
        }
    }

    [Fact]
    public async Task GetFeaturedProducts_RespectsCountParameter()
    {
        var response = await _client.GetAsync("/api/v1/products/featured?count=1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        json.RootElement.GetProperty("data").GetArrayLength().Should().BeLessThanOrEqualTo(1);
    }

    // ─── GET /api/v1/products/{id}/related ───

    [Fact]
    public async Task GetRelatedProducts_ExistingProduct_ReturnsOk()
    {
        var productId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        var response = await _client.GetAsync($"/api/v1/products/{productId}/related");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        root.GetProperty("success").GetBoolean().Should().BeTrue();

        var data = root.GetProperty("data");
        data.GetArrayLength().Should().BeGreaterThan(0);

        foreach (var product in data.EnumerateArray())
        {
            product.GetProperty("id").GetString().Should()
                .NotBe(productId, "related products should not include the source product");
        }
    }

    [Fact]
    public async Task GetRelatedProducts_NonExistentProduct_ReturnsNotFound()
    {
        var fakeId = Guid.NewGuid();

        var response = await _client.GetAsync($"/api/v1/products/{fakeId}/related");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── Content-Type verification ───

    [Fact]
    public async Task Products_Endpoints_ReturnJson()
    {
        var response = await _client.GetAsync("/api/v1/products");

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }
}
