using FluentValidation;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.GoogleLogin
{
    public class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
    {
        public GoogleLoginCommandValidator()
        {
            RuleFor(x => x.IdToken)
                .NotEmpty().WithMessage("Google ID Token không được để trống.");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Vai trò chọn không được để trống.")
                .Must(r => r == "student" || r == "employer" || r == "business")
                .WithMessage("Vai trò không hợp lệ.");
        }
    }
}
