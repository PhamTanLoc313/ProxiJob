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
        /// Server-side Google OAuth: Step 1 - Redirect user to Google login page.
        /// Mobile app opens this URL in a browser. Backend handles everything.
        /// </summary>
        [HttpGet("google-login")]
        [AllowAnonymous]
        public IActionResult GoogleLoginRedirect([FromQuery] string role = "student")
        {
            var clientId = "761339432164-gth4e77gocarke99gj3vk38ti5bkcull.apps.googleusercontent.com";
            // Build the callback URL dynamically based on the incoming request
            var scheme = Request.Scheme;
            var host = Request.Host;
            // In production behind reverse proxy, use X-Forwarded headers
            if (Request.Headers.ContainsKey("X-Forwarded-Proto"))
                scheme = Request.Headers["X-Forwarded-Proto"].ToString();
            if (Request.Headers.ContainsKey("X-Forwarded-Host"))
                host = new HostString(Request.Headers["X-Forwarded-Host"].ToString());

            var callbackUrl = $"{scheme}://{host}/api/auth/google-callback";
            
            var state = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(role));
            var nonce = Guid.NewGuid().ToString("N");

            var googleUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
                $"client_id={clientId}" +
                $"&redirect_uri={Uri.EscapeDataString(callbackUrl)}" +
                $"&response_type=code" +
                $"&scope=openid%20profile%20email" +
                $"&state={state}" +
                $"&nonce={nonce}" +
                $"&access_type=offline" +
                $"&prompt=select_account";

            return Redirect(googleUrl);
        }

        /// <summary>
        /// Server-side Google OAuth: Step 2 - Handle callback from Google.
        /// Exchanges authorization code for tokens, creates/finds user, issues JWT,
        /// then redirects to mobile app via custom scheme with JWT in URL.
        /// </summary>
        [HttpGet("google-callback")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleCallback(
            [FromQuery] string? code, 
            [FromQuery] string? error,
            [FromQuery] string? state,
            CancellationToken cancellationToken)
        {
            // Handle Google errors
            if (!string.IsNullOrEmpty(error))
            {
                return Content(BuildErrorHtml($"Google đăng nhập thất bại: {error}"), "text/html");
            }

            if (string.IsNullOrEmpty(code))
            {
                return Content(BuildErrorHtml("Không nhận được mã xác thực từ Google."), "text/html");
            }

            try
            {
                // Decode role from state
                var role = "student";
                if (!string.IsNullOrEmpty(state))
                {
                    try { role = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(state)); }
                    catch { /* fallback to student */ }
                }

                // Build callback URL (same as in google-login)
                var scheme = Request.Scheme;
                var host = Request.Host;
                if (Request.Headers.ContainsKey("X-Forwarded-Proto"))
                    scheme = Request.Headers["X-Forwarded-Proto"].ToString();
                if (Request.Headers.ContainsKey("X-Forwarded-Host"))
                    host = new HostString(Request.Headers["X-Forwarded-Host"].ToString());
                var callbackUrl = $"{scheme}://{host}/api/auth/google-callback";

                var clientId = "761339432164-gth4e77gocarke99gj3vk38ti5bkcull.apps.googleusercontent.com";
                var clientSecret = "GOCSPX-HP9Q_placeholder"; // Will be loaded from config

                // Try to load client secret from configuration
                var config = HttpContext.RequestServices.GetService<IConfiguration>();
                clientSecret = config?["GoogleAuth:ClientSecret"] ?? clientSecret;

                // Exchange authorization code for tokens
                using var httpClient = new HttpClient();
                var tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["code"] = code,
                    ["client_id"] = clientId,
                    ["client_secret"] = clientSecret,
                    ["redirect_uri"] = callbackUrl,
                    ["grant_type"] = "authorization_code"
                });

                var tokenResponse = await httpClient.PostAsync(
                    "https://oauth2.googleapis.com/token", tokenRequest, cancellationToken);
                var tokenContent = await tokenResponse.Content.ReadAsStringAsync(cancellationToken);

                if (!tokenResponse.IsSuccessStatusCode)
                {
                    return Content(BuildErrorHtml($"Không thể đổi mã xác thực: {tokenContent}"), "text/html");
                }

                using var tokenDoc = System.Text.Json.JsonDocument.Parse(tokenContent);
                var idToken = tokenDoc.RootElement.TryGetProperty("id_token", out var idTokenProp) 
                    ? idTokenProp.GetString() : null;

                if (string.IsNullOrEmpty(idToken))
                {
                    return Content(BuildErrorHtml("Không nhận được ID Token từ Google."), "text/html");
                }

                // Use existing GoogleLogin handler to process the token
                var command = new GoogleLoginCommand(idToken, role);
                var result = await _mediator.Send(command, cancellationToken);

                // Build the redirect URL to mobile app with JWT tokens
                var accessToken = Uri.EscapeDataString(result.AccessToken);
                var refreshToken = Uri.EscapeDataString(result.RefreshToken);
                var appRedirectUrl = $"proxijob://auth-callback?token={accessToken}&refreshToken={refreshToken}";

                // Return minimal HTML that redirects instantly (no visible UI)
                var html = $@"<!DOCTYPE html>
<html><head><meta charset='utf-8'>
<title>ProxiJob</title>
</head><body>
<script>
if (window.opener) {{
    window.opener.postMessage({{
        type: 'proxijob-google-auth',
        token: '{accessToken}',
        refreshToken: '{refreshToken}'
    }}, '*');
    window.close();
}} else {{
    window.location.replace('{appRedirectUrl}');
}}
</script>
<noscript><a href='{appRedirectUrl}'>Nhấn vào đây</a></noscript>
</body></html>";

                return Content(html, "text/html");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Content(BuildErrorHtml($"Xác thực thất bại: {ex.Message}"), "text/html");
            }
            catch (Exception ex)
            {
                return Content(BuildErrorHtml($"Lỗi hệ thống: {ex.Message}"), "text/html");
            }
        }

        private static string BuildErrorHtml(string message)
        {
            var encodedMessage = Uri.EscapeDataString(message);
            var redirectUrl = $"proxijob://auth-error?message={encodedMessage}";
            return $@"<!DOCTYPE html>
<html><head><meta charset='utf-8'>
<title>ProxiJob</title>
</head><body>
<script>
if (window.opener) {{
    window.opener.postMessage({{
        type: 'proxijob-google-auth-error',
        message: '{encodedMessage}'
    }}, '*');
    window.close();
}} else {{
    window.location.replace('{redirectUrl}');
}}
</script>
<noscript><a href='{redirectUrl}'>Quay về ứng dụng</a></noscript>
</body></html>";
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
