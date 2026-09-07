using Microsoft.EntityFrameworkCore;
using MyJobBoard.Domain.Entities;

namespace MyJobBoard.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Company> Companies { get; }
    DbSet<Interlocutor> Interlocutors { get; }
    DbSet<Document> Documents { get; }
    DbSet<Opportunity> Opportunities { get; }
    DbSet<Interview> Interviews { get; }
    DbSet<MyJobBoard.Domain.Entities.Application> Applications { get; }
    DbSet<Offer> Offers { get; }
    DbSet<OpportunityDocument> OpportunityDocuments { get; }
    DbSet<OpportunityInterviewInterlocutor> OpportunityInterviewInterlocutors { get; }
    DbSet<AiUsage> AiUsages { get; }
    DbSet<UserNotification> UserNotifications { get; }
    DbSet<UserProfile> UserProfiles { get; }
    DbSet<UserSettings> UserSettings { get; }
    DbSet<AiCompanySummaryCache> AiCompanySummaryCaches { get; }
    DbSet<JobAlert> JobAlerts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task<(Stream Stream, string ContentType, string FileName)?> GetFileAsync(string relativePath, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserEmail { get; }
}
