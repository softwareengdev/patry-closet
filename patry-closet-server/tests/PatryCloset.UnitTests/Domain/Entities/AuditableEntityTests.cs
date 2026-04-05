using FluentAssertions;
using PatryCloset.Domain.Common;

namespace PatryCloset.UnitTests.Domain.Entities;

public class AuditableEntityTests
{
    private class TestAuditableEntity : AuditableEntity { }

    [Fact]
    public void CreatedAt_ShouldDefaultToUtcNow()
    {
        var before = DateTime.UtcNow;
        var entity = new TestAuditableEntity();
        var after = DateTime.UtcNow;

        entity.CreatedAt.Should().BeOnOrAfter(before);
        entity.CreatedAt.Should().BeOnOrBefore(after);
    }

    [Fact]
    public void CreatedBy_ShouldDefaultToNull()
    {
        var entity = new TestAuditableEntity();

        entity.CreatedBy.Should().BeNull();
    }

    [Fact]
    public void UpdatedAt_ShouldDefaultToNull()
    {
        var entity = new TestAuditableEntity();

        entity.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public void UpdatedBy_ShouldDefaultToNull()
    {
        var entity = new TestAuditableEntity();

        entity.UpdatedBy.Should().BeNull();
    }

    [Fact]
    public void Properties_ShouldBeSettable()
    {
        var entity = new TestAuditableEntity();
        var now = DateTime.UtcNow;

        entity.CreatedAt = now;
        entity.CreatedBy = "admin";
        entity.UpdatedAt = now;
        entity.UpdatedBy = "editor";

        entity.CreatedAt.Should().Be(now);
        entity.CreatedBy.Should().Be("admin");
        entity.UpdatedAt.Should().Be(now);
        entity.UpdatedBy.Should().Be("editor");
    }
}
