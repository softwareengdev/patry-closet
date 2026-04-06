using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatryCloset.Domain.Entities;

namespace PatryCloset.Infrastructure.Persistence.Configurations;

public class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> builder)
    {
        builder.HasKey(e => e.Id);

        builder.HasIndex(e => e.TicketId).IsUnique();
        builder.HasIndex(e => e.Email);
        builder.HasIndex(e => e.Status);

        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Email).HasMaxLength(320).IsRequired();
        builder.Property(e => e.Phone).HasMaxLength(30);
        builder.Property(e => e.Subject).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Message).HasMaxLength(5000).IsRequired();
        builder.Property(e => e.TicketId).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Status).HasMaxLength(30).IsRequired();
        builder.Property(e => e.AssignedTo).HasMaxLength(450);
        builder.Property(e => e.IpAddress).HasMaxLength(45);
        builder.Property(e => e.UserAgent).HasMaxLength(512);
        builder.Property(e => e.UserId).HasMaxLength(450);
        builder.Property(e => e.AdminNotes).HasMaxLength(5000);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(e => e.Id);

        builder.HasIndex(e => new { e.UserId, e.Read });
        builder.HasIndex(e => e.CreatedAt);

        builder.Property(e => e.UserId).HasMaxLength(450).IsRequired();
        builder.Property(e => e.Type).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Title).HasMaxLength(500).IsRequired();
        builder.Property(e => e.Message).HasMaxLength(2000).IsRequired();
        builder.Property(e => e.ActionUrl).HasMaxLength(512);
    }
}
