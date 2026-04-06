using MediatR;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Features.Auth.Queries;

public sealed class GetUserPreferencesQueryHandler(IAuthService authService)
    : IRequestHandler<GetUserPreferencesQuery, Result<UserPreferencesResponse>>
{
    public async Task<Result<UserPreferencesResponse>> Handle(GetUserPreferencesQuery request, CancellationToken ct)
    {
        return await authService.GetPreferencesAsync(request.UserId, ct);
    }
}

public sealed class GetUserSessionsQueryHandler(IAuthService authService)
    : IRequestHandler<GetUserSessionsQuery, Result<IReadOnlyList<SessionResponse>>>
{
    public async Task<Result<IReadOnlyList<SessionResponse>>> Handle(GetUserSessionsQuery request, CancellationToken ct)
    {
        return await authService.GetSessionsAsync(request.UserId, request.CurrentTokenHash, ct);
    }
}
