using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Application.Common.Models.FranceTravail;
using MyJobBoard.Application.Common.Models.Matching;
using MyJobBoard.Domain.Entities;

namespace MyJobBoard.Infrastructure.Services;

public class JobMatchingService : IJobMatchingService
{
    private readonly IApplicationDbContext _context;
    private readonly IFranceTravailService _franceTravailService;
    private readonly IAiService _aiService;
    private readonly ILogger<JobMatchingService> _logger;

    public JobMatchingService(
        IApplicationDbContext context,
        IFranceTravailService franceTravailService,
        IAiService aiService,
        ILogger<JobMatchingService> logger)
    {
        _context = context;
        _franceTravailService = franceTravailService;
        _aiService = aiService;
        _logger = logger;
    }

    public async Task<SmartMatchSearchResponse> FindSmartMatchesAsync(string userId, SmartMatchSearchRequest request)
    {
        var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
        {
            profile = new UserProfile { UserId = userId };
        }

        // 1. Prepare search params
        var keyword = !string.IsNullOrWhiteSpace(request.Keyword) 
            ? request.Keyword 
            : (!string.IsNullOrWhiteSpace(profile.TargetHorizonRole) ? profile.TargetHorizonRole : profile.JobTitle);

        if (string.IsNullOrWhiteSpace(keyword))
        {
            keyword = "Développeur";
        }

        var cityCode = !string.IsNullOrWhiteSpace(request.CityCode) ? request.CityCode : profile.CityCode;
        var rayon = request.Rayon ?? 25;

        var searchParams = new FranceTravailSearchParams
        {
            UserId = userId,
            Keyword = keyword,
            Commune = cityCode,
            Rayon = rayon > 0 ? rayon : null,
            Page = 1
        };

        // 2. Fetch raw offers
        var rawResults = await _franceTravailService.SearchOffersAsync(searchParams);
        var offers = rawResults?.Resultats ?? new List<FranceTravailJobOffer>();

        var response = new SmartMatchSearchResponse
        {
            TotalAnalyzed = offers.Count,
            CandidateSummaryUsed = $"{profile.JobTitle} -> Cible : {profile.TargetHorizonRole}"
        };

        if (!offers.Any())
        {
            return response;
        }

        // 3. Compensatory Local Scoring (0 token)
        var userLat = request.Latitude ?? profile.Latitude;
        var userLon = request.Longitude ?? profile.Longitude;

        var evaluatedOffers = new List<SmartMatchOfferDto>();

        foreach (var offer in offers)
        {
            var dto = EvaluateOfferFit(offer, profile, userLat, userLon);
            if (dto != null)
            {
                evaluatedOffers.Add(dto);
            }
        }

        // Sort by GlobalFitScore descending
        var sorted = evaluatedOffers
            .OrderByDescending(o => o.GlobalFitScore)
            .Take(request.Limit > 0 ? request.Limit : 15)
            .ToList();

        response.TotalRetained = sorted.Count;

        // 4. Batch Micro-AI Coaching for Top 5 if requested
        if (request.IncludeAiVerdict && sorted.Any())
        {
            await EnrichTopMatchesWithAiAsync(sorted.Take(5).ToList(), profile, userId);
        }

        response.Matches = sorted;
        return response;
    }

    private SmartMatchOfferDto? EvaluateOfferFit(
        FranceTravailJobOffer offer,
        UserProfile profile,
        double? userLat,
        double? userLon)
    {
        var textToSearch = $"{offer.Intitule} {offer.Description}".ToLowerInvariant();

        // Check Hard Vetoes
        if (profile.VetoKeywords != null && profile.VetoKeywords.Any())
        {
            foreach (var veto in profile.VetoKeywords)
            {
                if (!string.IsNullOrWhiteSpace(veto) && textToSearch.Contains(veto.Trim().ToLowerInvariant()))
                {
                    return null; // Excluded by veto
                }
            }
        }

        var strongPoints = new List<string>();
        var frictions = new List<string>();

        // A. Tech Fit (Core vs Desired)
        int techScore = 40; // baseline
        int coreMatches = 0;
        int desiredMatches = 0;

        if (profile.CoreSkills != null)
        {
            foreach (var skill in profile.CoreSkills.Where(s => !string.IsNullOrWhiteSpace(s)))
            {
                if (textToSearch.Contains(skill.Trim().ToLowerInvariant()))
                {
                    coreMatches++;
                    strongPoints.Add($"Compétence maîtrisée : {skill}");
                }
            }
        }

        if (profile.DesiredSkills != null)
        {
            foreach (var skill in profile.DesiredSkills.Where(s => !string.IsNullOrWhiteSpace(s)))
            {
                if (textToSearch.Contains(skill.Trim().ToLowerInvariant()))
                {
                    desiredMatches++;
                    strongPoints.Add($"Opportunité d'apprendre : {skill}");
                }
            }
        }

        techScore += (coreMatches * 15) + (desiredMatches * 22);
        techScore = Math.Clamp(techScore, 10, 100);

        // B. Ambition Fit
        int ambitionScore = 50;
        var targetRole = profile.TargetHorizonRole?.Trim().ToLowerInvariant();
        var titleLower = offer.Intitule?.ToLowerInvariant() ?? "";

        if (!string.IsNullOrEmpty(targetRole) && titleLower.Contains(targetRole))
        {
            ambitionScore += 40;
            strongPoints.Add($"Titre visé atteint : {profile.TargetHorizonRole}");
        }
        else if (titleLower.Contains("lead") || titleLower.Contains("senior") || titleLower.Contains("architecte") || titleLower.Contains("manager"))
        {
            ambitionScore += 25;
            strongPoints.Add("Rôle à responsabilité (Lead / Senior)");
        }

        ambitionScore = Math.Clamp(ambitionScore, 10, 100);

        // C. Conditions Fit (Remote, Salaire, Distance)
        int conditionsScore = 70;
        int frictionPenalty = 0;

        // Remote check
        var isRemoteMentioned = textToSearch.Contains("télétravail") || textToSearch.Contains("remote");
        var isFullRemote = textToSearch.Contains("full remote") || textToSearch.Contains("100% télétravail");
        var isPartialRemote = textToSearch.Contains("télétravail partiel") || textToSearch.Contains("hybride") || textToSearch.Contains("jours de télétravail");

        if (profile.RemotePreference?.Equals("Full Remote", StringComparison.OrdinalIgnoreCase) == true)
        {
            if (isFullRemote)
            {
                conditionsScore += 20;
                strongPoints.Add("Full Remote confirmé");
            }
            else if (isPartialRemote)
            {
                frictions.Add("Télétravail hybride (présentiel partiel)");
                frictionPenalty += 20;
            }
            else if (!isRemoteMentioned)
            {
                frictions.Add("Télétravail non spécifié ou sur site");
                frictionPenalty += 30;
            }
        }

        // Distance check
        double? distanceKm = null;
        if (userLat.HasValue && userLon.HasValue && offer.LieuTravail?.Latitude.HasValue == true && offer.LieuTravail?.Longitude.HasValue == true)
        {
            distanceKm = CalculateDistance(userLat.Value, userLon.Value, offer.LieuTravail.Latitude.Value, offer.LieuTravail.Longitude.Value);
            if (distanceKm > 40 && !isFullRemote)
            {
                frictions.Add($"Trajet conséquent ({Math.Round(distanceKm.Value)} km)");
                frictionPenalty += 15;
            }
            else if (distanceKm <= 15)
            {
                strongPoints.Add($"Proximité géographique ({Math.Round(distanceKm.Value)} km)");
            }
        }

        // Salary check
        var salaryText = offer.Salaire?.Libelle ?? offer.Salaire?.Commentaire;
        if (!string.IsNullOrEmpty(salaryText))
        {
            var extractedSalary = ExtractYearlySalary(salaryText);
            if (extractedSalary.HasValue)
            {
                if (profile.SalaryExpectationMin.HasValue && extractedSalary < profile.SalaryExpectationMin.Value * 0.9)
                {
                    frictions.Add($"Salaire estimé ({extractedSalary}k€) sous votre cible ({profile.SalaryExpectationMin}k€)");
                    frictionPenalty += 25;
                }
                else if (profile.SalaryExpectationMax.HasValue && extractedSalary >= profile.SalaryExpectationMax.Value)
                {
                    strongPoints.Add($"Rémunération attractive ({extractedSalary}k€)");
                    conditionsScore += 20;
                }
            }
        }

        conditionsScore = Math.Clamp(conditionsScore - frictionPenalty, 10, 100);

        // D. Weighted Global Score
        double wSalary = profile.WeightSalary > 0 ? profile.WeightSalary : 3;
        double wTech = profile.WeightTechChallenge > 0 ? profile.WeightTechChallenge : 4;
        double wBalance = profile.WeightWorkLifeBalance > 0 ? profile.WeightWorkLifeBalance : 4;
        double wCareer = profile.WeightCareerGrowth > 0 ? profile.WeightCareerGrowth : 3;

        double totalWeights = wSalary + wTech + wBalance + wCareer;
        double weightedFit = ((conditionsScore * wBalance) + (techScore * wTech) + (ambitionScore * wCareer)) / (wBalance + wTech + wCareer);

        int globalScore = (int)Math.Round(weightedFit);
        globalScore = Math.Clamp(globalScore, 10, 99);

        // Category & Trade-off flag
        bool hasTradeOff = frictions.Any() && globalScore >= 65 && profile.EnableTradeOffAlerts;
        string matchCat = "StandardMatch";

        if (hasTradeOff)
        {
            matchCat = "TradeOffOpportunity";
        }
        else if (globalScore >= 85)
        {
            matchCat = ambitionScore >= 85 ? "CareerAccelerator" : "PerfectMatch";
        }

        return new SmartMatchOfferDto
        {
            Id = offer.Id,
            Title = offer.Intitule,
            CompanyName = offer.Entreprise?.Nom ?? "Entreprise confidentielle",
            CompanyLogoUrl = offer.Entreprise?.Logo,
            Location = offer.LieuTravail?.Libelle ?? offer.LieuTravail?.Commune,
            DistanceKm = distanceKm.HasValue ? Math.Round(distanceKm.Value, 1) : null,
            ContractType = offer.TypeContratLibelle ?? offer.TypeContrat,
            SalaryText = salaryText,
            Description = offer.Description,
            ExternalUrl = offer.OrigineOffre?.UrlOrigine,
            PublishedAt = offer.DateCreation,
            GlobalFitScore = globalScore,
            TechFitScore = techScore,
            AmbitionFitScore = ambitionScore,
            ConditionsFitScore = conditionsScore,
            HasSignificantTradeOff = hasTradeOff,
            MatchCategory = matchCat,
            StrongPoints = strongPoints.Distinct().Take(4).ToList(),
            FrictionPoints = frictions.Distinct().Take(3).ToList(),
            OriginalOffer = offer
        };
    }

    private async Task EnrichTopMatchesWithAiAsync(List<SmartMatchOfferDto> topMatches, UserProfile profile, string userId)
    {
        try
        {
            var batchContext = new
            {
                candidat = new
                {
                    titreActuel = profile.JobTitle,
                    roleVise = profile.TargetHorizonRole,
                    manifesto = profile.CompactCareerManifesto,
                    remoteSouhaite = profile.RemotePreference,
                    competencesCles = profile.CoreSkills,
                    competencesApprendre = profile.DesiredSkills
                },
                offres = topMatches.Select(m => new
                {
                    offerId = m.Id,
                    titre = m.Title,
                    entreprise = m.CompanyName,
                    pointsForts = m.StrongPoints,
                    frictions = m.FrictionPoints,
                    hasTradeOff = m.HasSignificantTradeOff,
                    descriptionSnippet = m.Description != null && m.Description.Length > 280 
                        ? m.Description.Substring(0, 280) + "..." 
                        : m.Description
                })
            };

            var jsonContext = JsonSerializer.Serialize(batchContext);
            var aiResult = await _aiService.EvaluateBatchTradeOffsAsync(jsonContext, userId);

            if (!string.IsNullOrWhiteSpace(aiResult))
            {
                using var doc = JsonDocument.Parse(aiResult);
                JsonElement evalsArray;

                if (doc.RootElement.TryGetProperty("evaluations", out evalsArray) && evalsArray.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in evalsArray.EnumerateArray())
                    {
                        var offerId = elem.TryGetProperty("offerId", out var idProp) ? idProp.GetString() : null;
                        var match = topMatches.FirstOrDefault(m => m.Id == offerId);
                        if (match != null)
                        {
                            match.AiCoachVerdict = elem.TryGetProperty("verdictArbitrage", out var vProp) ? vProp.GetString() : null;
                            match.TailoredPitch = elem.TryGetProperty("pitchAccroche", out var pProp) ? pProp.GetString() : null;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to enrich top matches with AI coach verdict. Fallback to heuristic values.");
            foreach (var match in topMatches)
            {
                if (match.HasSignificantTradeOff)
                {
                    match.AiCoachVerdict = "Cette opportunité présente un compromis intéressant : ses atouts techniques ou d'ambition compensent les frictions identifiées.";
                }
                else
                {
                    match.AiCoachVerdict = "Très bon alignement global avec vos critères prioritaires et votre stack technique.";
                }
                match.TailoredPitch = $"Bonjour, vivement intéressé par votre opportunité de {match.Title}, mes compétences et mon projet d'évolution correspondent particulièrement à vos besoins.";
            }
        }
    }

    private static double? ExtractYearlySalary(string text)
    {
        // Check patterns like "45000" or "45 k" or "45keur"
        var match = Regex.Match(text, @"(\d{2,3})[\s\.]?(\d{3})");
        if (match.Success)
        {
            if (double.TryParse(match.Groups[1].Value + match.Groups[2].Value, out double val))
            {
                return Math.Round(val / 1000.0, 1);
            }
        }

        var kMatch = Regex.Match(text, @"(\d{2,3})\s*(?:k|k€|keur)", RegexOptions.IgnoreCase);
        if (kMatch.Success && double.TryParse(kMatch.Groups[1].Value, out double kVal))
        {
            return kVal;
        }

        return null;
    }

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth radius in km
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }
}
