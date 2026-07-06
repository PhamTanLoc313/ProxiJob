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
