using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Identity.Application.Features.Auth.Commands.Login;
using ProxiJob.Identity.Application.Features.Auth.Commands.Logout;
using ProxiJob.Identity.Application.Features.Auth.Commands.RefreshToken;
using ProxiJob.Identity.Application.Features.Auth.Commands.Register;
using ProxiJob.Identity.Application.Features.Auth.Commands.ForgotPassword;
using ProxiJob.Identity.Application.Features.Auth.Commands.ResetPassword;
using ProxiJob.Identity.Application.Features.Auth.Commands.GoogleLogin;
using ProxiJob.Identity.Application.Features.Auth.Commands.VerifyResetToken;
using ProxiJob.Identity.Domain.Constants;
using ProxiJob.Shared.Contract;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ProxiJob.Identity.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator) => _mediator = mediator;

        /// <summary>Đăng ký — UserType: 0 = Student, 1 = Business</summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (ValidationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, errors: ex.Errors.Select(e => e.ErrorMessage)));
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ApiResponse.Fail(StatusCodes.Status409Conflict, ex.Message));
            }
        }

        /// <summary>Đăng nhập</summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (ValidationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, errors: ex.Errors.Select(e => e.ErrorMessage)));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
        }

        /// <summary>Làm mới AccessToken bằng RefreshToken</summary>
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (ValidationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, errors: ex.Errors.Select(e => e.ErrorMessage)));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
        }

        /// <summary>Đăng xuất — revoke RefreshToken</summary>
        [HttpPost("logout")]
        [AllowAnonymous]
        public async Task<IActionResult> Logout([FromBody] LogoutCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            return result
                ? Ok(ApiResponse.Success(StatusCodes.Status200OK, BusinessMessages.LogoutSuccess))
                : BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, BusinessMessages.LogoutFailed));
        }

        /// <summary>Yêu cầu đặt lại mật khẩu</summary>
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (ValidationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, errors: ex.Errors.Select(e => e.ErrorMessage)));
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(ApiResponse.Fail(StatusCodes.Status404NotFound, ex.Message));
            }
        }

        /// <summary>Xác thực mã OTP khôi phục mật khẩu</summary>
        [HttpPost("verify-reset-token")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyResetToken([FromBody] VerifyResetTokenCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (ValidationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, errors: ex.Errors.Select(e => e.ErrorMessage)));
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(ApiResponse.Fail(StatusCodes.Status404NotFound, ex.Message));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, ex.Message));
            }
        }

        /// <summary>Đặt lại mật khẩu mới với mã OTP</summary>
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (ValidationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, errors: ex.Errors.Select(e => e.ErrorMessage)));
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(ApiResponse.Fail(StatusCodes.Status404NotFound, ex.Message));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, ex.Message));
            }
        }

        /// <summary>Đăng nhập bằng Google ID Token</summary>
        [HttpPost("google")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (ValidationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, errors: ex.Errors.Select(e => e.ErrorMessage)));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
        }

        /// <summary>
        /// Google OAuth callback endpoint.
        /// Google redirects here after user authenticates. Since the id_token arrives in the
        /// URL fragment (#), we serve a small HTML page that reads the fragment client-side
        /// and redirects to the mobile app's custom scheme (proxijob://).
        /// This removes the dependency on Expo auth proxy (auth.expo.io).
        /// </summary>
        [HttpGet("google-callback")]
        [AllowAnonymous]
        public IActionResult GoogleCallback()
        {
            var html = @"<!DOCTYPE html>
<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>ProxiJob - Đang chuyển hướng...</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#334155}
.container{text-align:center;padding:2rem}
.spinner{width:40px;height:40px;border:4px solid #e2e8f0;border-top:4px solid #3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>
<div class='container'>
<div class='spinner'></div>
<p>Đang chuyển hướng về ProxiJob...</p>
<p id='error' style='color:#ef4444;display:none'></p>
</div>
<script>
(function(){
  try {
    var hash = window.location.hash.substring(1);
    var params = new URLSearchParams(hash);
    var idToken = params.get('id_token');
    var accessToken = params.get('access_token');
    var token = idToken || accessToken;
    if (token) {
      window.location.href = 'proxijob://google-callback?id_token=' + encodeURIComponent(token);
      setTimeout(function(){
        document.getElementById('error').style.display='block';
        document.getElementById('error').textContent='Nếu không tự chuyển, vui lòng mở lại ứng dụng ProxiJob.';
      }, 3000);
    } else {
      // Check query params as fallback (authorization code flow)
      var qp = new URLSearchParams(window.location.search);
      var error = qp.get('error');
      if (error) {
        document.getElementById('error').style.display='block';
        document.getElementById('error').textContent='Đăng nhập thất bại: ' + (qp.get('error_description') || error);
      } else {
        document.getElementById('error').style.display='block';
        document.getElementById('error').textContent='Không nhận được token từ Google. Vui lòng thử lại.';
      }
    }
  } catch(e) {
    document.getElementById('error').style.display='block';
    document.getElementById('error').textContent='Lỗi: ' + e.message;
  }
})();
</script></body></html>";
            return Content(html, "text/html");
        }

        /// <summary>Seed test accounts dynamically for plan and logic testing</summary>
        [HttpGet("seed-test-accounts")]
        [AllowAnonymous]
        public async Task<IActionResult> SeedTestAccounts(CancellationToken cancellationToken)
        {
            var dbContext = HttpContext.RequestServices.GetRequiredService<ProxiJob.Identity.Infrastructure.Data.IdentityDbContext>();
            var passwordHasher = HttpContext.RequestServices.GetRequiredService<ProxiJob.Identity.Application.Common.Interfaces.IPasswordHasher>();
            var subscriptionRepo = HttpContext.RequestServices.GetRequiredService<ProxiJob.Identity.Application.Common.Interfaces.ISubscriptionRepository>();

            var businessRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == ProxiJob.Identity.Domain.Constants.RoleNames.Business, cancellationToken);
            if (businessRole == null)
            {
                return BadRequest("Không tìm thấy Role Business.");
            }

            var testAccounts = new[]
            {
                new { Email = "business_trial@proxijob.test", Name = "Chủ Quán Trial", PlanName = "Trial" },
                new { Email = "business_recruit@proxijob.test", Name = "Chủ Quán Recruit", PlanName = ProxiJob.Identity.Domain.Constants.SubscriptionNames.Recruit },
                new { Email = "business_hrm@proxijob.test", Name = "Chủ Quán HRM Basic", PlanName = ProxiJob.Identity.Domain.Constants.SubscriptionNames.HrmBasic }
            };

            var hashedPwd = passwordHasher.Hash("12345678");

            foreach (var account in testAccounts)
            {
                // Delete if exists to refresh state
                var existingUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == account.Email, cancellationToken);
                if (existingUser != null)
                {
                    var profiles = dbContext.BusinessProfiles.Where(bp => bp.UserId == existingUser.Id);
                    dbContext.BusinessProfiles.RemoveRange(profiles);
                    var userSubscriptions = dbContext.UserSubscriptions.Where(us => us.UserId == existingUser.Id);
                    dbContext.UserSubscriptions.RemoveRange(userSubscriptions);
                    var userRoles = dbContext.UserRoles.Where(ur => ur.UserId == existingUser.Id);
                    dbContext.UserRoles.RemoveRange(userRoles);

                    dbContext.Users.Remove(existingUser);
                    await dbContext.SaveChangesAsync(cancellationToken);
                }

                // Create user
                var user = new ProxiJob.Identity.Domain.Models.User
                {
                    Username = account.Email,
                    Email = account.Email,
                    PasswordHash = hashedPwd,
                    FullName = account.Name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "SystemSeed"
                };

                await dbContext.Users.AddAsync(user, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);

                // Assign Business Role
                await dbContext.UserRoles.AddAsync(new ProxiJob.Identity.Domain.Models.UserRole
                {
                    UserId = user.Id,
                    RoleId = businessRole.Id
                }, cancellationToken);

                // Create Business Profile
                await dbContext.BusinessProfiles.AddAsync(new ProxiJob.Identity.Domain.Models.BusinessProfile
                {
                    UserId = user.Id,
                    BusinessName = account.Name,
                    Address = "123 Đường Test, Quận 1, TP. HCM",
                    ReputationScore = 5.0m,
                    ReviewCount = 0,
                    ReadinessStatus = ProxiJob.Identity.Domain.Constants.ProfileReadinessStatus.ProfileComplete,
                    CreatedBy = "SystemSeed",
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);

                await dbContext.SaveChangesAsync(cancellationToken);

                // Assign Subscription (except Trial which defaults to trial)
                if (account.PlanName != "Trial")
                {
                    await subscriptionRepo.AssignSubscriptionAsync(user.Id, account.PlanName, "SystemSeed", cancellationToken);
                }
            }

            return Ok(new { message = "Seeded test accounts successfully!" });
        }
    }
}
