using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProxiJob.Job.Application.Common.Interfaces;
using ProxiJob.Job.Domain.Models;

namespace ProxiJob.Job.API.Controllers
{
    [ApiController]
    [Route("api/admin/jobs")]
    public class AdminJobsController : ControllerBase
    {
        private readonly IJobDbContext _context;

        public AdminJobsController(IJobDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        {
            var jobs = await _context.JobPosts
                .Include(j => j.Category)
                .Include(j => j.Location)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    Id = j.Id,
                    Title = j.Title,
                    Description = j.Description,
                    Requirements = j.Requirements,
                    Status = j.Status,
                    CreatedAt = j.CreatedAt,
                    BusinessId = j.BusinessId,
                    CategoryId = j.CategoryId,
                    CategoryName = j.Category != null ? j.Category.Name : "Chưa phân loại",
                    Address = j.Location != null ? j.Location.Address : "",
                    Latitude = j.Location != null ? j.Location.Latitude : 0,
                    Longitude = j.Location != null ? j.Location.Longitude : 0
                })
                .ToListAsync(cancellationToken);

            return Ok(jobs);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAdminJobDto dto, CancellationToken cancellationToken)
        {
            var category = await _context.JobCategories.FindAsync(new object[] { dto.CategoryId }, cancellationToken);
            if (category == null) return BadRequest(new { message = "Danh mục không hợp lệ." });

            var job = new JobPost
            {
                BusinessId = dto.BusinessId > 0 ? dto.BusinessId : 5, // Default to DN Test ProxiJob (5)
                CategoryId = dto.CategoryId,
                Title = dto.Title,
                Description = dto.Description,
                Requirements = dto.Requirements,
                Status = dto.Status ?? "Draft",
                CreatedBy = "Admin",
                CreatedAt = DateTime.UtcNow,
                Location = new JobLocation
                {
                    Address = dto.Address ?? "TP.HCM",
                    Latitude = 10.762622,
                    Longitude = 106.660172,
                    CreatedBy = "Admin",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _context.JobPosts.Add(job);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Tạo việc làm thành công.", id = job.Id });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAdminJobDto dto, CancellationToken cancellationToken)
        {
            var job = await _context.JobPosts
                .Include(j => j.Location)
                .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
            if (job == null) return NotFound();

            var category = await _context.JobCategories.FindAsync(new object[] { dto.CategoryId }, cancellationToken);
            if (category == null) return BadRequest(new { message = "Danh mục không hợp lệ." });

            job.CategoryId = dto.CategoryId;
            job.Title = dto.Title;
            job.Description = dto.Description;
            job.Requirements = dto.Requirements;
            job.Status = dto.Status ?? job.Status;
            job.UpdatedAt = DateTime.UtcNow;
            job.UpdatedBy = "Admin";

            if (job.Location != null)
            {
                job.Location.Address = dto.Address ?? job.Location.Address;
                job.Location.UpdatedAt = DateTime.UtcNow;
                job.Location.UpdatedBy = "Admin";
            }
            else
            {
                job.Location = new JobLocation
                {
                    Address = dto.Address ?? "TP.HCM",
                    Latitude = 10.762622,
                    Longitude = 106.660172,
                    CreatedBy = "Admin",
                    CreatedAt = DateTime.UtcNow
                };
            }

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Cập nhật việc làm thành công." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var job = await _context.JobPosts
                .Include(j => j.Location)
                .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
            if (job == null) return NotFound();

            job.IsDeleted = true;
            job.UpdatedAt = DateTime.UtcNow;
            job.UpdatedBy = "Admin";

            if (job.Location != null)
            {
                job.Location.IsDeleted = true;
                job.Location.UpdatedAt = DateTime.UtcNow;
                job.Location.UpdatedBy = "Admin";
            }

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Xóa việc làm thành công." });
        }

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> ToggleStatus(int id, [FromBody] ToggleJobStatusDto dto, CancellationToken cancellationToken)
        {
            var job = await _context.JobPosts.FindAsync(new object[] { id }, cancellationToken);
            if (job == null) return NotFound();

            job.Status = dto.Status;
            job.UpdatedAt = DateTime.UtcNow;
            job.UpdatedBy = "Admin";

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }
    }

    public class CreateAdminJobDto
    {
        public int BusinessId { get; set; }
        public int CategoryId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Requirements { get; set; }
        public string? Status { get; set; }
        public string? Address { get; set; }
    }

    public class UpdateAdminJobDto
    {
        public int CategoryId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Requirements { get; set; }
        public string? Status { get; set; }
        public string? Address { get; set; }
    }

    public class ToggleJobStatusDto
    {
        public string Status { get; set; }
    }
}
