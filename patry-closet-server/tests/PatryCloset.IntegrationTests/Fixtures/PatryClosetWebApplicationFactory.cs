using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Infrastructure.Persistence;

namespace PatryCloset.IntegrationTests.Fixtures;

public class PatryClosetWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"PatryClosetTest_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "SuperSecretKeyForTestingPurposesOnly_AtLeast32Characters!",
                ["Jwt:Issuer"] = "PatryCloset.Test",
                ["Jwt:Audience"] = "PatryCloset.Test",
                ["Jwt:AccessTokenExpirationMinutes"] = "60",
                ["Jwt:RefreshTokenExpirationDays"] = "7",
                ["Stripe:SecretKey"] = "sk_test_fake_key_for_testing",
                ["Stripe:PublishableKey"] = "pk_test_fake_key_for_testing",
                ["Stripe:WebhookSecret"] = "whsec_test_fake_key_for_testing",
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=test",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            // Collect ALL descriptors that carry EF Core database-provider
            // configuration so we can fully remove Npgsql and replace with InMemory.
            var toRemove = services.Where(d =>
            {
                var svcType = d.ServiceType;
                var implType = d.ImplementationType;

                // Remove DbContextOptions for our context
                if (svcType == typeof(DbContextOptions<ApplicationDbContext>))
                    return true;

                // Remove the context registration itself
                if (svcType == typeof(ApplicationDbContext))
                    return true;

                // Remove anything Npgsql-specific
                if (svcType.FullName?.Contains("Npgsql") == true)
                    return true;
                if (implType?.FullName?.Contains("Npgsql") == true)
                    return true;

                // Remove IDbContextOptionsConfiguration<ApplicationDbContext>
                // These carry the UseNpgsql() lambda and cause the dual-provider error
                if (svcType.IsGenericType)
                {
                    var genDef = svcType.GetGenericTypeDefinition();
                    var fullName = genDef.FullName ?? "";
                    if (fullName.Contains("IDbContextOptionsConfiguration"))
                    {
                        var args = svcType.GetGenericArguments();
                        if (args.Length > 0 && args[0] == typeof(ApplicationDbContext))
                            return true;
                    }
                }

                return false;
            }).ToList();

            foreach (var descriptor in toRemove)
                services.Remove(descriptor);

            // Register InMemory database
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });

            // Replace authentication with test handler
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                options.DefaultScheme = TestAuthHandler.SchemeName;
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                TestAuthHandler.SchemeName, _ => { });

            // Replace cache with no-op to avoid deserialization issues with PaginatedList
            services.RemoveAll<PatryCloset.Application.Common.Interfaces.ICacheService>();
            services.AddScoped<PatryCloset.Application.Common.Interfaces.ICacheService, NoOpCacheService>();
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Seed using the ACTUAL host's service provider (not a temporary one)
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.EnsureCreated();

        // Seed Identity roles
        var roleManager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<Microsoft.AspNetCore.Identity.IdentityRole>>();
        foreach (var role in new[] { "Admin", "Manager", "Customer" })
        {
            if (!roleManager.RoleExistsAsync(role).GetAwaiter().GetResult())
                roleManager.CreateAsync(new Microsoft.AspNetCore.Identity.IdentityRole(role)).GetAwaiter().GetResult();
        }

        SeedTestData(db);
        return host;
    }

    private static void SeedTestData(ApplicationDbContext db)
    {
        var vestidos = new Category
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Vestidos",
            Slug = "vestidos",
            Description = "Vestidos para toda ocasion",
            SortOrder = 1,
            IsActive = true,
        };

        var camisetas = new Category
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "Camisetas",
            Slug = "camisetas",
            Description = "Camisetas casuales",
            SortOrder = 2,
            IsActive = true,
        };

        db.Categories.AddRange(vestidos, camisetas);

        var product1 = new Product
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Name = "Vestido Floral Primavera",
            Slug = "vestido-floral-primavera",
            Description = "Hermoso vestido floral perfecto para la primavera",
            Price = 49.99m,
            OriginalPrice = 69.99m,
            DiscountPercent = 29,
            Brand = "Patry Originals",
            Gender = Gender.Female,
            Badge = ProductBadge.New,
            Rating = 4.5m,
            ReviewCount = 12,
            Popularity = 95,
            Material = "Algodon",
            IsActive = true,
            IsFeatured = true,
            CategoryId = vestidos.Id,
            SubcategorySlug = "vestidos-cortos",
            CreatedAt = DateTime.UtcNow.AddDays(-10),
        };

        var product2 = new Product
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Name = "Camiseta Basica Blanca",
            Slug = "camiseta-basica-blanca",
            Description = "Camiseta basica de algodon premium",
            Price = 19.99m,
            Brand = "Patry Originals",
            Gender = Gender.Female,
            Badge = ProductBadge.BestSeller,
            Rating = 4.8m,
            ReviewCount = 45,
            Popularity = 120,
            Material = "Algodon organico",
            IsActive = true,
            IsFeatured = true,
            CategoryId = camisetas.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-5),
        };

        var product3 = new Product
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            Name = "Vestido Elegante Negro",
            Slug = "vestido-elegante-negro",
            Description = "Vestido negro elegante para eventos especiales",
            Price = 89.99m,
            OriginalPrice = 120.00m,
            DiscountPercent = 25,
            Brand = "Patry Originals",
            Gender = Gender.Female,
            Badge = ProductBadge.Trending,
            Rating = 4.7m,
            ReviewCount = 28,
            Popularity = 110,
            Material = "Seda",
            IsActive = true,
            IsFeatured = false,
            CategoryId = vestidos.Id,
            SubcategorySlug = "vestidos-largos",
            CreatedAt = DateTime.UtcNow.AddDays(-3),
        };

        var inactiveProduct = new Product
        {
            Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Name = "Producto Descatalogado",
            Slug = "producto-descatalogado",
            Description = "Este producto ya no esta disponible",
            Price = 29.99m,
            Brand = "Patry Originals",
            Gender = Gender.Female,
            IsActive = false,
            IsFeatured = false,
            CategoryId = camisetas.Id,
        };

        db.Products.AddRange(product1, product2, product3, inactiveProduct);

        db.ProductImages.AddRange(
            new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = product1.Id,
                Url = "https://cdn.patrycloset.com/vestido-floral-1.jpg",
                AltText = "Vestido floral primavera - vista frontal",
                SortOrder = 0,
                IsHover = false,
            },
            new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = product1.Id,
                Url = "https://cdn.patrycloset.com/vestido-floral-2.jpg",
                AltText = "Vestido floral primavera - vista trasera",
                SortOrder = 1,
                IsHover = true,
            },
            new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = product2.Id,
                Url = "https://cdn.patrycloset.com/camiseta-blanca-1.jpg",
                AltText = "Camiseta basica blanca",
                SortOrder = 0,
                IsHover = false,
            });

        db.ProductVariants.AddRange(
            new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product1.Id,
                Color = "Rosa",
                ColorHex = "#FF69B4",
                Size = "S",
                Sku = "VFP-ROSA-S",
                StockQuantity = 10,
                IsActive = true,
            },
            new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product1.Id,
                Color = "Rosa",
                ColorHex = "#FF69B4",
                Size = "M",
                Sku = "VFP-ROSA-M",
                StockQuantity = 5,
                IsActive = true,
            },
            new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product1.Id,
                Color = "Azul",
                ColorHex = "#4169E1",
                Size = "S",
                Sku = "VFP-AZUL-S",
                StockQuantity = 0,
                IsActive = true,
            },
            new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product2.Id,
                Color = "Blanco",
                ColorHex = "#FFFFFF",
                Size = "M",
                Sku = "CBB-BLANCO-M",
                StockQuantity = 20,
                IsActive = true,
            },
            new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product2.Id,
                Color = "Blanco",
                ColorHex = "#FFFFFF",
                Size = "L",
                Sku = "CBB-BLANCO-L",
                StockQuantity = 15,
                IsActive = true,
            },
            new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product3.Id,
                Color = "Negro",
                ColorHex = "#000000",
                Size = "S",
                Sku = "VEN-NEGRO-S",
                StockQuantity = 8,
                IsActive = true,
            });

        db.SaveChanges();
    }

    public HttpClient CreateAuthenticatedClient(string role = "Customer", string? userId = null)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "test-token");

        if (role != "Customer")
            client.DefaultRequestHeaders.Add(TestAuthHandler.RoleHeader, role);

        if (userId != null)
            client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId);

        return client;
    }

    public HttpClient CreateAnonymousClient() => CreateClient();
}
