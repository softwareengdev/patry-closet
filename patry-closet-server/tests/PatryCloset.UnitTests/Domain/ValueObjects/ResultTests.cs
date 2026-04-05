using FluentAssertions;
using PatryCloset.Application.Common.Models;

namespace PatryCloset.UnitTests.Domain.ValueObjects;

public class ResultTests
{
    [Fact]
    public void Success_ShouldReturnIsSuccessTrue_AndErrorNull()
    {
        var result = Result.Success();

        result.IsSuccess.Should().BeTrue();
        result.Error.Should().BeNull();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void Failure_ShouldReturnIsSuccessFalse_AndErrorSet()
    {
        var result = Result.Failure("Something went wrong");

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Something went wrong");
    }

    [Fact]
    public void Failure_WithList_ShouldReturnFirstError_AndAllErrors()
    {
        var errors = new List<string> { "Error 1", "Error 2", "Error 3" };

        var result = Result.Failure(errors);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Error 1");
        result.Errors.Should().HaveCount(3);
        result.Errors.Should().ContainInOrder("Error 1", "Error 2", "Error 3");
    }

    [Fact]
    public void GenericSuccess_ShouldReturnValue()
    {
        var result = Result<int>.Success(42);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(42);
        result.Error.Should().BeNull();
    }

    [Fact]
    public void GenericFailure_ShouldReturnDefaultValue()
    {
        var result = Result<int>.Failure("Not found");

        result.IsSuccess.Should().BeFalse();
        result.Value.Should().Be(default(int));
        result.Error.Should().Be("Not found");
    }

    [Fact]
    public void GenericFailure_WithList_ShouldReturnDefaultValue_AndAllErrors()
    {
        var errors = new List<string> { "Validation failed", "Invalid input" };

        var result = Result<string>.Failure(errors);

        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Error.Should().Be("Validation failed");
        result.Errors.Should().HaveCount(2);
    }
}
