using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ProxiJob.Job.Infrastructure.Data
{
    public static class JobDatabaseInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider, ILogger logger)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<JobDbContext>();

            try
            {
                var pending = await context.Database.GetPendingMigrationsAsync();
                if (pending.Any())
                {
                    logger.LogInformation("Applying {Count} pending migration(s) for Job Service: {Migrations}",
                        pending.Count(), string.Join(", ", pending));
                    await context.Database.MigrateAsync();
                }
                else
                {
                    logger.LogInformation("No pending migrations for Job Service.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Job Database initialization failed. Run: dotnet ef database update --project ..\\ProxiJob.Job.Infrastructure");
                throw;
            }
        }
    }
}
