using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatryCloset.Domain.Entities;

namespace PatryCloset.Infrastructure.Persistence.Configurations;

public class BlogPostConfiguration : IEntityTypeConfiguration<BlogPost>
{
    public void Configure(EntityTypeBuilder<BlogPost> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title).HasMaxLength(500).IsRequired();
        builder.Property(e => e.Slug).HasMaxLength(500).IsRequired();
        builder.Property(e => e.Excerpt).HasMaxLength(2000);
        builder.Property(e => e.Category).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Season).HasMaxLength(50);
        builder.Property(e => e.Badge).HasMaxLength(50);
        builder.Property(e => e.CoverImageAlt).HasMaxLength(500);

        builder.HasIndex(e => e.Slug).IsUnique();
        builder.HasIndex(e => e.Category);
        builder.HasIndex(e => e.Featured);
        builder.HasIndex(e => e.Published);
        builder.HasIndex(e => e.PublishedAt);

        builder.HasOne(e => e.Author)
            .WithMany(a => a.Posts)
            .HasForeignKey(e => e.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BlogAuthorConfiguration : IEntityTypeConfiguration<BlogAuthor>
{
    public void Configure(EntityTypeBuilder<BlogAuthor> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Slug).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Role).HasMaxLength(200);
        builder.Property(e => e.Bio).HasMaxLength(2000);

        builder.HasIndex(e => e.Slug).IsUnique();
    }
}
