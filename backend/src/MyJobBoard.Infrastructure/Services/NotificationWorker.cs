using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Domain.Entities;

namespace MyJobBoard.Infrastructure.Services;

public class NotificationWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationWorker> _logger;
    private readonly TimeSpan _period = TimeSpan.FromMinutes(60);

    public NotificationWorker(IServiceProvider serviceProvider, ILogger<NotificationWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Initial delay to avoid slowing down startup
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessNotificationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing notifications in background worker.");
            }

            await Task.Delay(_period, stoppingToken);
        }
    }

    private async Task ProcessNotificationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var today = DateTime.UtcNow.Date;
        
        // 1. Follow-up reminder: Opportunities that are "Applied" (State = 1) and LastFollowUpDate is null or > 7 days ago
        // Actually State enum: 0=Saved, 1=Applied, 2=Interviewing. We assume 1 is Applied.
        var followUpThreshold = today.AddDays(-7);
        
        var opportunitiesToFollowUp = await context.Opportunities
            .Include(o => o.Company)
            .Where(o => (int)o.State == 1 && 
                       (o.LastFollowUpDate == null || o.LastFollowUpDate <= followUpThreshold))
            .ToListAsync(cancellationToken);

        foreach (var opp in opportunitiesToFollowUp)
        {
            // Check if we already created a reminder today for this opportunity
            var existingNotif = await context.UserNotifications
                .AnyAsync(n => n.RelatedEntityId == opp.Id && n.Type == "Reminder" && n.CreatedDate >= today, cancellationToken);

            if (!existingNotif && !string.IsNullOrEmpty(opp.UserId))
            {
                var companyName = opp.Company?.Name ?? "cette entreprise";
                context.UserNotifications.Add(new UserNotification
                {
                    Id = Guid.NewGuid(),
                    UserId = opp.UserId,
                    Message = $"Cela fait plus de 7 jours que vous avez postulé chez {companyName}. Pensez à faire une relance !",
                    Type = "Reminder",
                    RelatedEntityId = opp.Id,
                    LinkUrl = $"/opportunities/{opp.Id}",
                    IsRead = false,
                    CreatedDate = DateTime.UtcNow
                });
            }
        }

        // 2. Upcoming Interviews: Interviews scheduled for tomorrow
        var tomorrow = today.AddDays(1);
        var tomorrowEnd = tomorrow.AddDays(1); // To check range if Time is included

        var upcomingInterviews = await context.Interviews
            .Include(i => i.Opportunity)
            .ThenInclude(o => o.Company)
            .Where(i => i.DueDate >= tomorrow && i.DueDate < tomorrowEnd)
            .ToListAsync(cancellationToken);

        foreach (var interview in upcomingInterviews)
        {
            var opp = interview.Opportunity;
            if (opp != null && !string.IsNullOrEmpty(opp.UserId))
            {
                var existingNotif = await context.UserNotifications
                    .AnyAsync(n => n.RelatedEntityId == opp.Id && n.Type == "Tip" && n.CreatedDate >= today, cancellationToken);

                if (!existingNotif)
                {
                    var companyName = opp.Company?.Name ?? "l'entreprise";
                    context.UserNotifications.Add(new UserNotification
                    {
                        Id = Guid.NewGuid(),
                        UserId = opp.UserId,
                        Message = $"Vous avez un entretien demain chez {companyName}. Révisez vos notes et le dossier IA !",
                        Type = "Tip",
                        RelatedEntityId = opp.Id,
                        LinkUrl = $"/opportunities/{opp.Id}",
                        IsRead = false,
                        CreatedDate = DateTime.UtcNow
                    });
                }
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Background notification job executed successfully.");
    }
}
