using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Cart.DTOs;

namespace PatryCloset.Application.Features.Cart.Commands;

// ─── Add Item to Cart ───

public sealed record AddToCartCommand(
    Guid? CustomerProfileId,
    string? SessionId,
    Guid ProductId,
    string Color,
    string Size,
    int Quantity = 1)
    : IRequest<Result<CartDto>>;

public sealed class AddToCartCommandValidator : AbstractValidator<AddToCartCommand>
{
    public AddToCartCommandValidator()
    {
        RuleFor(x => x)
            .Must(x => x.CustomerProfileId.HasValue || !string.IsNullOrEmpty(x.SessionId))
            .WithMessage("Se requiere un usuario autenticado o un ID de sesión");

        RuleFor(x => x.ProductId).NotEmpty().WithMessage("El producto es obligatorio");
        RuleFor(x => x.Color).NotEmpty().WithMessage("El color es obligatorio");
        RuleFor(x => x.Size).NotEmpty().WithMessage("La talla es obligatoria");
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("La cantidad debe ser mayor que 0")
            .LessThanOrEqualTo(10).WithMessage("Máximo 10 unidades por artículo");
    }
}

// ─── Update Cart Item Quantity ───

public sealed record UpdateCartItemCommand(Guid CartItemId, Guid? CustomerProfileId, string? SessionId, int Quantity)
    : IRequest<Result<CartDto>>;

public sealed class UpdateCartItemCommandValidator : AbstractValidator<UpdateCartItemCommand>
{
    public UpdateCartItemCommandValidator()
    {
        RuleFor(x => x.CartItemId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("La cantidad debe ser mayor que 0")
            .LessThanOrEqualTo(10).WithMessage("Máximo 10 unidades por artículo");
    }
}

// ─── Remove Item from Cart ───

public sealed record RemoveCartItemCommand(Guid CartItemId, Guid? CustomerProfileId, string? SessionId)
    : IRequest<Result<CartDto>>;

// ─── Clear Cart ───

public sealed record ClearCartCommand(Guid? CustomerProfileId, string? SessionId)
    : IRequest<Result>;

// ─── Merge Guest Cart into User Cart (on login) ───

public sealed record MergeCartCommand(string SessionId, Guid CustomerProfileId)
    : IRequest<Result<CartDto>>;
