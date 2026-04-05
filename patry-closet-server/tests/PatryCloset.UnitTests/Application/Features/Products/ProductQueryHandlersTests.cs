using FluentAssertions;
using PatryCloset.Application.Features.Products.DTOs;
using PatryCloset.Application.Features.Products.Queries;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;

namespace PatryCloset.UnitTests.Application.Features.Products;

#region MapToListDto Tests

public class MapToListDtoTests
{
    [Fact]
    public void MapToListDto_MapsBasicProperties()
    {
        var product = ProductTestHelpers.CreateFullProduct();

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Id.Should().Be(product.Id);
        dto.Name.Should().Be(product.Name);
        dto.Slug.Should().Be(product.Slug);
        dto.Price.Should().Be(product.Price);
        dto.OriginalPrice.Should().Be(product.OriginalPrice);
        dto.DiscountPercent.Should().Be(product.DiscountPercent);
        dto.Brand.Should().Be(product.Brand);
        dto.Rating.Should().Be(product.Rating);
        dto.ReviewCount.Should().Be(product.ReviewCount);
        dto.Popularity.Should().Be(product.Popularity);
        dto.IsFeatured.Should().Be(product.IsFeatured);
        dto.Subcategory.Should().Be(product.SubcategorySlug);
    }

    [Fact]
    public void MapToListDto_MapsPrimaryImage_FirstBySortOrder()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Images = new List<ProductImage>
        {
            new() { Id = Guid.NewGuid(), Url = "second.jpg", SortOrder = 1 },
            new() { Id = Guid.NewGuid(), Url = "first.jpg", SortOrder = 0 },
            new() { Id = Guid.NewGuid(), Url = "third.jpg", SortOrder = 2 },
        };

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Image.Should().Be("first.jpg");
    }

    [Fact]
    public void MapToListDto_MapsHoverImage_WhenIsHoverFlagSet()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Images = new List<ProductImage>
        {
            new() { Id = Guid.NewGuid(), Url = "main.jpg", SortOrder = 0 },
            new() { Id = Guid.NewGuid(), Url = "hover.jpg", SortOrder = 1, IsHover = true },
            new() { Id = Guid.NewGuid(), Url = "extra.jpg", SortOrder = 2 },
        };

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.HoverImage.Should().Be("hover.jpg");
    }

    [Fact]
    public void MapToListDto_MapsHoverImage_FallsBackToSecondImage_WhenNoIsHover()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Images = new List<ProductImage>
        {
            new() { Id = Guid.NewGuid(), Url = "main.jpg", SortOrder = 0 },
            new() { Id = Guid.NewGuid(), Url = "secondary.jpg", SortOrder = 1 },
        };

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.HoverImage.Should().Be("secondary.jpg");
    }

    [Fact]
    public void MapToListDto_MapsDistinctActiveVariantColors()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Variants = new List<ProductVariant>
        {
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "S", Sku = "1", IsActive = true, StockQuantity = 5 },
            new() { Id = Guid.NewGuid(), Color = "Azul", Size = "M", Sku = "2", IsActive = true, StockQuantity = 3 },
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "M", Sku = "3", IsActive = true, StockQuantity = 2 },
            new() { Id = Guid.NewGuid(), Color = "Verde", Size = "L", Sku = "4", IsActive = false, StockQuantity = 1 },
        };

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Colors.Should().BeEquivalentTo(["Rojo", "Azul"]);
    }

    [Fact]
    public void MapToListDto_MapsDistinctActiveVariantSizes()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Variants = new List<ProductVariant>
        {
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "S", Sku = "1", IsActive = true, StockQuantity = 5 },
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "M", Sku = "2", IsActive = true, StockQuantity = 3 },
            new() { Id = Guid.NewGuid(), Color = "Azul", Size = "S", Sku = "3", IsActive = true, StockQuantity = 2 },
            new() { Id = Guid.NewGuid(), Color = "Verde", Size = "XL", Sku = "4", IsActive = false, StockQuantity = 1 },
        };

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Sizes.Should().BeEquivalentTo(["S", "M"]);
    }

    [Fact]
    public void MapToListDto_InStock_True_WhenAnyActiveVariantHasStock()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Variants = new List<ProductVariant>
        {
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "S", Sku = "1", IsActive = true, StockQuantity = 0 },
            new() { Id = Guid.NewGuid(), Color = "Azul", Size = "M", Sku = "2", IsActive = true, StockQuantity = 3 },
        };

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.InStock.Should().BeTrue();
    }

    [Fact]
    public void MapToListDto_InStock_False_WhenNoActiveVariantHasStock()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Variants = new List<ProductVariant>
        {
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "S", Sku = "1", IsActive = true, StockQuantity = 0 },
            new() { Id = Guid.NewGuid(), Color = "Azul", Size = "M", Sku = "2", IsActive = false, StockQuantity = 10 },
        };

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.InStock.Should().BeFalse();
    }

    [Fact]
    public void MapToListDto_Badge_EmptyString_WhenNone()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Badge = ProductBadge.None;

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Badge.Should().BeEmpty();
    }

    [Theory]
    [InlineData(ProductBadge.New, "New")]
    [InlineData(ProductBadge.Trending, "Trending")]
    [InlineData(ProductBadge.BestSeller, "BestSeller")]
    [InlineData(ProductBadge.Limited, "Limited")]
    [InlineData(ProductBadge.OnSale, "OnSale")]
    public void MapToListDto_Badge_MapsEnumName_WhenNotNone(ProductBadge badge, string expected)
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Badge = badge;

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Badge.Should().Be(expected);
    }

    [Fact]
    public void MapToListDto_Category_UsesParentName_WhenParentExists()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        var parent = new Category { Id = Guid.NewGuid(), Name = "Ropa", Slug = "ropa" };
        product.Category.ParentCategory = parent;

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Category.Should().Be("Ropa");
    }

    [Fact]
    public void MapToListDto_Category_UsesSelfName_WhenNoParent()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Category.ParentCategory = null;
        product.Category.Name = "Accesorios";

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Category.Should().Be("Accesorios");
    }

    [Fact]
    public void MapToListDto_Image_EmptyString_WhenNoImages()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Images = [];

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.Image.Should().BeEmpty();
    }

    [Fact]
    public void MapToListDto_HoverImage_Null_WhenOnlyOneImageAndNoIsHover()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Images = new List<ProductImage>
        {
            new() { Id = Guid.NewGuid(), Url = "only.jpg", SortOrder = 0 },
        };

        var dto = GetProductsQueryHandler.MapToListDto(product);

        dto.HoverImage.Should().BeNull();
    }
}

#endregion

#region MapToDetailDto Tests

public class MapToDetailDtoTests
{
    [Fact]
    public void MapToDetailDto_MapsAllDetailProperties()
    {
        var product = ProductTestHelpers.CreateFullProduct();

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.Id.Should().Be(product.Id);
        dto.Name.Should().Be(product.Name);
        dto.Slug.Should().Be(product.Slug);
        dto.Description.Should().Be(product.Description);
        dto.Price.Should().Be(product.Price);
        dto.OriginalPrice.Should().Be(product.OriginalPrice);
        dto.DiscountPercent.Should().Be(product.DiscountPercent);
        dto.Brand.Should().Be(product.Brand);
        dto.Rating.Should().Be(product.Rating);
        dto.ReviewCount.Should().Be(product.ReviewCount);
        dto.Popularity.Should().Be(product.Popularity);
        dto.Material.Should().Be(product.Material);
        dto.IsFeatured.Should().Be(product.IsFeatured);
        dto.Subcategory.Should().Be(product.SubcategorySlug);
        dto.CreatedAt.Should().Be(product.CreatedAt);
    }

    [Fact]
    public void MapToDetailDto_MapsGenderAsString()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Gender = Gender.Male;

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.Gender.Should().Be("Male");
    }

    [Fact]
    public void MapToDetailDto_MapsImagesOrderedBySortOrder()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Images = new List<ProductImage>
        {
            new() { Id = Guid.NewGuid(), Url = "c.jpg", SortOrder = 2, AltText = "Third" },
            new() { Id = Guid.NewGuid(), Url = "a.jpg", SortOrder = 0, AltText = "First" },
            new() { Id = Guid.NewGuid(), Url = "b.jpg", SortOrder = 1, AltText = "Second", IsHover = true },
        };

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.Images.Should().HaveCount(3);
        dto.Images[0].Url.Should().Be("a.jpg");
        dto.Images[1].Url.Should().Be("b.jpg");
        dto.Images[2].Url.Should().Be("c.jpg");
        dto.Images[1].IsHover.Should().BeTrue();
        dto.Images[0].AltText.Should().Be("First");
    }

    [Fact]
    public void MapToDetailDto_MapsActiveVariantDetails()
    {
        var variantId = Guid.NewGuid();
        var product = ProductTestHelpers.CreateFullProduct();
        product.Variants = new List<ProductVariant>
        {
            new()
            {
                Id = variantId, Color = "Negro", ColorHex = "#000000",
                Size = "S", Sku = "NEG-S", StockQuantity = 5,
                PriceOverride = 35.99m, IsActive = true
            },
            new()
            {
                Id = Guid.NewGuid(), Color = "Blanco", Size = "M",
                Sku = "BLA-M", StockQuantity = 0, IsActive = false
            },
        };

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.Variants.Should().HaveCount(1);
        var v = dto.Variants[0];
        v.Id.Should().Be(variantId);
        v.Color.Should().Be("Negro");
        v.ColorHex.Should().Be("#000000");
        v.Size.Should().Be("S");
        v.Sku.Should().Be("NEG-S");
        v.StockQuantity.Should().Be(5);
        v.PriceOverride.Should().Be(35.99m);
        v.IsActive.Should().BeTrue();
    }

    [Fact]
    public void MapToDetailDto_MapsAvailableColorsAndSizes_FromActiveVariants()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Variants = new List<ProductVariant>
        {
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "S", Sku = "1", IsActive = true, StockQuantity = 1 },
            new() { Id = Guid.NewGuid(), Color = "Azul", Size = "M", Sku = "2", IsActive = true, StockQuantity = 2 },
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "M", Sku = "3", IsActive = true, StockQuantity = 3 },
            new() { Id = Guid.NewGuid(), Color = "Verde", Size = "XL", Sku = "4", IsActive = false, StockQuantity = 4 },
        };

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.AvailableColors.Should().BeEquivalentTo(["Rojo", "Azul"]);
        dto.AvailableSizes.Should().BeEquivalentTo(["S", "M"]);
    }

    [Fact]
    public void MapToDetailDto_MapsRecentReviews()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        var reviewId = Guid.NewGuid();
        var reviewDate = new DateTime(2025, 1, 15, 10, 0, 0, DateTimeKind.Utc);
        product.Reviews = new List<Review>
        {
            new()
            {
                Id = reviewId, Rating = 5, Title = "Great!",
                Comment = "Love this product", CreatedAt = reviewDate,
                CustomerProfileId = Guid.NewGuid(),
            }
        };

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.RecentReviews.Should().HaveCount(1);
        var r = dto.RecentReviews![0];
        r.Id.Should().Be(reviewId);
        r.Rating.Should().Be(5);
        r.Title.Should().Be("Great!");
        r.Comment.Should().Be("Love this product");
        r.AuthorName.Should().Be("Cliente verificado");
        r.CreatedAt.Should().Be(reviewDate);
    }

    [Fact]
    public void MapToDetailDto_CategorySlug_UsesParentSlug_WhenParentExists()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        var parent = new Category { Id = Guid.NewGuid(), Name = "Ropa", Slug = "ropa" };
        product.Category.ParentCategory = parent;

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.Category.Should().Be("Ropa");
        dto.CategorySlug.Should().Be("ropa");
    }

    [Fact]
    public void MapToDetailDto_CategorySlug_UsesSelfSlug_WhenNoParent()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Category.ParentCategory = null;

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.Category.Should().Be(product.Category.Name);
        dto.CategorySlug.Should().Be(product.Category.Slug);
    }

    [Fact]
    public void MapToDetailDto_Badge_EmptyString_WhenNone()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Badge = ProductBadge.None;

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.Badge.Should().BeEmpty();
    }

    [Fact]
    public void MapToDetailDto_Badge_MapsEnumName_WhenNotNone()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Badge = ProductBadge.OnSale;

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.Badge.Should().Be("OnSale");
    }

    [Fact]
    public void MapToDetailDto_InStock_BasedOnActiveVariants()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Variants = new List<ProductVariant>
        {
            new() { Id = Guid.NewGuid(), Color = "Rojo", Size = "S", Sku = "1", IsActive = true, StockQuantity = 0 },
        };

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.InStock.Should().BeFalse();
    }

    [Fact]
    public void MapToDetailDto_EmptyReviews_WhenNoReviews()
    {
        var product = ProductTestHelpers.CreateFullProduct();
        product.Reviews = [];

        var dto = GetProductBySlugQueryHandler.MapToDetailDto(product);

        dto.RecentReviews.Should().BeEmpty();
    }
}

#endregion

#region Shared Helpers

internal static class ProductTestHelpers
{
    internal static Product CreateFullProduct()
    {
        var productId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var category = new Category
        {
            Id = categoryId, Name = "Camisetas", Slug = "camisetas"
        };

        return new Product
        {
            Id = productId,
            Name = "Camiseta Floral",
            Slug = "camiseta-floral",
            Description = "Camiseta con estampado floral",
            Price = 29.99m,
            OriginalPrice = 39.99m,
            DiscountPercent = 25,
            Brand = "Patry Originals",
            Badge = ProductBadge.New,
            Gender = Gender.Female,
            Rating = 4.5m,
            ReviewCount = 12,
            Popularity = 85,
            Material = "100% Algodón",
            IsActive = true,
            IsFeatured = true,
            SubcategorySlug = "camisetas-manga-corta",
            CategoryId = categoryId,
            Category = category,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            Images = new List<ProductImage>
            {
                new() { Id = Guid.NewGuid(), ProductId = productId, Url = "img1.jpg", SortOrder = 0, AltText = "Front" },
                new() { Id = Guid.NewGuid(), ProductId = productId, Url = "img2.jpg", SortOrder = 1, IsHover = true },
            },
            Variants = new List<ProductVariant>
            {
                new() { Id = Guid.NewGuid(), ProductId = productId, Color = "Rojo", Size = "S", Sku = "CF-ROJO-S", StockQuantity = 10, IsActive = true },
                new() { Id = Guid.NewGuid(), ProductId = productId, Color = "Azul", Size = "M", Sku = "CF-AZUL-M", StockQuantity = 5, IsActive = true },
            },
            Reviews = new List<Review>
            {
                new() { Id = Guid.NewGuid(), Rating = 5, Title = "Excelente", Comment = "Me encanta", CreatedAt = DateTime.UtcNow, CustomerProfileId = Guid.NewGuid() },
            },
        };
    }
}

#endregion
