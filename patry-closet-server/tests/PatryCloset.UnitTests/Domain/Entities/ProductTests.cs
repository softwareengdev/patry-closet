using FluentAssertions;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;

namespace PatryCloset.UnitTests.Domain.Entities;

public class ProductTests
{
    [Fact]
    public void Brand_ShouldDefaultToPatryOriginals()
    {
        var product = new Product();

        product.Brand.Should().Be("Patry Originals");
    }

    [Fact]
    public void IsActive_ShouldDefaultToTrue()
    {
        var product = new Product();

        product.IsActive.Should().BeTrue();
    }

    [Fact]
    public void IsFeatured_ShouldDefaultToFalse()
    {
        var product = new Product();

        product.IsFeatured.Should().BeFalse();
    }

    [Fact]
    public void Gender_ShouldDefaultToFemale()
    {
        var product = new Product();

        product.Gender.Should().Be(Gender.Female);
    }

    [Fact]
    public void Badge_ShouldDefaultToNone()
    {
        var product = new Product();

        product.Badge.Should().Be(ProductBadge.None);
    }

    [Fact]
    public void Images_ShouldInitializeAsEmpty()
    {
        var product = new Product();

        product.Images.Should().BeEmpty();
    }

    [Fact]
    public void Variants_ShouldInitializeAsEmpty()
    {
        var product = new Product();

        product.Variants.Should().BeEmpty();
    }

    [Fact]
    public void Reviews_ShouldInitializeAsEmpty()
    {
        var product = new Product();

        product.Reviews.Should().BeEmpty();
    }

    [Fact]
    public void WishlistItems_ShouldInitializeAsEmpty()
    {
        var product = new Product();

        product.WishlistItems.Should().BeEmpty();
    }
}
