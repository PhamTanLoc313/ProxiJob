using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.DTOs;
using ProxiJob.Identity.Domain.Constants;
using ProxiJob.Identity.Domain.Models;

namespace ProxiJob.Identity.Application.Services
{
    public interface IStudentApplyQuotaService
    {
        Task<StudentApplyQuotaDto> GetQuotaAsync(int userId, CancellationToken cancellationToken = default);
        Task<StudentApplyQuotaDto> ConsumeOneApplyAsync(int userId, CancellationToken cancellationToken = default);
    }

    public class StudentApplyQuotaService : IStudentApplyQuotaService
    {
        private readonly IStudentProfileRepository _studentProfileRepository;
        private readonly IUnitOfWork _unitOfWork;

        public StudentApplyQuotaService(IStudentProfileRepository studentProfileRepository, IUnitOfWork unitOfWork)
        {
            _studentProfileRepository = studentProfileRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<StudentApplyQuotaDto> GetQuotaAsync(int userId, CancellationToken cancellationToken = default)
        {
            var profile = await _studentProfileRepository.GetByUserIdAsync(userId, cancellationToken);

            if (profile == null)
                throw new InvalidOperationException("Không tìm thấy hồ sơ sinh viên.");

            int limit = profile.AppliesLimit;
            int used = profile.AppliesUsed;
            int remaining = Math.Max(0, limit - used);

            return new StudentApplyQuotaDto
            {
                AppliesLimit = limit,
                AppliesUsed = used,
                AppliesRemaining = remaining,
                CanApply = used < limit
            };
        }

        public async Task<StudentApplyQuotaDto> ConsumeOneApplyAsync(int userId, CancellationToken cancellationToken = default)
        {
            var profile = await _studentProfileRepository.GetByUserIdAsync(userId, cancellationToken);

            if (profile == null)
                throw new InvalidOperationException("Không tìm thấy hồ sơ sinh viên.");

            int limit = profile.AppliesLimit;
            int used = profile.AppliesUsed;

            if (used >= limit)
                throw new InvalidOperationException("Bạn đã dùng hết lượt ứng tuyển. Vui lòng mua thêm gói ứng tuyển.");

            profile.AppliesUsed = used + 1;
            profile.UpdatedAt = DateTime.UtcNow;
            profile.UpdatedBy = "System";

            await _studentProfileRepository.UpdateAsync(profile, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new StudentApplyQuotaDto
            {
                AppliesLimit = limit,
                AppliesUsed = profile.AppliesUsed,
                AppliesRemaining = Math.Max(0, limit - profile.AppliesUsed),
                CanApply = profile.AppliesUsed < limit
            };
        }
    }
}
