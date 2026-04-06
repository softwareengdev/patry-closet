using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Features.Auth.Queries;

public sealed record GetUserPreferencesQuery(string UserId) : IRequest<Result<UserPreferencesResponse>>;

public sealed record GetUserSessionsQuery(string UserId, string? CurrentTokenHash) : IRequest<Result<IReadOnlyList<SessionResponse>>>;
