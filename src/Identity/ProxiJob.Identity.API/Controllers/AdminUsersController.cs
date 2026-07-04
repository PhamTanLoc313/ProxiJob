using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProxiJob.Identity.Application.Common.Exceptions;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Identity.Domain.Constants;
using ProxiJob.Identity.Domain.Models;
using ProxiJob.Identity.Infrastructure.Data;

namespace ProxiJob.Identity.API.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize]
    public class AdminUsersController : ControllerBase
    {
        private readonly IdentityDbContext _context;
        private readonly ICurrentUserService _currentUser;
        private readonly IPasswordHasher _passwordHasher;

        public AdminUsersController(
            IdentityDbContext context,
            ICurrentUserService currentUser,
            IPasswordHasher passwordHasher)
        {
            _context = context;
            _currentUser = currentUser;
            _passwordHasher = passwordHasher;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        {
            await EnsureAdminAsync(cancellationToken);
            
            var users = await _context.Users
                .Join(_context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { u, ur })
                .Join(_context.Roles, combined => combined.ur.RoleId, r => r.Id, (combined, r) => new
                {
                    Id = combined.u.Id,
                    Username = combined.u.Username,
                    Email = combined.u.Email,
                    FullName = combined.u.FullName,
                    PhoneNumber = combined.u.PhoneNumber,
                    IsActive = combined.u.IsActive,
                    CreatedAt = combined.u.CreatedAt,
                    Role = r.Name
                })
                .ToListAsync(cancellationToken);

            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto, CancellationToken cancellationToken)
        {
            await EnsureAdminAsync(cancellationToken);

            var existing = await _context.Users.AnyAsync(x => x.Email.ToLower() == dto.Email.ToLower(), cancellationToken);
            if (existing) return BadRequest(new { message = "Email đã tồn tại." });

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == dto.Role, cancellationToken);
            if (role == null) return BadRequest(new { message = "Vai trò không hợp lệ." });

            var user = new User
            {
                Username = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                IsActive = true,
                PasswordHash = _passwordHasher.Hash(dto.Password ?? "Password1!"),
                CreatedBy = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(cancellationToken);

            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id,
                CreatedBy = "Admin",
                CreatedAt = DateTime.UtcNow
            };
            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Tạo người dùng thành công." });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto, CancellationToken cancellationToken)
        {
            await EnsureAdminAsync(cancellationToken);

            var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
            if (user == null) return NotFound();

            var existingEmail = await _context.Users.AnyAsync(x => x.Email.ToLower() == dto.Email.ToLower() && x.Id != id, cancellationToken);
            if (existingEmail) return BadRequest(new { message = "Email đã được sử dụng bởi người dùng khác." });

            user.Email = dto.Email;
            user.FullName = dto.FullName;
            user.PhoneNumber = dto.PhoneNumber;
            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = "Admin";

            var userRole = await _context.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == id, cancellationToken);
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == dto.Role, cancellationToken);
            if (role != null)
            {
                if (userRole == null)
                {
                    userRole = new UserRole 
                    { 
                        UserId = id, 
                        RoleId = role.Id, 
                        CreatedBy = "Admin",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.UserRoles.Add(userRole);
                }
                else
                {
                    userRole.RoleId = role.Id;
                    userRole.UpdatedAt = DateTime.UtcNow;
                    userRole.UpdatedBy = "Admin";
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Cập nhật người dùng thành công." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            await EnsureAdminAsync(cancellationToken);

            var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
            if (user == null) return NotFound();

            user.IsDeleted = true;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = "Admin";

            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Xóa người dùng thành công." });
        }

        private async Task EnsureAdminAsync(CancellationToken cancellationToken)
        {
            if (_currentUser.UserId is not int userId)
                throw new UnauthorizedAccessException(BusinessMessages.NotAuthenticated);

            if (_currentUser.Role != RoleNames.Admin)
                throw new ForbiddenAccessException(BusinessMessages.AdminOnly);

            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken)
                ?? throw new UnauthorizedAccessException(BusinessMessages.UserNotFound);
        }
    }

    public class CreateUserDto
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string Role { get; set; }
        public string? Password { get; set; }
    }

    public class UpdateUserDto
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string Role { get; set; }
        public bool IsActive { get; set; }
    }
}
