using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MyJobBoard.Application.Common.Interfaces;

namespace MyJobBoard.Infrastructure.Services;

public class ResilientAiService : IAiService
{
    private readonly GeminiAiService _primaryService;
    private readonly GroqAiService _fallbackService;
    private readonly ILogger<ResilientAiService> _logger;

    public ResilientAiService(
        GeminiAiService primaryService,
        GroqAiService fallbackService,
        ILogger<ResilientAiService> logger)
    {
        _primaryService = primaryService;
        _fallbackService = fallbackService;
        _logger = logger;
    }

    public async Task<string> GenerateCompanySummaryAsync(string companyName, string userId)
    {
        try
        {
            return await _primaryService.GenerateCompanySummaryAsync(companyName, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Primary AI service failed. Falling back to Groq service.");
            return await _fallbackService.GenerateCompanySummaryAsync(companyName, userId);
        }
    }

    public async Task<string> ParseLinkedInProfileAsync(string profileText, string userId)
    {
        try
        {
            return await _primaryService.ParseLinkedInProfileAsync(profileText, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Primary AI service failed. Falling back to Groq service.");
            return await _fallbackService.ParseLinkedInProfileAsync(profileText, userId);
        }
    }

    public async Task<string> GenerateOpportunitySummaryAsync(string jsonContext, string userId)
    {
        try
        {
            return await _primaryService.GenerateOpportunitySummaryAsync(jsonContext, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Primary AI service failed for opportunity summary. Falling back to Groq.");
            return await _fallbackService.GenerateOpportunitySummaryAsync(jsonContext, userId);
        }
    }
}
