using FluentValidation;
using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Wishlist.DTOs;

namespace PatryCloset.Application.Features.Wishlist.Queries;

public sealed record GetWishlistQuery(Guid CustomerProfileId, int Page = 1, int PageSize = 50)
    : IRequest<Result<WishlistDto>>;

public sealed class GetWishlistQueryValidator : AbstractValidator<GetWishlistQuery>
{
    public GetWishlistQueryValidator()
    {
        RuleFor(x => x.CustomerProfileId).NotEmpty();
        RuleFor(x => x.Page).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
