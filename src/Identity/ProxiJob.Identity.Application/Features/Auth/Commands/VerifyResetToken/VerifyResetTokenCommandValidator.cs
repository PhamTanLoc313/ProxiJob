using FluentValidation;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.VerifyResetToken
{
    public class VerifyResetTokenCommandValidator : AbstractValidator<VerifyResetTokenCommand>
    {
        public VerifyResetTokenCommandValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email không được để trống.")
                .EmailAddress().WithMessage("Định dạng email không hợp lệ.");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã xác minh không được để trống.")
                .Length(6).WithMessage("Mã xác minh phải gồm đúng 6 chữ số.");
        }
    }
}
