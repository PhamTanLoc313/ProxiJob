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
using ProxiJob.Identity.Infrastructure.Data;
using ProxiJob.Identity.Domain.Models;
using Microsoft.EntityFrameworkCore;
using ProxiJob.Identity.Domain.Enums;

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
        private readonly IdentityDbContext _context;

        public PlansController(
            IMediator mediator,
            ICurrentUserService currentUser,
            IRoleRepository roleRepository,
            IJobPostQuotaService jobPostQuotaService,
            IStudentApplyQuotaService studentApplyQuotaService,
            IdentityDbContext context)
        {
            _mediator = mediator;
            _currentUser = currentUser;
            _roleRepository = roleRepository;
            _jobPostQuotaService = jobPostQuotaService;
            _studentApplyQuotaService = studentApplyQuotaService;
            _context = context;
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

        /// <summary>Admin lấy danh sách tất cả các gói dịch vụ và đếm số user đang dùng</summary>
        [HttpGet("admin")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<IActionResult> GetPlansAdmin(CancellationToken cancellationToken)
        {
            var activeUserCounts = await _context.UserSubscriptions
                .Where(us => us.Status == "Active" && us.EndDate >= DateTime.UtcNow)
                .GroupBy(us => us.SubscriptionId)
                .Select(g => new { SubscriptionId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.SubscriptionId, x => x.Count, cancellationToken);

            var subscriptions = await _context.Subscriptions
                .OrderBy(s => s.Price)
                .ToListAsync(cancellationToken);

            var result = subscriptions.Select(s => new
            {
                s.Id,
                s.Name,
                s.Description,
                Price = (double)s.Price,
                VariableCost = (double)s.VariableCost,
                GrossMargin = (double)s.GrossMargin,
                BillingType = s.BillingType.ToString(),
                s.JobPostLimit,
                s.DurationDays,
                s.HasPriorityDisplay,
                s.HasHrManagement,
                s.MaxEmployees,
                s.MaxActiveQrs,
                s.MaxSearchRadius,
                ActiveUsers = activeUserCounts.TryGetValue(s.Id, out var count) ? count : 0
            }).ToList();

            return Ok(ApiResponse<object>.Success(result, StatusCodes.Status200OK));
        }

        public class CreatePlanDto
        {
            public string Name { get; set; }
            public string Description { get; set; }
            public decimal Price { get; set; }
            public decimal VariableCost { get; set; }
            public string BillingType { get; set; } // PerShift or Monthly
            public int JobPostLimit { get; set; }
            public int DurationDays { get; set; }
            public bool HasPriorityDisplay { get; set; }
            public bool HasHrManagement { get; set; }
            public int MaxEmployees { get; set; }
            public int MaxActiveQrs { get; set; }
            public int MaxSearchRadius { get; set; }
        }

        /// <summary>Admin thêm gói dịch vụ mới</summary>
        [HttpPost]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<IActionResult> CreatePlan([FromBody] CreatePlanDto dto, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(dto.Name))
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, "Tên gói không được để trống."));

            var billingType = Enum.TryParse<BillingType>(dto.BillingType, out var bt) ? bt : BillingType.Monthly;

            var plan = new Subscription
            {
                Name = dto.Name,
                Description = dto.Description ?? "",
                Price = dto.Price,
                VariableCost = dto.VariableCost,
                GrossMargin = dto.Price - dto.VariableCost,
                BillingType = billingType,
                JobPostLimit = dto.JobPostLimit,
                DurationDays = dto.DurationDays,
                HasPriorityDisplay = dto.HasPriorityDisplay,
                HasHrManagement = dto.HasHrManagement,
                MaxEmployees = dto.MaxEmployees,
                MaxActiveQrs = dto.MaxActiveQrs,
                MaxSearchRadius = dto.MaxSearchRadius,
                CreatedBy = "Admin"
            };

            await _context.Subscriptions.AddAsync(plan, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(ApiResponse<object>.Success(plan, StatusCodes.Status200OK));
        }

        /// <summary>Admin sửa gói dịch vụ</summary>
        [HttpPut("{id}")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<IActionResult> UpdatePlan(int id, [FromBody] CreatePlanDto dto, CancellationToken cancellationToken)
        {
            var plan = await _context.Subscriptions.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
            if (plan == null)
                return NotFound(ApiResponse.Fail(StatusCodes.Status404NotFound, "Không tìm thấy gói dịch vụ."));

            if (string.IsNullOrEmpty(dto.Name))
                return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, "Tên gói không được để trống."));

            var billingType = Enum.TryParse<BillingType>(dto.BillingType, out var bt) ? bt : BillingType.Monthly;

            plan.Name = dto.Name;
            plan.Description = dto.Description ?? "";
            plan.Price = dto.Price;
            plan.VariableCost = dto.VariableCost;
            plan.GrossMargin = dto.Price - dto.VariableCost;
            plan.BillingType = billingType;
            plan.JobPostLimit = dto.JobPostLimit;
            plan.DurationDays = dto.DurationDays;
            plan.HasPriorityDisplay = dto.HasPriorityDisplay;
            plan.HasHrManagement = dto.HasHrManagement;
            plan.MaxEmployees = dto.MaxEmployees;
            plan.MaxActiveQrs = dto.MaxActiveQrs;
            plan.MaxSearchRadius = dto.MaxSearchRadius;
            plan.UpdatedAt = DateTime.UtcNow;
            plan.UpdatedBy = "Admin";

            _context.Subscriptions.Update(plan);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(ApiResponse<object>.Success(plan, StatusCodes.Status200OK));
        }

        /// <summary>Admin xóa gói dịch vụ</summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<IActionResult> DeletePlan(int id, CancellationToken cancellationToken)
        {
            var plan = await _context.Subscriptions.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
            if (plan == null)
                return NotFound(ApiResponse.Fail(StatusCodes.Status404NotFound, "Không tìm thấy gói dịch vụ."));

            _context.Subscriptions.Remove(plan);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(ApiResponse<object>.Success(true, StatusCodes.Status200OK));
        }
    }
}
