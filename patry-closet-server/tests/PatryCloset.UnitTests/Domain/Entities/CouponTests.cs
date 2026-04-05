using FluentAssertions;
using PatryCloset.Domain.Entities;

namespace PatryCloset.UnitTests.Domain.Entities;

public class CouponTests
{
    private static Coupon CreateValidCoupon() => new()
    {
        Code = "SUMMER25",
        DiscountPercent = 25,
        IsActive = true,
        ValidFrom = DateTime.UtcNow.AddDays(-1),
        ValidTo = DateTime.UtcNow.AddDays(30),
        MaxUsageCount = 100,
        UsedCount = 0
    };

    [Fact]
    public void IsValid_ShouldReturnTrue_ForActiveValidCoupon()
    {
        var coupon = CreateValidCoupon();

        coupon.IsValid.Should().BeTrue();
    }

    [Fact]
    public void IsValid_ShouldReturnFalse_WhenIsActiveIsFalse()
    {
        var coupon = CreateValidCoupon();
        coupon.IsActive = false;

        coupon.IsValid.Should().BeFalse();
    }

    [Fact]
    public void IsValid_ShouldReturnFalse_WhenBeforeValidFrom()
    {
        var coupon = CreateValidCoupon();
        coupon.ValidFrom = DateTime.UtcNow.AddDays(1);

        coupon.IsValid.Should().BeFalse();
    }

    [Fact]
    public void IsValid_ShouldReturnFalse_WhenAfterValidTo()
    {
        var coupon = CreateValidCoupon();
        coupon.ValidTo = DateTime.UtcNow.AddDays(-1);

        coupon.IsValid.Should().BeFalse();
    }

    [Fact]
    public void IsValid_ShouldReturnFalse_WhenUsedCountEqualsMaxUsageCount()
    {
        var coupon = CreateValidCoupon();
        coupon.MaxUsageCount = 10;
        coupon.UsedCount = 10;

        coupon.IsValid.Should().BeFalse();
    }

    [Fact]
    public void IsValid_ShouldReturnFalse_WhenUsedCountExceedsMaxUsageCount()
    {
        var coupon = CreateValidCoupon();
        coupon.MaxUsageCount = 10;
        coupon.UsedCount = 15;

        coupon.IsValid.Should().BeFalse();
    }

    [Fact]
    public void IsActive_ShouldDefaultToTrue()
    {
        var coupon = new Coupon();

        coupon.IsActive.Should().BeTrue();
    }
}
