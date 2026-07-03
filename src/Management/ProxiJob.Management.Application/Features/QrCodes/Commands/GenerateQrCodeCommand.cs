using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProxiJob.Management.Application.Common.Interfaces;
using ProxiJob.Management.Domain.Models;

namespace ProxiJob.Management.Application.Features.QrCodes.Commands;

public class GenerateQrCodeCommand : IRequest<string>
{
    public int BusinessId { get; set; }
    public string CreatedBy { get; set; } = "System";
}

public class GenerateQrCodeCommandHandler : IRequestHandler<GenerateQrCodeCommand, string>
{
    private readonly IManagementDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GenerateQrCodeCommandHandler(IManagementDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(GenerateQrCodeCommand request, CancellationToken cancellationToken)
    {
        var existingQr = await _context.BusinessQrCodes
            .FirstOrDefaultAsync(q => q.BusinessId == request.BusinessId, cancellationToken);

        bool willIncreaseActiveCount = existingQr == null || !existingQr.IsActive;
        if (willIncreaseActiveCount)
        {
            var maxActiveQrs = _currentUser.IdentityUser?.MaxActiveQrs ?? 0;
            var activeCount = await _context.BusinessQrCodes
                .CountAsync(q => q.BusinessId == request.BusinessId && q.IsActive, cancellationToken);

            if (activeCount >= maxActiveQrs)
            {
                throw new UnauthorizedAccessException("Số lượng mã QR Code chấm công đang hoạt động đã đạt giới hạn tối đa cho gói cước hiện tại. Vui lòng nâng cấp gói cước!");
            }
        }

        var newQrToken = Guid.NewGuid().ToString();

        if (existingQr != null)
        {
            existingQr.QrToken = newQrToken;
            existingQr.IsActive = true;
            existingQr.UpdatedBy = request.CreatedBy;
            existingQr.UpdatedAt = DateTime.UtcNow;
            _context.BusinessQrCodes.Update(existingQr);
        }
        else
        {
            var newQr = new BusinessQrCode
            {
                BusinessId = request.BusinessId,
                QrToken = newQrToken,
                AllowedRadiusMeters = 100, // default
                IsActive = true,
                CreatedBy = request.CreatedBy,
                CreatedAt = DateTime.UtcNow
            };
            _context.BusinessQrCodes.Add(newQr);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return newQrToken;
    }
}
