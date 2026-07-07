using MediatR;
using ProxiJob.Identity.Application.DTOs;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.ResetPassword
{
    public record ResetPasswordCommand(
        string Email,
        string Code,
        string NewPassword,
        string ConfirmNewPassword
    ) : IRequest<MessageResponseDto>;
}
