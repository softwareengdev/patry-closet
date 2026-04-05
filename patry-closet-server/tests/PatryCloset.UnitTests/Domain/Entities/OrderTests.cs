using FluentAssertions;
using PatryCloset.Domain.Entities;
using PatryCloset.Domain.Enums;

namespace PatryCloset.UnitTests.Domain.Entities;

public class OrderTests
{
    [Fact]
    public void Status_ShouldDefaultToPending()
    {
        var order = new Order();

        order.Status.Should().Be(OrderStatus.Pending);
    }

    [Fact]
    public void Currency_ShouldDefaultToEUR()
    {
        var order = new Order();

        order.Currency.Should().Be("EUR");
    }

    [Fact]
    public void ShippingMethod_ShouldDefaultToStandard()
    {
        var order = new Order();

        order.ShippingMethod.Should().Be(ShippingMethod.Standard);
    }

    [Fact]
    public void ShippingCountry_ShouldDefaultToES()
    {
        var order = new Order();

        order.ShippingCountry.Should().Be("ES");
    }

    [Fact]
    public void Items_ShouldInitializeAsEmpty()
    {
        var order = new Order();

        order.Items.Should().BeEmpty();
    }

    [Fact]
    public void StatusHistory_ShouldInitializeAsEmpty()
    {
        var order = new Order();

        order.StatusHistory.Should().BeEmpty();
    }

    [Fact]
    public void Payment_ShouldDefaultToNull()
    {
        var order = new Order();

        order.Payment.Should().BeNull();
    }
}
