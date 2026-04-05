using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatryCloset.Domain.Entities;

namespace PatryCloset.Infrastructure.Persistence.Configurations;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Color).HasMaxLength(64).IsRequired();
        builder.Property(v => v.ColorHex).HasMaxLength(7);
        builder.Property(v => v.Size).HasMaxLength(16).IsRequired();
        builder.Property(v => v.Sku).HasMaxLength(64).IsRequired();
        builder.Property(v => v.PriceOverride).HasPrecision(18, 2);

        builder.HasIndex(v => v.Sku).IsUnique();
        builder.HasIndex(v => new { v.ProductId, v.Color, v.Size }).IsUnique();
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.ProductName).HasMaxLength(256);
        builder.Property(i => i.ProductImageUrl).HasMaxLength(512);
        builder.Property(i => i.Sku).HasMaxLength(64);
        builder.Property(i => i.Color).HasMaxLength(64);
        builder.Property(i => i.Size).HasMaxLength(16);
        builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
        builder.Property(i => i.Total).HasPrecision(18, 2);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.StripePaymentIntentId).HasMaxLength(256);
        builder.Property(p => p.StripeChargeId).HasMaxLength(256);
        builder.Property(p => p.PaymentMethod).HasMaxLength(64);
        builder.Property(p => p.FailureReason).HasMaxLength(1000);
        builder.Property(p => p.Currency).HasMaxLength(3);
        builder.Property(p => p.Amount).HasPrecision(18, 2);
        builder.Property(p => p.RefundedAmount).HasPrecision(18, 2);

        builder.HasIndex(p => p.StripePaymentIntentId);
    }
}

public class CustomerProfileConfiguration : IEntityTypeConfiguration<CustomerProfile>
{
    public void Configure(EntityTypeBuilder<CustomerProfile> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.UserId).HasMaxLength(450).IsRequired();
        builder.Property(c => c.FirstName).HasMaxLength(128).IsRequired();
        builder.Property(c => c.LastName).HasMaxLength(128).IsRequired();
        builder.Property(c => c.Phone).HasMaxLength(32);
        builder.Property(c => c.AvatarUrl).HasMaxLength(512);
        builder.Property(c => c.PreferredLanguage).HasMaxLength(8);
        builder.Property(c => c.PreferredCurrency).HasMaxLength(3);

        builder.HasIndex(c => c.UserId).IsUnique();

        builder.HasOne(c => c.Cart)
            .WithOne(cart => cart.CustomerProfile)
            .HasForeignKey<Cart>(cart => cart.CustomerProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.HasKey(w => w.Id);
        builder.HasIndex(w => new { w.CustomerProfileId, w.ProductId }).IsUnique();

        builder.HasOne(w => w.CustomerProfile)
            .WithMany(c => c.WishlistItems)
            .HasForeignKey(w => w.CustomerProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.Product)
            .WithMany(p => p.WishlistItems)
            .HasForeignKey(w => w.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Title).HasMaxLength(256);
        builder.Property(r => r.Comment).HasMaxLength(4000);

        builder.HasIndex(r => new { r.ProductId, r.CustomerProfileId }).IsUnique();
    }
}

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code).HasMaxLength(64).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(512);
        builder.Property(c => c.DiscountPercent).HasPrecision(5, 2);
        builder.Property(c => c.MaxDiscountAmount).HasPrecision(18, 2);
        builder.Property(c => c.MinOrderAmount).HasPrecision(18, 2);

        builder.HasIndex(c => c.Code).IsUnique();

        builder.Ignore(c => c.IsValid);
    }
}

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.SessionId).HasMaxLength(256);
        builder.HasIndex(c => c.SessionId);

        builder.Ignore(c => c.Total);

        builder.HasMany(c => c.Items)
            .WithOne(i => i.Cart)
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Color).HasMaxLength(64);
        builder.Property(i => i.Size).HasMaxLength(16);
        builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
    }
}

public class AddressConfiguration : IEntityTypeConfiguration<Address>
{
    public void Configure(EntityTypeBuilder<Address> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Label).HasMaxLength(64);
        builder.Property(a => a.FullName).HasMaxLength(256).IsRequired();
        builder.Property(a => a.Street).HasMaxLength(512).IsRequired();
        builder.Property(a => a.Street2).HasMaxLength(512);
        builder.Property(a => a.City).HasMaxLength(128).IsRequired();
        builder.Property(a => a.Province).HasMaxLength(128).IsRequired();
        builder.Property(a => a.PostalCode).HasMaxLength(16).IsRequired();
        builder.Property(a => a.Country).HasMaxLength(3).IsRequired();
        builder.Property(a => a.Phone).HasMaxLength(32);

        builder.HasOne(a => a.CustomerProfile)
            .WithMany(c => c.Addresses)
            .HasForeignKey(a => a.CustomerProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
