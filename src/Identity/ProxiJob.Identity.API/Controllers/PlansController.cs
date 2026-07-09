using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProxiJob.Identity.Application.Common.Exceptions;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Identity.Application.Features.Subscriptions.Commands.Subscribe;
using ProxiJob.Identity.Application.Features.Subscriptions.Queries.GetMyFeatures;
using ProxiJob.Identity.Application.Features.Subscriptions.Queries.GetPlanComparison;
using ProxiJob.Identity.Application.Services;
using ProxiJob.Identity.Domain.Constants;
using ProxiJob.Shared.Contract;

namespace ProxiJob.Identity.API.Controllers
{
    [ApiController]
    [Route("api/plans")]
    public class PlansController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ICurrentUserService _currentUser;
        private readonly IRoleRepository _roleRepository;
        private readonly IJobPostQuotaService _jobPostQuotaService;
        private readonly IStudentApplyQuotaService _studentApplyQuotaService;

        public PlansController(
            IMediator mediator,
            ICurrentUserService currentUser,
            IRoleRepository roleRepository,
            IJobPostQuotaService jobPostQuotaService,
            IStudentApplyQuotaService studentApplyQuotaService)
        {
            _mediator = mediator;
            _currentUser = currentUser;
            _roleRepository = roleRepository;
            _jobPostQuotaService = jobPostQuotaService;
            _studentApplyQuotaService = studentApplyQuotaService;
        }

        /// <summary>Danh sách gói dịch vụ B2B (public)</summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPlans(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetPlanComparisonQuery(), cancellationToken);
            return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
        }

        /// <summary>Gói đang sử dụng (cần đăng nhập)</summary>
        [HttpGet("current")]
        [Authorize]
        public async Task<IActionResult> GetCurrentPlan(CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new GetMyFeaturesQuery(), cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
        }

        /// <summary>Tạo đơn chuyển khoản — body: { "planId": 3 }</summary>
        [HttpPost("purchase")]
        [Authorize]
        public async Task<IActionResult> PurchasePlan([FromBody] SubscribeCommand command, CancellationToken cancellationToken)
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
            catch (ForbiddenAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail(StatusCodes.Status403Forbidden, ex.Message));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, ex.Message));
            }
        }

        /// <summary>Hạn mức đăng tin chủ quán (trước khi tạo bài).</summary>
        [HttpGet("job-posts/quota")]
        [Authorize]
        public async Task<IActionResult> GetJobPostQuota(CancellationToken cancellationToken)
        {
            try
            {
                var result = await GetJobPostQuotaForCurrentUserAsync(cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, ex.Message));
            }
        }

        /// <summary>Trừ 1 lượt đăng tin (Job service gọi sau khi tạo bài thành công).</summary>
        [HttpPost("job-posts/consume")]
        [Authorize]
        public async Task<IActionResult> ConsumeJobPost(CancellationToken cancellationToken)
        {
            try
            {
                if (_currentUser.UserId is not int userId)
                    return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, BusinessMessages.NotAuthenticated));

                await EnsureBusinessAsync(userId, cancellationToken);
                var result = await _jobPostQuotaService.ConsumeOnePostAsync(userId, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, ex.Message));
            }
        }

        /// <summary>Lấy hạn mức ứng tuyển của sinh viên hiện tại.</summary>
        [HttpGet("student/quota")]
        [Authorize]
        public async Task<IActionResult> GetStudentApplyQuota(CancellationToken cancellationToken)
        {
            try
            {
                if (_currentUser.UserId is not int userId)
                    return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, BusinessMessages.NotAuthenticated));

                await EnsureStudentAsync(userId, cancellationToken);
                var result = await _studentApplyQuotaService.GetQuotaAsync(userId, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, ex.Message));
            }
        }

        /// <summary>Trừ 1 lượt ứng tuyển của sinh viên hiện tại.</summary>
        [HttpPost("student/consume")]
        [Authorize]
        public async Task<IActionResult> ConsumeStudentApply(CancellationToken cancellationToken)
        {
            try
            {
                if (_currentUser.UserId is not int userId)
                    return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, BusinessMessages.NotAuthenticated));

                await EnsureStudentAsync(userId, cancellationToken);
                var result = await _studentApplyQuotaService.ConsumeOneApplyAsync(userId, cancellationToken);
                return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, ex.Message));
            }
        }

        private async Task<object> GetJobPostQuotaForCurrentUserAsync(CancellationToken cancellationToken)
        {
            if (_currentUser.UserId is not int userId)
                throw new UnauthorizedAccessException(BusinessMessages.NotAuthenticated);

            var role = await EnsureBusinessAsync(userId, cancellationToken);
            return await _jobPostQuotaService.GetQuotaAsync(userId, role, cancellationToken);
        }

        private async Task<string> EnsureBusinessAsync(int userId, CancellationToken cancellationToken)
        {
            var role = await _roleRepository.GetUserRoleNameAsync(userId, cancellationToken) ?? RoleNames.Student;
            if (role != RoleNames.Business)
                throw new UnauthorizedAccessException(BusinessMessages.BusinessJobPostOnly);

            return role;
        }

        private async Task<string> EnsureStudentAsync(int userId, CancellationToken cancellationToken)
        {
            var role = await _roleRepository.GetUserRoleNameAsync(userId, cancellationToken) ?? RoleNames.Student;
            if (role != RoleNames.Student)
                throw new UnauthorizedAccessException("Chỉ tài khoản sinh viên mới được sử dụng tính năng này.");

            return role;
        }
    }
}
