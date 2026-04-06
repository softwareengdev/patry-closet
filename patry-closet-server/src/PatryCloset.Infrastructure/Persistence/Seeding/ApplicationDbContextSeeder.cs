using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;
using PatryCloset.Infrastructure.Identity;

namespace PatryCloset.Infrastructure.Persistence.Seeding;

public static class ApplicationDbContextSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ILogger logger)
    {
        await SeedRolesAsync(roleManager, logger);
        await SeedAdminUserAsync(userManager, logger);
        await SeedCategoriesAsync(context, logger);
        await SeedProductsAsync(context, logger);
        await SeedBlogAsync(context, logger);
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager, ILogger logger)
    {
        string[] roles = ["Admin", "Manager", "Customer"];

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Seeded role: {Role}", role);
            }
        }
    }

    private static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager, ILogger logger)
    {
        const string adminEmail = "admin@patrycloset.com";

        if (await userManager.FindByEmailAsync(adminEmail) is not null)
            return;

        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FirstName = "Patricia",
            LastName = "Admin",
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        var result = await userManager.CreateAsync(admin, "PatryCloset2024!");
        if (result.Succeeded)
        {
            await userManager.AddToRolesAsync(admin, ["Admin", "Manager"]);
            logger.LogInformation("Seeded admin user: {Email}", adminEmail);
        }
    }

    // ─── Categories ───

    private static readonly Dictionary<string, (string Slug, int Order)> TopCategories = new()
    {
        ["Mujeres"] = ("mujeres", 1),
        ["Hombres"] = ("hombres", 2),
        ["Accesorios"] = ("accesorios", 3),
    };

    private static readonly Dictionary<string, string[]> Subcategories = new()
    {
        ["Mujeres"] = ["vestidos", "tops", "pantalones", "faldas", "abrigos", "lenceria"],
        ["Hombres"] = ["camisas", "pantalones", "chaquetas", "calzado"],
        ["Accesorios"] = ["bolsos", "joyas", "cinturones", "gafas", "relojes", "sombreros"],
    };

    private static async Task SeedCategoriesAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Categories.AnyAsync())
            return;

        foreach (var (name, (slug, order)) in TopCategories)
        {
            var parent = new Category
            {
                Id = Guid.NewGuid(),
                Name = name,
                Slug = slug,
                SortOrder = order,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };
            context.Categories.Add(parent);

            if (Subcategories.TryGetValue(name, out var subs))
            {
                for (int i = 0; i < subs.Length; i++)
                {
                    // Prefix subcategory slug with parent slug to avoid duplicates (e.g. "mujeres-pantalones")
                    context.Categories.Add(new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = char.ToUpper(subs[i][0]) + subs[i][1..],
                        Slug = $"{slug}-{subs[i]}",
                        SortOrder = i + 1,
                        IsActive = true,
                        ParentCategoryId = parent.Id,
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} categories", await context.Categories.CountAsync());
    }

    // ─── Products ───

    private static readonly Dictionary<string, string> ColorMap = new()
    {
        ["Rojo"] = "#DC2626", ["Azul"] = "#2563EB", ["Negro"] = "#1A1A1A",
        ["Gris"] = "#6B7280", ["Rosa"] = "#EC4899", ["Verde"] = "#059669",
        ["Beige"] = "#D2B48C", ["Blanco"] = "#F5F5F5", ["Marrón"] = "#8B4513",
        ["Plateado"] = "#C0C0C0", ["Crema"] = "#FFFDD0", ["Burdeos"] = "#800020",
        ["Camel"] = "#C19A6B", ["Lavanda"] = "#E6E6FA", ["Oliva"] = "#808000",
        ["Dorado"] = "#D4AF37", ["Nude"] = "#E8C4A8", ["Coral"] = "#FF7F50",
        ["Marino"] = "#1B3A5C", ["Mostaza"] = "#E1AD01",
    };

    private static ProductBadge ParseBadge(string? badge) => badge switch
    {
        "new" => ProductBadge.New,
        "trending" => ProductBadge.Trending,
        "bestSeller" => ProductBadge.BestSeller,
        "limited" => ProductBadge.Limited,
        "onSale" => ProductBadge.OnSale,
        _ => ProductBadge.None,
    };

    private static async Task SeedProductsAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.Products.AnyAsync())
            return;

        var categories = await context.Categories.ToListAsync();
        var catMap = categories.ToDictionary(c => c.Slug, c => c.Id);

        var products = GetMockProducts();
        var now = DateTime.UtcNow;

        foreach (var p in products)
        {
            // Resolve category: use "parent-subcategory" prefixed slug, fallback to top-level
            var parentSlug = p.Category.ToLowerInvariant() switch
            {
                "mujeres" => "mujeres",
                "hombres" => "hombres",
                "accesorios" => "accesorios",
                _ => "mujeres",
            };

            Guid categoryId;
            var subSlug = !string.IsNullOrEmpty(p.Subcategory) ? $"{parentSlug}-{p.Subcategory}" : null;
            if (subSlug is not null && catMap.TryGetValue(subSlug, out var subId))
            {
                categoryId = subId;
            }
            else
            {
                categoryId = catMap.GetValueOrDefault(parentSlug, catMap["mujeres"]);
            }

            var slug = GenerateSlug(p.Name);

            var product = new Product
            {
                Id = Guid.NewGuid(),
                Name = p.Name,
                Slug = slug,
                Description = p.Description,
                Price = p.Price,
                OriginalPrice = p.OriginalPrice,
                DiscountPercent = p.Discount,
                Brand = p.Brand,
                Badge = ParseBadge(p.Badge),
                Rating = p.Rating,
                ReviewCount = p.ReviewCount,
                Popularity = p.Popularity,
                IsActive = true,
                IsFeatured = p.Popularity >= 85,
                CategoryId = categoryId,
                SubcategorySlug = p.Subcategory,
                Gender = parentSlug == "hombres" ? Gender.Male : Gender.Female,
                CreatedAt = now,
            };

            // Images
            for (int i = 0; i < p.Images.Length; i++)
            {
                product.Images.Add(new ProductImage
                {
                    Id = Guid.NewGuid(),
                    Url = p.Images[i],
                    AltText = $"{p.Name} - Imagen {i + 1}",
                    SortOrder = i,
                    IsHover = i == 1,
                    ProductId = product.Id,
                });
            }

            // Variants: create one variant per color×size combination
            foreach (var color in p.Colors)
            {
                ColorMap.TryGetValue(color, out var hex);
                foreach (var size in p.Sizes)
                {
                    // Use full slug (up to 20 chars) + first 3 of color + size for unique SKU
                    var skuSlug = slug.ToUpperInvariant().Replace("-", "");
                    if (skuSlug.Length > 20) skuSlug = skuSlug[..20];
                    var skuColor = color.Replace(" ", "").ToUpperInvariant();
                    if (skuColor.Length > 4) skuColor = skuColor[..4];

                    product.Variants.Add(new ProductVariant
                    {
                        Id = Guid.NewGuid(),
                        Color = color,
                        ColorHex = hex,
                        Size = size,
                        Sku = $"PC-{skuSlug}-{skuColor}-{size}",
                        StockQuantity = p.InStock ? Random.Shared.Next(3, 25) : 0,
                        IsActive = true,
                        ProductId = product.Id,
                    });
                }
            }

            context.Products.Add(product);
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} products", await context.Products.CountAsync());
    }

    private static string GenerateSlug(string name) =>
        name.ToLowerInvariant()
            .Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u")
            .Replace("ñ", "n").Replace("ü", "u")
            .Replace(' ', '-')
            .Where(c => char.IsLetterOrDigit(c) || c == '-')
            .Aggregate("", (current, c) => current + c)
            .Trim('-');

    // ─── Mock product data (matching frontend) ───

    private record MockProduct(
        string Name, string Description, decimal Price, decimal? OriginalPrice, int Discount,
        string[] Images, string Category, string Subcategory, string[] Colors, string[] Sizes,
        string? Badge, decimal Rating, int ReviewCount, int Popularity, string Brand, bool InStock);

    private static MockProduct[] GetMockProducts() =>
    [
        new("Vestido Midi Floral", "Vestido midi de viscosa con estampado floral exclusivo. Perfecto para eventos de primavera y cenas al aire libre.", 69.99m, null, 0,
            ["https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "vestidos", ["Rosa", "Crema", "Verde"], ["XS", "S", "M", "L", "XL"], "new", 4.7m, 187, 92, "Patry Originals", true),

        new("Vestido Cóctel Satinado", "Vestido corto de satén con escote cruzado y cintura definida. Ideal para fiestas y celebraciones nocturnas.", 89.99m, 109.99m, 18,
            ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "vestidos", ["Negro", "Burdeos", "Azul"], ["XS", "S", "M", "L"], "bestSeller", 4.8m, 312, 97, "Maison Noir", true),

        new("Vestido Bohemio Maxi", "Vestido largo de algodón con bordados artesanales y mangas amplias. Perfecto para paseos y eventos informales.", 59.99m, null, 0,
            ["https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "vestidos", ["Beige", "Coral", "Lavanda"], ["S", "M", "L", "XL"], null, 4.3m, 95, 74, "Bloom Studio", true),

        new("Vestido Wrap Elegante", "Vestido envolvente de jersey suave con estampado geométrico. Versátil para oficina o brunch de fin de semana.", 79.99m, null, 0,
            ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "vestidos", ["Marino", "Rojo", "Negro"], ["XS", "S", "M", "L"], null, 4.5m, 156, 85, "Luxe Atelier", true),

        new("Blusa Romántica de Seda", "Blusa de seda natural con lazada al cuello y mangas abullonadas. Elegancia atemporal para la oficina o citas especiales.", 44.99m, 54.99m, 18,
            ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1434389677669-e08b4cda3f05?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "tops", ["Blanco", "Rosa", "Lavanda"], ["XS", "S", "M", "L", "XL"], null, 4.4m, 134, 80, "Patry Originals", true),

        new("Top Crop Deportivo", "Top cropped de algodón orgánico con detalle de cordón ajustable. Ideal para looks casuales y actividades al aire libre.", 29.99m, null, 0,
            ["https://images.unsplash.com/photo-1434389677669-e08b4cda3f05?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1520975918318-3e9c9dbead13?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "tops", ["Negro", "Blanco", "Mostaza"], ["XS", "S", "M", "L"], null, 4.1m, 67, 63, "Urban Edge", false),

        new("Camiseta Oversize Estampada", "Camiseta de algodón premium con corte oversize y gráficos artísticos. Comodidad urbana con un toque de estilo.", 34.99m, null, 0,
            ["https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1520975918318-3e9c9dbead13?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "tops", ["Gris", "Negro", "Crema", "Rosa"], ["S", "M", "L", "XL"], "new", 4.2m, 89, 71, "Bloom Studio", true),

        new("Pantalón Wide Leg Lino", "Pantalón de lino con pierna ancha y cintura alta elástica. Frescura y elegancia para los días cálidos.", 54.99m, null, 0,
            ["https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "pantalones", ["Beige", "Blanco", "Oliva"], ["XS", "S", "M", "L", "XL"], "bestSeller", 4.6m, 245, 91, "Patry Originals", true),

        new("Vaquero Slim Fit Premium", "Vaquero de corte ajustado en denim italiano con elasticidad superior. El básico perfecto para cualquier outfit.", 64.99m, null, 0,
            ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "pantalones", ["Azul", "Negro", "Gris"], ["XS", "S", "M", "L", "XL"], "trending", 4.7m, 289, 93, "Denim & Co", true),

        new("Pantalón Palazzo Fluido", "Pantalón palazzo de tejido fluido con cintura alta y caída elegante. Perfecto para looks sofisticados.", 49.99m, 59.99m, 17,
            ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "pantalones", ["Negro", "Crema", "Burdeos"], ["S", "M", "L"], null, 4.4m, 178, 82, "Luxe Atelier", true),

        new("Falda Plisada Midi", "Falda plisada de satén con cintura elástica. Movimiento y elegancia en cada paso.", 45.99m, null, 0,
            ["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "faldas", ["Dorado", "Negro", "Burdeos"], ["XS", "S", "M", "L"], "trending", 4.5m, 167, 86, "Maison Noir", true),

        new("Minifalda Denim", "Minifalda de denim clásica con bolsillos y cierre de botones. Un básico atemporal para todas las estaciones.", 39.99m, null, 0,
            ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "faldas", ["Azul", "Negro", "Blanco"], ["XS", "S", "M", "L"], null, 4.2m, 132, 76, "Denim & Co", true),

        new("Abrigo Largo de Lana", "Abrigo largo de lana merino con solapas anchas y cinturón. Sofisticación máxima para invierno.", 149.99m, null, 0,
            ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "abrigos", ["Camel", "Negro", "Gris"], ["XS", "S", "M", "L"], "limited", 4.9m, 342, 98, "Luxe Atelier", true),

        new("Blazer Oversize Structured", "Blazer oversize de lana con hombros marcados y cierre cruzado. La pieza statement de la temporada.", 119.99m, 139.99m, 14,
            ["https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "abrigos", ["Negro", "Beige", "Gris"], ["XS", "S", "M", "L", "XL"], "bestSeller", 4.8m, 267, 95, "Patry Originals", true),

        new("Trench Coat Clásico", "Trench coat de algodón impermeable con doble botonadura y cinturón. El icono de la elegancia británica.", 129.99m, null, 0,
            ["https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "abrigos", ["Camel", "Negro", "Marino"], ["S", "M", "L"], null, 4.6m, 198, 88, "Maison Noir", true),

        new("Bolso Tote de Cuero", "Bolso tote espacioso de cuero genuino con forro de seda y bolsillo interior con cremallera.", 89.99m, null, 0,
            ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "bolsos", ["Negro", "Camel", "Burdeos"], ["Única"], "bestSeller", 4.7m, 234, 90, "Luxe Atelier", true),

        new("Clutch de Noche Cristal", "Clutch de satén negro con detalle de cristales Swarovski. El complemento perfecto para galas y eventos.", 59.99m, null, 0,
            ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "bolsos", ["Negro", "Dorado", "Plateado"], ["Única"], "limited", 4.6m, 89, 78, "Maison Noir", true),

        new("Collar Cadena Dorada", "Collar de cadena en oro de 18k con eslabones gruesos. Pieza statement para elevar cualquier look.", 34.99m, null, 0,
            ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1515562141589-67f0d364884b?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "joyas", ["Dorado"], ["Única"], "new", 4.3m, 156, 77, "Patry Originals", true),

        new("Pendientes Perla Barroca", "Pendientes colgantes con perlas barrocas naturales y cierre de plata 925. Elegancia orgánica.", 24.99m, null, 0,
            ["https://images.unsplash.com/photo-1515562141589-67f0d364884b?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "joyas", ["Plateado", "Dorado"], ["Única"], null, 4.5m, 203, 83, "Bloom Studio", true),

        new("Cinturón Ancho Cuero", "Cinturón ancho de cuero italiano con hebilla geométrica dorada. Define tu silueta con un toque luxe.", 29.99m, null, 0,
            ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "cinturones", ["Negro", "Camel", "Marrón"], ["S", "M", "L"], null, 4.4m, 145, 79, "Luxe Atelier", true),

        new("Gafas Cat-Eye Vintage", "Gafas de sol cat-eye con montura de acetato y lentes polarizadas UV400. Retro-glam en estado puro.", 44.99m, null, 0,
            ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "gafas", ["Negro", "Marrón", "Carey"], ["Única"], "trending", 4.6m, 178, 84, "Maison Noir", true),

        new("Reloj Minimalista Rose Gold", "Reloj de pulsera con esfera minimalista en rose gold y correa de cuero genuino. Tiempo con estilo.", 69.99m, null, 0,
            ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "relojes", ["Rosa", "Dorado", "Plateado"], ["Única"], null, 4.8m, 267, 91, "Bloom Studio", true),

        new("Sombrero Fedora Fieltro", "Sombrero fedora de fieltro de lana con banda de grosgrain. El toque bohemio-chic definitivo.", 39.99m, null, 0,
            ["https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "sombreros", ["Negro", "Camel", "Gris"], ["S/M", "L/XL"], null, 4.3m, 98, 72, "Urban Edge", true),

        new("Camisa Oxford Premium", "Camisa Oxford de algodón 100% con cuello button-down y tejido texturizado. El básico masculino por excelencia.", 49.99m, null, 0,
            ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"],
            "Hombres", "camisas", ["Blanco", "Azul", "Rosa"], ["S", "M", "L", "XL", "XXL"], null, 4.5m, 189, 87, "Patry Originals", true),

        new("Camisa Lino Mandarina", "Camisa de lino puro con cuello mao y botones de nácar. Frescura mediterránea con un toque oriental.", 54.99m, null, 0,
            ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"],
            "Hombres", "camisas", ["Blanco", "Beige", "Marino"], ["S", "M", "L", "XL"], "new", 4.4m, 112, 79, "Luxe Atelier", true),

        new("Chino Slim Stretch", "Pantalón chino de algodón stretch con corte slim y cintura media. Versatilidad total para cualquier ocasión.", 44.99m, null, 0,
            ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80"],
            "Hombres", "pantalones", ["Beige", "Negro", "Marino", "Oliva"], ["S", "M", "L", "XL", "XXL"], "bestSeller", 4.6m, 234, 90, "Denim & Co", true),

        new("Vaquero Recto Selvedge", "Vaquero de denim selvedge japonés con corte recto y detalles premium. Para el amante del denim auténtico.", 79.99m, null, 0,
            ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80"],
            "Hombres", "pantalones", ["Azul", "Negro"], ["S", "M", "L", "XL"], "limited", 4.8m, 198, 89, "Denim & Co", true),

        new("Chaqueta Bomber Satén", "Chaqueta bomber de satén con forro acolchado y ribetes elásticos. El equilibrio entre sport y lujo.", 89.99m, 109.99m, 18,
            ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80"],
            "Hombres", "chaquetas", ["Negro", "Verde", "Marino"], ["S", "M", "L", "XL"], "trending", 4.5m, 167, 85, "Urban Edge", true),

        new("Blazer Slim Italiano", "Blazer de corte slim en lana italiana con forro de seda. Sastrería impecable para el hombre moderno.", 129.99m, null, 0,
            ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"],
            "Hombres", "chaquetas", ["Marino", "Negro", "Gris"], ["S", "M", "L", "XL"], "bestSeller", 4.9m, 312, 96, "Luxe Atelier", true),

        new("Conjunto Lencería Encaje", "Conjunto de sujetador y braguita de encaje francés con detalle de lazo. Feminidad y comodidad.", 39.99m, null, 0,
            ["https://images.unsplash.com/photo-1617331140180-e8262094733a?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "lenceria", ["Negro", "Rosa", "Nude"], ["XS", "S", "M", "L"], null, 4.4m, 178, 81, "Bloom Studio", true),

        new("Body de Encaje Transparente", "Body de encaje semitransparente con escote en V profundo y cierres de presión. Atrevimiento y sofisticación.", 34.99m, null, 0,
            ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1617331140180-e8262094733a?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "lenceria", ["Negro", "Burdeos", "Blanco"], ["XS", "S", "M", "L"], "trending", 4.3m, 134, 77, "Maison Noir", true),

        // Additional products to reach ~35 items
        new("Vestido Asimétrico Satén", "Vestido asimétrico de satén con un solo tirante y abertura lateral. Dramático y sofisticado para eventos especiales.", 99.99m, null, 0,
            ["https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "vestidos", ["Negro", "Dorado", "Burdeos"], ["XS", "S", "M", "L"], "limited", 4.8m, 198, 94, "Maison Noir", true),

        new("Top Bardot Ruffle", "Top off-shoulder con volantes en cascada y tejido crêpe. Romanticismo moderno para días de verano.", 32.99m, null, 0,
            ["https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1434389677669-e08b4cda3f05?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "tops", ["Blanco", "Coral", "Lavanda"], ["XS", "S", "M", "L"], null, 4.3m, 112, 75, "Bloom Studio", true),

        new("Jogger Premium Felpa", "Pantalón jogger de felpa premium con puños ajustables y cintura elástica. Athleisure en su máxima expresión.", 39.99m, null, 0,
            ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "pantalones", ["Gris", "Negro", "Crema"], ["XS", "S", "M", "L", "XL"], null, 4.2m, 156, 73, "Urban Edge", true),

        new("Falda Lápiz Cuero", "Falda lápiz de cuero vegano con cremallera posterior y abertura. Poder y feminidad en una sola prenda.", 59.99m, null, 0,
            ["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "faldas", ["Negro", "Burdeos", "Camel"], ["XS", "S", "M", "L"], "bestSeller", 4.7m, 289, 92, "Luxe Atelier", true),

        new("Parka Técnica Urbana", "Parka con membrana impermeable y capucha desmontable. Protección total con estilo metropolitano.", 139.99m, 169.99m, 18,
            ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=600&q=80"],
            "Mujeres", "abrigos", ["Oliva", "Negro", "Marino"], ["XS", "S", "M", "L", "XL"], null, 4.5m, 167, 84, "Urban Edge", true),

        new("Mochila Cuero Minimalista", "Mochila compacta de cuero con compartimento para portátil y bolsillos ocultos. Funcionalidad con diseño.", 74.99m, null, 0,
            ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "bolsos", ["Negro", "Marrón", "Camel"], ["Única"], null, 4.5m, 156, 82, "Denim & Co", true),

        new("Pulsera Eslabones Plata", "Pulsera de eslabones gruesos en plata 925 con cierre de seguridad. Audacia en la muñeca.", 19.99m, null, 0,
            ["https://images.unsplash.com/photo-1515562141589-67f0d364884b?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "joyas", ["Plateado"], ["Única"], null, 4.2m, 89, 68, "Patry Originals", true),

        new("Polo Classic Fit", "Polo de piqué de algodón con cuello y puños de canalé. Casual elegante para el día a día.", 34.99m, null, 0,
            ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"],
            "Hombres", "camisas", ["Blanco", "Negro", "Marino", "Verde"], ["S", "M", "L", "XL", "XXL"], null, 4.4m, 178, 83, "Patry Originals", true),

        new("Zapatillas Urbanas Cuero", "Zapatillas bajas de cuero con suela vulcanizada y plantilla de memory foam. Confort premium diario.", 79.99m, null, 0,
            ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80"],
            "Hombres", "calzado", ["Blanco", "Negro", "Gris"], ["39", "40", "41", "42", "43", "44"], "new", 4.7m, 234, 91, "Urban Edge", true),

        new("Gafas Aviador Titanio", "Gafas de sol aviador con montura de titanio ultraligero y lentes polarizadas. Iconismo contemporáneo.", 54.99m, null, 0,
            ["https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80"],
            "Accesorios", "gafas", ["Dorado", "Plateado", "Negro"], ["Única"], null, 4.6m, 198, 86, "Luxe Atelier", true),
    ];

    // ─── Blog Seed Data ───

    private static async Task SeedBlogAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.BlogAuthors.AnyAsync())
            return;

        var authors = new BlogAuthor[]
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Patricia Mendoza",
                Slug = "patricia-mendoza",
                Role = "Directora Creativa",
                AvatarUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                Bio = "Fundadora y directora creativa de PATRY♡CLOSET con más de 15 años de experiencia en moda sostenible.",
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Elena Ruiz",
                Slug = "elena-ruiz",
                Role = "Editora de Moda",
                AvatarUrl = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
                Bio = "Periodista de moda y experta en tendencias internacionales.",
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Marcos Delgado",
                Slug = "marcos-delgado",
                Role = "Experto en Sostenibilidad",
                AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                Bio = "Consultor en moda sostenible y economía circular.",
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Lucía Fernández",
                Slug = "lucia-fernandez",
                Role = "Estilista Senior",
                AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                Bio = "Estilista profesional especializada en moda contemporánea y street style.",
            },
        };

        context.BlogAuthors.AddRange(authors);
        await context.SaveChangesAsync();

        var now = DateTime.UtcNow;
        var posts = new BlogPost[]
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Las 10 Tendencias que Dominarán este Otoño-Invierno 2025",
                Slug = "tendencias-otono-invierno-2025",
                Excerpt = "Descubre las tendencias más impactantes de la temporada: desde el quiet luxury hasta los tonos burgundy que transformarán tu armario.",
                Content = @"# Las 10 Tendencias que Dominarán este Otoño-Invierno 2025

La temporada otoño-invierno 2025 llega cargada de propuestas que fusionan elegancia atemporal con toques de audacia contemporánea. En PATRY♡CLOSET hemos seleccionado las diez tendencias que no pueden faltar en tu armario.

## 1. Quiet Luxury
El lujo silencioso sigue reinando. Prendas de calidad excepcional, cortes impecables y materiales nobles hablan por sí solos sin necesidad de logos evidentes.

## 2. Burgundy Total Look
El color estrella de la temporada. Desde abrigos hasta accesorios, el burgundy aporta sofisticación y calidez.

## 3. Texturas Envolventes
Terciopelo, punto grueso y piel vuelta crean looks táctiles que invitan al abrazo.

## 4. Sastrería Oversized
Blazers amplios y pantalones de pinza con siluetas relajadas pero estructuradas.

## 5. Botas Statement
Las botas se convierten en protagonistas con diseños de caña alta y tacones escultóricos.",
                CoverImage = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
                CoverImageAlt = "Tendencias moda otoño-invierno 2025",
                Category = "trends",
                Season = "fall-winter",
                Tags = """["tendencias","otoño-invierno","quiet-luxury","burgundy"]""",
                Badge = "trending",
                ReadingTime = 8,
                Featured = true,
                Trending = true,
                Published = true,
                PublishedAt = now.AddDays(-2),
                AuthorId = authors[1].Id,
                ViewCount = 1240,
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Guía Completa: Cómo Crear un Armario Cápsula Sostenible",
                Slug = "armario-capsula-sostenible",
                Excerpt = "Aprende a construir un guardarropa minimalista y versátil que reduce tu impacto ambiental sin sacrificar estilo.",
                Content = @"# Cómo Crear un Armario Cápsula Sostenible

Un armario cápsula es una colección reducida de prendas versátiles que se combinan entre sí para crear múltiples looks. En PATRY♡CLOSET creemos que menos es más.

## ¿Qué es un Armario Cápsula?
Se trata de seleccionar entre 30 y 40 prendas esenciales que reflejen tu estilo personal y que puedan combinarse de múltiples maneras.

## Pasos para Construirlo

### 1. Audita tu Armario Actual
Revisa cada prenda y pregúntate: ¿La he usado en los últimos 6 meses? ¿Me hace sentir bien?

### 2. Define tu Paleta de Colores
Elige 3-4 colores neutros base y 2-3 colores de acento que te favorezcan.

### 3. Invierte en Básicos de Calidad
Un buen blazer, unos pantalones bien cortados y una camisa blanca impecable son la base de todo.",
                CoverImage = "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1200&q=80",
                CoverImageAlt = "Armario cápsula sostenible organizado",
                Category = "sustainability",
                Season = "all-year",
                Tags = """["sostenibilidad","armario-cápsula","minimalismo","moda-consciente"]""",
                ReadingTime = 12,
                Featured = true,
                Trending = false,
                Published = true,
                PublishedAt = now.AddDays(-5),
                AuthorId = authors[2].Id,
                ViewCount = 890,
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Cómo Combinar Estampados como una Experta",
                Slug = "combinar-estampados-guia",
                Excerpt = "Domina el arte del pattern mixing con nuestras reglas de oro para mezclar estampados sin miedo.",
                Content = @"# Cómo Combinar Estampados como una Experta

Mezclar estampados puede parecer intimidante, pero con las reglas adecuadas se convierte en tu mejor herramienta de estilo.

## Regla 1: Varía las Escalas
Combina un estampado grande con uno pequeño. Por ejemplo, rayas anchas con lunares pequeños.

## Regla 2: Mantén una Paleta Común
Asegúrate de que los estampados compartan al menos un color en común.

## Regla 3: Usa un Neutro como Puente
Una prenda lisa en color neutro entre dos estampados suaviza la transición.

## Combinaciones Infalibles
- Rayas + Flores
- Cuadros + Lunares
- Animal print + Geométricos (con moderación)",
                CoverImage = "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
                CoverImageAlt = "Mujer con outfit de estampados combinados",
                Category = "style-guides",
                Season = "all-year",
                Tags = """["estilo","estampados","pattern-mixing","guía"]""",
                ReadingTime = 6,
                Featured = false,
                Trending = true,
                Published = true,
                PublishedAt = now.AddDays(-8),
                AuthorId = authors[3].Id,
                ViewCount = 654,
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Detrás de PATRY♡CLOSET: Nuestra Historia y Valores",
                Slug = "historia-patry-closet",
                Excerpt = "Conoce cómo nació PATRY♡CLOSET y los principios que guían cada decisión, desde el diseño hasta la entrega.",
                Content = @"# Detrás de PATRY♡CLOSET: Nuestra Historia y Valores

PATRY♡CLOSET nació de un sueño: hacer que la moda de calidad sea accesible y sostenible para todas.

## Nuestros Inicios
Todo empezó en un pequeño taller en Madrid, donde Patricia Mendoza comenzó a diseñar prendas que combinaban artesanía tradicional con diseño contemporáneo.

## Nuestros Valores
- **Sostenibilidad**: Cada decisión considera su impacto ambiental.
- **Calidad sobre cantidad**: Prendas diseñadas para durar temporadas.
- **Inclusividad**: Moda para todos los cuerpos y estilos.
- **Transparencia**: Cadena de suministro abierta y honesta.

## Mirando al Futuro
Seguimos comprometidos con innovar en materiales sostenibles y prácticas éticas de producción.",
                CoverImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
                CoverImageAlt = "Taller de diseño PATRY CLOSET",
                Category = "behind-the-brand",
                Season = null,
                Tags = """["marca","historia","valores","sostenibilidad"]""",
                Badge = "new",
                ReadingTime = 10,
                Featured = true,
                Trending = false,
                Published = true,
                PublishedAt = now.AddDays(-12),
                AuthorId = authors[0].Id,
                ViewCount = 1580,
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Colaboración Exclusiva: PATRY♡CLOSET × Artesanos Locales",
                Slug = "colaboracion-artesanos-locales",
                Excerpt = "Descubre nuestra nueva colección cápsula creada en colaboración con artesanos textiles de toda España.",
                Content = @"# Colaboración Exclusiva: PATRY♡CLOSET × Artesanos Locales

Nos emociona presentar nuestra colección más especial: una colaboración con maestros artesanos de distintas regiones de España.

## El Proyecto
Durante 6 meses, nuestro equipo de diseño trabajó codo a codo con artesanos textiles de Galicia, Andalucía y Cataluña.

## Las Piezas
Cada pieza de la colección incorpora técnicas artesanales tradicionales:
- **Encaje de bolillos** de Camariñas en blusas contemporáneas
- **Bordado a mano** andaluz en chaquetas denim
- **Tejido a telar** catalán en accesorios premium

## Edición Limitada
Solo 200 unidades de cada diseño, numeradas y certificadas. Cada prenda incluye una etiqueta con la historia del artesano que la creó.",
                CoverImage = "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80",
                CoverImageAlt = "Artesana tejiendo en telar tradicional",
                Category = "collaborations",
                Season = "spring-summer",
                Tags = """["colaboración","artesanía","edición-limitada","hecho-en-españa"]""",
                Badge = "new",
                ReadingTime = 7,
                Featured = true,
                Trending = true,
                Published = true,
                PublishedAt = now.AddDays(-1),
                AuthorId = authors[0].Id,
                ViewCount = 2100,
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Primavera-Verano 2025: Colores que Iluminan",
                Slug = "colores-primavera-verano-2025",
                Excerpt = "Los tonos pastel y los estallidos de color neón se fusionan en la paleta más vibrante de la próxima temporada.",
                Content = @"# Primavera-Verano 2025: Colores que Iluminan

La próxima temporada primavera-verano viene cargada de optimismo cromático. Te contamos qué colores dominarán las calles.

## Pasteles Sofisticados
El lavanda, rosa cuarzo y azul cielo se presentan en versiones más maduras y sofisticadas.

## Neón Controlado
Toques de verde lima, naranja eléctrico y fucsia como acentos en looks neutros.

## El Blanco Óptico
El blanco puro se consolida como el nuevo negro. Looks total white con diferentes texturas.

## Cómo Incorporarlos
- Empieza por accesorios si los colores vivos te intimidan
- Combina un color pastel con uno neutro para equilibrio
- Usa el neón como acento, nunca como base del look",
                CoverImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
                CoverImageAlt = "Paleta de colores primavera verano 2025",
                Category = "trends",
                Season = "spring-summer",
                Tags = """["tendencias","primavera-verano","colores","paleta"]""",
                ReadingTime = 5,
                Featured = false,
                Trending = false,
                Published = true,
                PublishedAt = now.AddDays(-15),
                AuthorId = authors[1].Id,
                ViewCount = 430,
            },
        };

        context.BlogPosts.AddRange(posts);
        await context.SaveChangesAsync();

        logger.LogInformation("Seeded {Count} blog authors and {PostCount} blog posts", authors.Length, posts.Length);
    }
}
