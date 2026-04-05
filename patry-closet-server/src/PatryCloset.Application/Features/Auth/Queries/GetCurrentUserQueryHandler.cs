using MediatR;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Features.Auth.Queries;

public sealed class GetCurrentUserQueryHandler(IAuthService authService)
    : IRequestHandler<GetCurrentUserQuery, Result<UserProfileResponse>>
{
    public async Task<Result<UserProfileResponse>> Handle(GetCurrentUserQuery request, CancellationToken ct)
    {
        return await authService.GetCurrentUserAsync(request.UserId, ct);
    }
}
