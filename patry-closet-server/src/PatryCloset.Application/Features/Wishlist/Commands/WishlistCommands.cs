using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Wishlist.DTOs;

namespace PatryCloset.Application.Features.Wishlist.Commands;

// ─── Add to Wishlist ───

public sealed record AddToWishlistCommand(Guid CustomerProfileId, Guid ProductId)
    : IRequest<Result<WishlistItemDto>>;

public sealed class AddToWishlistCommandValidator : AbstractValidator<AddToWishlistCommand>
{
    public AddToWishlistCommandValidator()
    {
        RuleFor(x => x.CustomerProfileId).NotEmpty();
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("El producto es obligatorio");
    }
}

// ─── Remove from Wishlist ───

public sealed record RemoveFromWishlistCommand(Guid CustomerProfileId, Guid ProductId)
    : IRequest<Result>;

// ─── Toggle Wishlist (add if absent, remove if present) ───

public sealed record ToggleWishlistCommand(Guid CustomerProfileId, Guid ProductId)
    : IRequest<Result<bool>>; // returns true if added, false if removed

// ─── Check if product is in wishlist ───

public sealed record IsInWishlistQuery(Guid CustomerProfileId, Guid ProductId)
    : IRequest<Result<bool>>;
