using FluentAssertions;
using PatryCloset.Domain.Entities;

namespace PatryCloset.UnitTests.Domain.Entities;

public class CartTests
{
    [Fact]
    public void NewCart_ShouldHaveEmptyItems()
    {
        var cart = new Cart();

        cart.Items.Should().BeEmpty();
    }

    [Fact]
    public void Total_ShouldReturnZero_WhenCartIsEmpty()
    {
        var cart = new Cart();

        cart.Total.Should().Be(0m);
    }

    [Fact]
    public void Total_ShouldCalculateCorrectly_WithSingleItem()
    {
        var cart = new Cart
        {
            Items = [new CartItem { UnitPrice = 25.50m, Quantity = 1 }]
        };

        cart.Total.Should().Be(25.50m);
    }

    [Fact]
    public void Total_ShouldCalculateCorrectly_WithMultipleItems()
    {
        var cart = new Cart
        {
            Items =
            [
                new CartItem { UnitPrice = 10.00m, Quantity = 1 },
                new CartItem { UnitPrice = 20.00m, Quantity = 1 },
                new CartItem { UnitPrice = 5.50m, Quantity = 1 }
            ]
        };

        cart.Total.Should().Be(35.50m);
    }

    [Fact]
    public void Total_ShouldAccountForQuantity()
    {
        var cart = new Cart
        {
            Items =
            [
                new CartItem { UnitPrice = 15.00m, Quantity = 3 },
                new CartItem { UnitPrice = 8.00m, Quantity = 2 }
            ]
        };

        cart.Total.Should().Be(61.00m); // (15*3) + (8*2)
    }

    [Fact]
    public void SessionId_CanBeSet_ForGuestCarts()
    {
        var cart = new Cart { SessionId = "guest-session-123" };

        cart.SessionId.Should().Be("guest-session-123");
    }

    [Fact]
    public void CustomerProfileId_CanBeSet_ForAuthenticatedUsers()
    {
        var profileId = Guid.NewGuid();
        var cart = new Cart { CustomerProfileId = profileId };

        cart.CustomerProfileId.Should().Be(profileId);
    }
}
