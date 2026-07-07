using MediatR;
using ProxiJob.Identity.Application.DTOs;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.GoogleLogin
{
    public record GoogleLoginCommand(
        string IdToken,
        string Role
    ) : IRequest<AuthTokensDto>;
}
