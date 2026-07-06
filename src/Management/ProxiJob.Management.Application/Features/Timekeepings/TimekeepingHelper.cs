using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ProxiJob.Management.Application.Common.Interfaces;

namespace ProxiJob.Management.Application.Features.Timekeepings;

public static class TimekeepingHelper
{
    public static async Task AutoCheckoutStaleRecordsAsync(IManagementDbContext context, CancellationToken cancellationToken = default)
    {
        var nowLocal = DateTime.UtcNow.AddHours(7);
        var staleTimekeepings = await context.Timekeepings
            .Include(t => t.WorkSchedule)
            .Where(t => t.CheckOutTime == null && t.CheckInTime != null && t.WorkSchedule.EndTime < nowLocal.AddMinutes(-15))
            .ToListAsync(cancellationToken);

        if (staleTimekeepings.Any())
        {
            foreach (var t in staleTimekeepings)
            {
                t.CheckOutTime = t.WorkSchedule.EndTime.AddHours(-7); // Cap to EndTime in UTC
                t.Note = "Quên checkout (Hệ thống tự động checkout đúng giờ ca)";
                t.UpdatedBy = "System (Auto-Checkout)";
                t.UpdatedAt = DateTime.UtcNow;
            }
            context.Timekeepings.UpdateRange(staleTimekeepings);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
