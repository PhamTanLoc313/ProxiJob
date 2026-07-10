using MediatR;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Identity.Application.DTOs;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.ResetPassword
{
    public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, MessageResponseDto>
    {
        private readonly IAuthRepository _authRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUnitOfWork _unitOfWork;

        public ResetPasswordCommandHandler(
            IAuthRepository authRepository,
            IPasswordHasher passwordHasher,
            IUnitOfWork unitOfWork)
        {
            _authRepository = authRepository;
            _passwordHasher = passwordHasher;
            _unitOfWork = unitOfWork;
        }

        public async Task<MessageResponseDto> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
        {
            var user = await _authRepository.GetUserByEmailAsync(request.Email, cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException("Yêu cầu không hợp lệ hoặc email không tồn tại.");
            }

            if (string.IsNullOrEmpty(user.ResetToken) || user.ResetToken != request.Code)
            {
                throw new InvalidOperationException("Mã xác nhận không đúng.");
            }

            if (!user.ResetTokenExpiry.HasValue || user.ResetTokenExpiry.Value < DateTime.UtcNow)
            {
                throw new InvalidOperationException("Mã xác nhận đã hết hạn.");
            }

            // Update password
            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
            user.ResetToken = null;
            user.ResetTokenExpiry = null;

            await _authRepository.UpdateUserAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new MessageResponseDto { Message = "Mật khẩu đã được đặt lại thành công." };
        }
    }
}
