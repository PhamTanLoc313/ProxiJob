using MediatR;
using ProxiJob.Identity.Application.DTOs;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.VerifyResetToken
{
    public class VerifyResetTokenCommand : IRequest<MessageResponseDto>
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
