using MediatR;
using PatryCloset.Application.Common.Interfaces;
using PatryCloset.Application.Common.Models;
using PatryCloset.Application.Features.Blog.DTOs;

namespace PatryCloset.Application.Features.Blog.Commands;

// ─── Create Blog Post ───

public sealed class CreateBlogPostCommandHandler(IBlogService blogService)
    : IRequestHandler<CreateBlogPostCommand, Result<BlogPostResponse>>
{
    public Task<Result<BlogPostResponse>> Handle(
        CreateBlogPostCommand request, CancellationToken ct)
    {
        return blogService.CreatePostAsync(request.Post, request.UserId, ct);
    }
}

// ─── Update Blog Post ───

public sealed class UpdateBlogPostCommandHandler(IBlogService blogService)
    : IRequestHandler<UpdateBlogPostCommand, Result<BlogPostResponse>>
{
    public Task<Result<BlogPostResponse>> Handle(
        UpdateBlogPostCommand request, CancellationToken ct)
    {
        return blogService.UpdatePostAsync(request.Id, request.Post, request.UserId, ct);
    }
}

// ─── Delete Blog Post ───

public sealed class DeleteBlogPostCommandHandler(IBlogService blogService)
    : IRequestHandler<DeleteBlogPostCommand, Result>
{
    public Task<Result> Handle(DeleteBlogPostCommand request, CancellationToken ct)
    {
        return blogService.DeletePostAsync(request.Id, ct);
    }
}
