using MediatR;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Identity.Application.DTOs;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.ForgotPassword
{
    public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, MessageResponseDto>
    {
        private readonly IAuthRepository _authRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;

        public ForgotPasswordCommandHandler(IAuthRepository authRepository, IUnitOfWork unitOfWork, IEmailService emailService)
        {
            _authRepository = authRepository;
            _unitOfWork = unitOfWork;
            _emailService = emailService;
        }

        public async Task<MessageResponseDto> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
        {
            var user = await _authRepository.GetUserByEmailAsync(request.Email, cancellationToken);
            if (user == null)
            {
                throw new System.Collections.Generic.KeyNotFoundException("Không tìm thấy người dùng với email này.");
            }

            // Generate a random 6-digit OTP code
            var random = new Random();
            var otp = random.Next(100000, 999999).ToString();

            user.ResetToken = otp;
            user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);

            await _authRepository.UpdateUserAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Send real email containing the OTP
            var subject = "Yêu cầu khôi phục mật khẩu - ProxiJob";
            var body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                    <h2 style='color: #FF6B00;'>Khôi phục mật khẩu ProxiJob</h2>
                    <p>Chào bạn,</p>
                    <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này.</p>
                    <p>Dưới đây là mã xác thực OTP của bạn (mã có hiệu lực trong vòng 15 phút):</p>
                    <div style='background-color: #F8F9FA; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                        <span style='font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #FF6B00;'>{otp}</span>
                    </div>
                    <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ của chúng tôi.</p>
                    <hr style='border: none; border-top: 1px solid #EEE; margin-top: 30px;' />
                    <p style='font-size: 12px; color: #888;'>Đây là email tự động từ hệ thống ProxiJob, vui lòng không phản hồi email này.</p>
                </div>";

            await _emailService.SendEmailAsync(user.Email, subject, body, cancellationToken);

            // Print the OTP code to console for development testing
            Console.WriteLine($"\n[PASSWORD RECOVERY SYSTEM] OTP Code for {user.Email} is: {otp}\n");

            return new MessageResponseDto { Message = "Mã khôi phục đã được gửi đến email của bạn." };
        }
    }
}
