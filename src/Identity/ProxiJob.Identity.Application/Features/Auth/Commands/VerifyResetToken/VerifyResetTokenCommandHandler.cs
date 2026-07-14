using MediatR;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.VerifyResetToken
{
    public class VerifyResetTokenCommandHandler : IRequestHandler<VerifyResetTokenCommand, MessageResponseDto>
    {
        private readonly IAuthRepository _authRepository;

        public VerifyResetTokenCommandHandler(IAuthRepository authRepository)
        {
            _authRepository = authRepository;
        }

        public async Task<MessageResponseDto> Handle(VerifyResetTokenCommand request, CancellationToken cancellationToken)
        {
            var user = await _authRepository.GetUserByEmailAsync(request.Email, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("Không tìm thấy người dùng với email này.");
            }

            if (string.IsNullOrEmpty(user.ResetToken) || user.ResetToken != request.Code)
            {
                throw new ArgumentException("Mã xác thực OTP không chính xác.");
            }

            if (user.ResetTokenExpiry == null || user.ResetTokenExpiry < DateTime.UtcNow)
            {
                throw new ArgumentException("Mã xác thực OTP đã hết hạn.");
            }

            return new MessageResponseDto { Message = "Mã xác thực hợp lệ." };
        }
    }
}
