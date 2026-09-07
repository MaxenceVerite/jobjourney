using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Domain.Entities;

namespace MyJobBoard.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<IdentityUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Interlocutor> Interlocutors => Set<Interlocutor>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Opportunity> Opportunities => Set<Opportunity>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<MyJobBoard.Domain.Entities.Application> Applications => Set<MyJobBoard.Domain.Entities.Application>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<OpportunityDocument> OpportunityDocuments => Set<OpportunityDocument>();
    public DbSet<OpportunityInterviewInterlocutor> OpportunityInterviewInterlocutors => Set<OpportunityInterviewInterlocutor>();
    public DbSet<AiUsage> AiUsages => Set<AiUsage>();
    public DbSet<UserNotification> UserNotifications => Set<UserNotification>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<AiCompanySummaryCache> AiCompanySummaryCaches => Set<AiCompanySummaryCache>();
    public DbSet<JobAlert> JobAlerts => Set<JobAlert>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // AiCompanySummaryCache
        builder.Entity<AiCompanySummaryCache>()
            .HasIndex(c => c.NormalizedCompanyName)
            .IsUnique();

        // OpportunityDocument (Many-to-Many join entity)
        builder.Entity<OpportunityDocument>()
            .HasKey(od => new { od.OpportunityId, od.DocumentId });

        builder.Entity<OpportunityDocument>()
            .HasOne(od => od.Opportunity)
            .WithMany(o => o.Documents)
            .HasForeignKey(od => od.OpportunityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<OpportunityDocument>()
            .HasOne(od => od.Document)
            .WithMany(d => d.OpportunityDocuments)
            .HasForeignKey(od => od.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        // OpportunityInterviewInterlocutor (Many-to-Many join entity)
        builder.Entity<OpportunityInterviewInterlocutor>()
            .HasKey(oi => new { oi.InterviewId, oi.InterlocutorId });

        builder.Entity<OpportunityInterviewInterlocutor>()
            .HasOne(oi => oi.Interview)
            .WithMany(i => i.Interviewers)
            .HasForeignKey(oi => oi.InterviewId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<OpportunityInterviewInterlocutor>()
            .HasOne(oi => oi.Interlocutor)
            .WithMany(i => i.InterviewInterlocutors)
            .HasForeignKey(oi => oi.InterlocutorId)
            .OnDelete(DeleteBehavior.Cascade);

        // Opportunity - Relationships
        builder.Entity<Opportunity>()
            .HasOne(o => o.Company)
            .WithMany(c => c.Opportunities)
            .HasForeignKey(o => o.CompanyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Opportunity>()
            .HasOne(o => o.RelatedApplication)
            .WithOne(a => a.Opportunity)
            .HasForeignKey<MyJobBoard.Domain.Entities.Application>(a => a.OpportunityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Opportunity>()
            .HasMany(o => o.Interviews)
            .WithOne(i => i.Opportunity)
            .HasForeignKey(i => i.OpportunityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Opportunity>()
            .HasMany(o => o.Offers)
            .WithOne(off => off.Opportunity)
            .HasForeignKey(off => off.OpportunityId)
            .OnDelete(DeleteBehavior.Cascade);

        // Interlocutor - Company
        builder.Entity<Interlocutor>()
            .HasOne(i => i.Company)
            .WithMany(c => c.Interlocutors)
            .HasForeignKey(i => i.CompanyId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
