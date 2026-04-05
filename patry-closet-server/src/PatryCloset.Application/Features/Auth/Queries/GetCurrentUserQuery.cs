using MediatR;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Auth.DTOs;

namespace PatryCloset.Application.Features.Auth.Queries;

public sealed record GetCurrentUserQuery(string UserId) : IRequest<Result<UserProfileResponse>>;
