using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatryCloset.Domain.Entities;

namespace PatryCloset.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber).HasMaxLength(32).IsRequired();
        builder.Property(o => o.Subtotal).HasPrecision(18, 2);
        builder.Property(o => o.ShippingCost).HasPrecision(18, 2);
        builder.Property(o => o.Tax).HasPrecision(18, 2);
        builder.Property(o => o.DiscountAmount).HasPrecision(18, 2);
        builder.Property(o => o.Total).HasPrecision(18, 2);
        builder.Property(o => o.Currency).HasMaxLength(3);
        builder.Property(o => o.TrackingNumber).HasMaxLength(128);
        builder.Property(o => o.CouponCode).HasMaxLength(64);
        builder.Property(o => o.Notes).HasMaxLength(2000);

        builder.Property(o => o.ShippingFullName).HasMaxLength(256);
        builder.Property(o => o.ShippingStreet).HasMaxLength(512);
        builder.Property(o => o.ShippingStreet2).HasMaxLength(512);
        builder.Property(o => o.ShippingCity).HasMaxLength(128);
        builder.Property(o => o.ShippingProvince).HasMaxLength(128);
        builder.Property(o => o.ShippingPostalCode).HasMaxLength(16);
        builder.Property(o => o.ShippingCountry).HasMaxLength(3);
        builder.Property(o => o.ShippingPhone).HasMaxLength(32);

        builder.HasIndex(o => o.OrderNumber).IsUnique();
        builder.HasIndex(o => o.Status);
        builder.HasIndex(o => o.CustomerProfileId);

        builder.HasOne(o => o.CustomerProfile)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CustomerProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Payment)
            .WithOne(p => p.Order)
            .HasForeignKey<Payment>(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.StatusHistory)
            .WithOne(h => h.Order)
            .HasForeignKey(h => h.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
