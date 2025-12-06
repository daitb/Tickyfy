using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Tickify.Interfaces.Repositories;

namespace Tickify.Jobs;

/// <summary>
/// Background job to automatically release expired seat reservations
/// Runs every 2 minutes to check for and release expired reservations
/// </summary>
public class SeatReservationCleanupJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SeatReservationCleanupJob> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(2); // Run every 2 minutes

    public SeatReservationCleanupJob(
        IServiceProvider serviceProvider,
        ILogger<SeatReservationCleanupJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[SeatReservationCleanupJob] Starting seat reservation cleanup job");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredReservationsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SeatReservationCleanupJob] Error during cleanup execution");
            }

            // Wait before next execution
            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("[SeatReservationCleanupJob] Stopping seat reservation cleanup job");
    }

    private async Task CleanupExpiredReservationsAsync()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var seatRepository = scope.ServiceProvider.GetRequiredService<ISeatRepository>();

            _logger.LogDebug("[SeatReservationCleanupJob] Checking for expired reservations at {Time}", DateTime.UtcNow);

            var releasedCount = await seatRepository.ReleaseExpiredReservationsAsync();

            if (releasedCount > 0)
            {
                _logger.LogInformation(
                    "[SeatReservationCleanupJob] Released {Count} expired seat reservations at {Time}",
                    releasedCount,
                    DateTime.UtcNow);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SeatReservationCleanupJob] Failed to cleanup expired reservations");
        }
    }
}
