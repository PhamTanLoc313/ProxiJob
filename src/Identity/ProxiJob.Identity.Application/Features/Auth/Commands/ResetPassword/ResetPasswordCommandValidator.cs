using FluentValidation;
using ProxiJob.Identity.Application.Common.Messages;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.ResetPassword
{
    public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
    {
        public ResetPasswordCommandValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(ValidationMessages.EmailRequired)
                .EmailAddress().WithMessage(ValidationMessages.EmailInvalid);

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã xác thực không được để trống.")
                .Length(6).WithMessage("Mã xác thực phải gồm 6 ký tự.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Mật khẩu mới không được để trống.")
                .MinimumLength(8).WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");

            RuleFor(x => x.ConfirmNewPassword)
                .NotEmpty().WithMessage("Xác nhận mật khẩu mới không được để trống.")
                .Equal(x => x.NewPassword).WithMessage("Mật khẩu xác nhận không khớp.");
        }
    }
}
