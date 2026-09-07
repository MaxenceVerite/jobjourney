using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Domain.Entities;

namespace MyJobBoard.Infrastructure.Services;

public class CachedAiService : IAiService
{
    private readonly IAiService _innerAiService;
    private readonly IApplicationDbContext _context;

    public CachedAiService(ResilientAiService resilientAiService, IApplicationDbContext context)
    {
        _innerAiService = resilientAiService;
        _context = context;
    }

    public async Task<string> GenerateCompanySummaryAsync(string companyName, string userId)
    {
        var normalizedName = NormalizeCompanyName(companyName);

        // Check cache
        var cachedSummary = await _context.AiCompanySummaryCaches
            .FirstOrDefaultAsync(c => c.NormalizedCompanyName == normalizedName);

        if (cachedSummary != null)
        {
            // If cache is less than 3 months old, return it
            if (cachedSummary.LastUpdatedAt > DateTime.UtcNow.AddMonths(-3))
            {
                return cachedSummary.SummaryJson;
            }
        }

        // Call the real AI service
        var summaryJson = await _innerAiService.GenerateCompanySummaryAsync(companyName, userId);

        // Save to cache
        if (cachedSummary == null)
        {
            cachedSummary = new AiCompanySummaryCache
            {
                Id = Guid.NewGuid(),
                NormalizedCompanyName = normalizedName
            };
            _context.AiCompanySummaryCaches.Add(cachedSummary);
        }

        cachedSummary.SummaryJson = summaryJson;
        cachedSummary.LastUpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return summaryJson;
    }

    public Task<string> ParseLinkedInProfileAsync(string profileContent, string userId)
    {
        return _innerAiService.ParseLinkedInProfileAsync(profileContent, userId);
    }

    private static string NormalizeCompanyName(string companyName)
    {
        if (string.IsNullOrWhiteSpace(companyName)) return string.Empty;
        
        // Convert to lowercase
        var normalized = companyName.ToLowerInvariant();
        
        // Remove accents and special characters, keep alphanumeric only
        normalized = Regex.Replace(normalized, @"[^a-z0-9]", "");
        
        return normalized;
    }
}
