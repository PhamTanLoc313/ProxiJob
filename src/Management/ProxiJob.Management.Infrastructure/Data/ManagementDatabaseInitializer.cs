using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ProxiJob.Management.Infrastructure.Data
{
    public static class ManagementDatabaseInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider, ILogger logger)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ManagementDbContext>();

            try
            {
                var pending = await context.Database.GetPendingMigrationsAsync();
                if (pending.Any())
                {
                    logger.LogInformation("Applying {Count} pending migration(s) for Management Service: {Migrations}",
                        pending.Count(), string.Join(", ", pending));
                    await context.Database.MigrateAsync();
                }
                else
                {
                    logger.LogInformation("No pending migrations for Management Service.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Management Database initialization failed. Run: dotnet ef database update --project ..\\ProxiJob.Management.Infrastructure");
                throw;
            }
        }
    }
}
