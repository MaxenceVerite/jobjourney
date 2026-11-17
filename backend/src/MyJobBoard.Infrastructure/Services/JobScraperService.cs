using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using AngleSharp;
using AngleSharp.Dom;
using AngleSharp.Html.Dom;
using Microsoft.Extensions.Logging;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Application.DTOs;
using MyJobBoard.Domain.Enums;

namespace MyJobBoard.Infrastructure.Services;

public class JobScraperService : IJobScraperService
{
    private readonly HttpClient _httpClient;
    private readonly IAiService _aiService;
    private readonly ILogger<JobScraperService> _logger;

    public JobScraperService(
        HttpClient httpClient,
        IAiService aiService,
        ILogger<JobScraperService> logger)
    {
        _httpClient = httpClient;
        _aiService = aiService;
        _logger = logger;
    }

    public async Task<JobImportResultDto> ScrapeJobAsync(JobImportRequestDto request, string userId, CancellationToken cancellationToken = default)
    {
        var result = new JobImportResultDto();

        // 1. If an URL is provided
        if (!string.IsNullOrWhiteSpace(request.Url))
        {
            var rawUrl = request.Url.Trim();
            result.SourceUrl = rawUrl;

            // Check for protected domains
            if (TryDetectProtectedDomain(rawUrl, out var protectedDomain))
            {
                result.IsProtectedDomain = true;
                result.ProtectedDomainName = protectedDomain;
                result.ExtractionMethod = "ProtectedDomainFallback";
                result.Message = $"{char.ToUpper(protectedDomain[0]) + protectedDomain.Substring(1)} bloque l'accès direct par serveur. Utilisez notre Bookmarklet en 1 clic ou collez le texte de l'annonce ci-dessous.";
                
                // If user also provided text in combination, parse the text
                if (!string.IsNullOrWhiteSpace(request.Text))
                {
                    ParseTextHeuristics(request.Text, result);
                    if (request.UseAiEnrichment)
                    {
                        await TryEnrichWithAiAsync(request.Text, result, userId);
                    }
                }

                return result;
            }

            // Perform HTTP fetch for open websites and ATS
            try
            {
                using var requestMsg = new HttpRequestMessage(HttpMethod.Get, rawUrl);
                requestMsg.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
                requestMsg.Headers.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
                requestMsg.Headers.Add("Accept-Language", "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7");

                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(10));

                var response = await _httpClient.SendAsync(requestMsg, cts.Token);
                if (response.IsSuccessStatusCode)
                {
                    var html = await response.Content.ReadAsStringAsync(cts.Token);
                    var config = Configuration.Default;
                    var context = BrowsingContext.New(config);
                    var document = await context.OpenAsync(req => req.Content(html), cts.Token);

                    // A. Try JSON-LD schema.org/JobPosting
                    if (TryParseJsonLd(document, result))
                    {
                        result.Success = true;
                        result.ExtractionMethod = "JSON-LD";
                        result.Message = "Annonce extraite avec succès via le standard JSON-LD (0ms IA).";
                    }
                    // B. Fallback to OpenGraph / Meta tags
                    else if (TryParseOpenGraph(document, result))
                    {
                        result.Success = true;
                        result.ExtractionMethod = "OpenGraph";
                        result.Message = "Annonce extraite via les balises OpenGraph et métadonnées.";
                    }

                    // Refine with regex on full page text if salary or remote were not in JSON-LD
                    var bodyText = document.Body?.TextContent ?? string.Empty;
                    ParseTextHeuristics(bodyText, result);
                }
                else
                {
                    result.Message = $"Le site a renvoyé un statut {response.StatusCode}. Vous pouvez copier-coller le texte directement.";
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erreur lors du scraping de l'URL {Url}", rawUrl);
                result.Message = "Impossible d'accéder au lien directement (délai dépassé ou protection). Collez le texte de l'annonce ci-dessous.";
            }
        }

        // 2. If text is provided (or as fallback)
        if (!string.IsNullOrWhiteSpace(request.Text))
        {
            ParseTextHeuristics(request.Text, result);

            if (request.UseAiEnrichment || (string.IsNullOrWhiteSpace(result.RoleTitle) && string.IsNullOrWhiteSpace(result.CompanyName)))
            {
                await TryEnrichWithAiAsync(request.Text, result, userId);
            }
            else
            {
                if (string.IsNullOrEmpty(result.ExtractionMethod) || result.ExtractionMethod == "None")
                {
                    result.ExtractionMethod = "Regex";
                    result.Success = !string.IsNullOrWhiteSpace(result.RoleTitle) || !string.IsNullOrWhiteSpace(result.CompanyName);
                    result.Message = "Données clés détectées instantanément par analyse textuelle (0ms IA).";
                }
            }
        }

        if (!result.Success && !string.IsNullOrWhiteSpace(result.RoleTitle))
        {
            result.Success = true;
        }

        return result;
    }

    private static bool TryDetectProtectedDomain(string url, out string domain)
    {
        domain = string.Empty;
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            var host = uri.Host.ToLowerInvariant();
            if (host.Contains("linkedin."))
            {
                domain = "LinkedIn";
                return true;
            }
            if (host.Contains("indeed."))
            {
                domain = "Indeed";
                return true;
            }
            if (host.Contains("glassdoor."))
            {
                domain = "Glassdoor";
                return true;
            }
            if (host.Contains("welcometothejungle.") || host.Contains("wttj.co"))
            {
                domain = "Welcome to the Jungle";
                return true;
            }
        }
        return false;
    }

    private static bool TryParseJsonLd(IDocument document, JobImportResultDto result)
    {
        var scripts = document.QuerySelectorAll("script[type='application/ld+json']");
        foreach (var script in scripts)
        {
            var content = script.TextContent?.Trim();
            if (string.IsNullOrWhiteSpace(content)) continue;

            try
            {
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                // Handle single object or array or @graph
                if (root.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in root.EnumerateArray())
                    {
                        if (ProcessJobPostingElement(item, result)) return true;
                    }
                }
                else if (root.ValueKind == JsonValueKind.Object)
                {
                    if (root.TryGetProperty("@graph", out var graphEl) && graphEl.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in graphEl.EnumerateArray())
                        {
                            if (ProcessJobPostingElement(item, result)) return true;
                        }
                    }
                    else
                    {
                        if (ProcessJobPostingElement(root, result)) return true;
                    }
                }
            }
            catch
            {
                // Ignore malformed JSON-LD in third-party pages
            }
        }

        return false;
    }

    private static bool ProcessJobPostingElement(JsonElement element, JobImportResultDto result)
    {
        if (element.TryGetProperty("@type", out var typeEl))
        {
            var typeStr = typeEl.GetString();
            if (string.Equals(typeStr, "JobPosting", StringComparison.OrdinalIgnoreCase))
            {
                if (element.TryGetProperty("title", out var titleEl))
                {
                    result.RoleTitle = titleEl.GetString()?.Trim() ?? string.Empty;
                }

                if (element.TryGetProperty("hiringOrganization", out var orgEl))
                {
                    if (orgEl.TryGetProperty("name", out var orgNameEl))
                    {
                        result.CompanyName = orgNameEl.GetString()?.Trim() ?? string.Empty;
                    }
                }

                if (element.TryGetProperty("jobLocation", out var locEl))
                {
                    if (locEl.TryGetProperty("address", out var addrEl))
                    {
                        var city = addrEl.TryGetProperty("addressLocality", out var cityEl) ? cityEl.GetString() : null;
                        var region = addrEl.TryGetProperty("addressRegion", out var regEl) ? regEl.GetString() : null;
                        result.Location = !string.IsNullOrEmpty(city) ? city : region;
                    }
                }

                if (element.TryGetProperty("description", out var descEl))
                {
                    var rawDesc = descEl.GetString() ?? string.Empty;
                    // Strip HTML tags for clean description
                    result.Description = Regex.Replace(rawDesc, "<.*?>", string.Empty).Trim();
                }

                if (element.TryGetProperty("employmentType", out var empEl))
                {
                    var emp = empEl.GetString() ?? string.Empty;
                    if (emp.Contains("FULL_TIME", StringComparison.OrdinalIgnoreCase))
                    {
                        result.ApplicationType = ApplicationType.JobOffer;
                        result.CustomApplicationType = "CDI";
                    }
                    else if (emp.Contains("PART_TIME", StringComparison.OrdinalIgnoreCase))
                    {
                        result.ApplicationType = ApplicationType.JobOffer;
                        result.CustomApplicationType = "Temps partiel";
                    }
                    else if (emp.Contains("CONTRACTOR", StringComparison.OrdinalIgnoreCase) || emp.Contains("FREELANCE", StringComparison.OrdinalIgnoreCase))
                    {
                        result.ApplicationType = ApplicationType.JobOffer;
                        result.CustomApplicationType = "Freelance";
                    }
                    else if (emp.Contains("INTERN", StringComparison.OrdinalIgnoreCase))
                    {
                        result.ApplicationType = ApplicationType.JobOffer;
                        result.CustomApplicationType = "Stage";
                    }
                }

                if (element.TryGetProperty("baseSalary", out var salEl))
                {
                    if (salEl.TryGetProperty("value", out var valEl))
                    {
                        if (valEl.TryGetProperty("minValue", out var minEl) && minEl.TryGetDouble(out var minVal))
                        {
                            result.SalaryMin = minVal;
                        }
                        if (valEl.TryGetProperty("maxValue", out var maxEl) && maxEl.TryGetDouble(out var maxVal))
                        {
                            result.SalaryMax = maxVal;
                        }
                        if (valEl.TryGetProperty("unitText", out var unitEl))
                        {
                            var unit = unitEl.GetString()?.ToUpperInvariant() ?? string.Empty;
                            if (unit.Contains("MONTH")) result.SalaryPeriodicity = Periodicity.Monthly;
                            else if (unit.Contains("DAY")) result.SalaryPeriodicity = Periodicity.Daily;
                            else result.SalaryPeriodicity = Periodicity.Yearly;
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(result.RoleTitle))
                {
                    return true;
                }
            }
        }
        return false;
    }

    private static bool TryParseOpenGraph(IDocument document, JobImportResultDto result)
    {
        var ogTitle = document.QuerySelector("meta[property='og:title']")?.GetAttribute("content")
                   ?? document.QuerySelector("title")?.TextContent;

        var ogSiteName = document.QuerySelector("meta[property='og:site_name']")?.GetAttribute("content");
        var ogDesc = document.QuerySelector("meta[property='og:description']")?.GetAttribute("content")
                  ?? document.QuerySelector("meta[name='description']")?.GetAttribute("content");

        if (!string.IsNullOrWhiteSpace(ogTitle))
        {
            // Titles often contain "Job Title - Company - Location" or "Job Title chez Company"
            var title = ogTitle.Trim();
            if (title.Contains(" chez ", StringComparison.OrdinalIgnoreCase))
            {
                var parts = Regex.Split(title, @"\s+chez\s+", RegexOptions.IgnoreCase);
                result.RoleTitle = parts[0].Trim();
                if (parts.Length > 1 && string.IsNullOrEmpty(result.CompanyName))
                {
                    result.CompanyName = parts[1].Split(new[] { '-', '|', '–' })[0].Trim();
                }
            }
            else if (title.Contains(" - "))
            {
                var parts = title.Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
                result.RoleTitle = parts[0].Trim();
                if (parts.Length > 1 && string.IsNullOrEmpty(result.CompanyName))
                {
                    result.CompanyName = parts[1].Trim();
                }
            }
            else
            {
                result.RoleTitle = title;
            }

            if (!string.IsNullOrWhiteSpace(ogSiteName) && string.IsNullOrEmpty(result.CompanyName))
            {
                result.CompanyName = ogSiteName.Trim();
            }

            if (!string.IsNullOrWhiteSpace(ogDesc) && string.IsNullOrEmpty(result.Description))
            {
                result.Description = ogDesc.Trim();
            }

            return true;
        }

        return false;
    }

    private static void ParseTextHeuristics(string text, JobImportResultDto result)
    {
        if (string.IsNullOrWhiteSpace(text)) return;

        // 1. Salary Detection
        if (!result.SalaryMin.HasValue && !result.SalaryMax.HasValue)
        {
            // Range: 45k - 55k or 45 000€ - 55 000€
            var rangeMatch = Regex.Match(text, @"(\d{2,3})\s*(?:k|K|000)?\s*(?:€|euros?)?\s*(?:à|-|au)\s*(\d{2,3})\s*(?:k|K|000)?\s*(?:€|euros?|k€)", RegexOptions.IgnoreCase);
            if (rangeMatch.Success)
            {
                if (double.TryParse(rangeMatch.Groups[1].Value, out var min))
                {
                    result.SalaryMin = min < 1000 ? min * 1000 : min;
                }
                if (double.TryParse(rangeMatch.Groups[2].Value, out var max))
                {
                    result.SalaryMax = max < 1000 ? max * 1000 : max;
                }
                result.SalaryPeriodicity = Periodicity.Yearly;
            }
            else
            {
                // Single salary: 50 000 € / an or 50k€
                var singleMatch = Regex.Match(text, @"(?:salaire|rémunération)?\s*[:=]?\s*(\d{2,3})(?:[\s.,](\d{3}))?\s*(?:k€|k|K|€|euros?)(?:\s*(?:brut|net))?(?:\s*(?:\/|par)\s*(an|mois|jour))?", RegexOptions.IgnoreCase);
                if (singleMatch.Success)
                {
                    var numStr = singleMatch.Groups[1].Value + (singleMatch.Groups[2].Success ? singleMatch.Groups[2].Value : "");
                    if (double.TryParse(numStr, out var val))
                    {
                        var multiplier = (val < 1000 && !singleMatch.Value.Contains("jour") && !singleMatch.Value.Contains("mois")) ? 1000 : 1;
                        result.SalaryMin = val * multiplier;
                        if (singleMatch.Groups[3].Success)
                        {
                            var period = singleMatch.Groups[3].Value.ToLowerInvariant();
                            result.SalaryPeriodicity = period == "mois" ? Periodicity.Monthly : period == "jour" ? Periodicity.Daily : Periodicity.Yearly;
                        }
                        else
                        {
                            result.SalaryPeriodicity = Periodicity.Yearly;
                        }
                    }
                }
            }
        }

        // 2. Remote Condition Detection
        if (!result.RemoteCondition.HasValue)
        {
            if (Regex.IsMatch(text, @"\b(full\s*remote|100%\s*(?:télétravail|remote)|télétravail\s*total)\b", RegexOptions.IgnoreCase))
            {
                result.RemoteCondition = RemoteCondition.Remote;
            }
            else if (Regex.IsMatch(text, @"\b(hybride|hybrid|\d\s*jours?\s*de\s*télétravail|remote\s*friendly)\b", RegexOptions.IgnoreCase))
            {
                result.RemoteCondition = RemoteCondition.Hybrid;
            }
            else if (Regex.IsMatch(text, @"\b(sur\s*site|présentiel|pas\s*de\s*télétravail)\b", RegexOptions.IgnoreCase))
            {
                result.RemoteCondition = RemoteCondition.Office;
            }
        }

        // 3. Contract Type Detection
        if (result.ApplicationType == null)
        {
            if (Regex.IsMatch(text, @"\bCDI\b", RegexOptions.IgnoreCase))
            {
                result.ApplicationType = ApplicationType.JobOffer;
                result.CustomApplicationType = "CDI";
            }
            else if (Regex.IsMatch(text, @"\bCDD\b", RegexOptions.IgnoreCase))
            {
                result.ApplicationType = ApplicationType.JobOffer;
                result.CustomApplicationType = "CDD";
            }
            else if (Regex.IsMatch(text, @"\b(stage|internship)\b", RegexOptions.IgnoreCase))
            {
                result.ApplicationType = ApplicationType.JobOffer;
                result.CustomApplicationType = "Stage";
            }
            else if (Regex.IsMatch(text, @"\b(alternance|apprentissage)\b", RegexOptions.IgnoreCase))
            {
                result.ApplicationType = ApplicationType.JobOffer;
                result.CustomApplicationType = "Alternance";
            }
            else if (Regex.IsMatch(text, @"\b(freelance|indépendant|prestataire)\b", RegexOptions.IgnoreCase))
            {
                result.ApplicationType = ApplicationType.JobOffer;
                result.CustomApplicationType = "Freelance";
            }
        }

        // 4. Contact Email
        if (string.IsNullOrEmpty(result.ContactEmail))
        {
            var emailMatch = Regex.Match(text, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}");
            if (emailMatch.Success)
            {
                result.ContactEmail = emailMatch.Value;
            }
        }

        // 5. Contact Phone
        if (string.IsNullOrEmpty(result.ContactPhone))
        {
            var phoneMatch = Regex.Match(text, @"(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}");
            if (phoneMatch.Success)
            {
                result.ContactPhone = phoneMatch.Value;
            }
        }

        // 6. Strict Title: only if explicit label at start of line
        if (string.IsNullOrWhiteSpace(result.RoleTitle))
        {
            var titleMatch = Regex.Match(text, @"^[ \t]*(?:poste|intitulé du poste|titre du poste)\s*[:=]\s*([^\r\n]+)", RegexOptions.IgnoreCase | RegexOptions.Multiline);
            if (titleMatch.Success)
            {
                result.RoleTitle = titleMatch.Groups[1].Value.Trim();
            }
        }

        // 7. Strict Company: only explicit label or markdown link
        if (string.IsNullOrWhiteSpace(result.CompanyName))
        {
            var lines = text.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            for (int i = 0; i < Math.Min(lines.Length, 5); i++)
            {
                var mdMatch = Regex.Match(lines[i], @"\[([^\]]+)\]\((https?:\/\/[^\)]+)\)");
                if (mdMatch.Success && !Regex.IsMatch(mdMatch.Groups[1].Value, @"postuler|continuer|apply|en savoir plus", RegexOptions.IgnoreCase))
                {
                    result.CompanyName = mdMatch.Groups[1].Value.Trim();
                    break;
                }
            }

            if (string.IsNullOrWhiteSpace(result.CompanyName))
            {
                var compMatch = Regex.Match(text, @"^[ \t]*(?:entreprise|société|employeur|client)\s*[:=]\s*([^\r\n]+)", RegexOptions.IgnoreCase | RegexOptions.Multiline);
                if (compMatch.Success)
                {
                    result.CompanyName = compMatch.Groups[1].Value.Trim();
                }
            }
        }

        // 8. Strict Location: only explicit label, postal code, or "Trouvé sur"
        if (string.IsNullOrWhiteSpace(result.Location))
        {
            var indeedLocMatch = Regex.Match(text, @"Trouvé sur\s+([^\r\n,]+)", RegexOptions.IgnoreCase);
            if (indeedLocMatch.Success && indeedLocMatch.Groups[1].Value.Trim().Length < 40)
            {
                result.Location = indeedLocMatch.Groups[1].Value.Trim();
            }
            else
            {
                var postalMatch = Regex.Match(text, @"\b(\d{5})\s+([A-Za-zÀ-ÿ-]+)");
                if (postalMatch.Success)
                {
                    result.Location = $"{postalMatch.Groups[1].Value} {postalMatch.Groups[2].Value.Trim()}";
                }
                else
                {
                    var locMatch = Regex.Match(text, @"^[ \t]*(?:lieu|localisation|ville)\s*[:=]\s*([^\r\n]+)", RegexOptions.IgnoreCase | RegexOptions.Multiline);
                    if (locMatch.Success)
                    {
                        result.Location = locMatch.Groups[1].Value.Trim();
                    }
                }
            }
        }
    }

    private async Task TryEnrichWithAiAsync(string text, JobImportResultDto result, string userId)
    {
        try
        {
            var prompt = "Tu es un assistant de recrutement. Analyse cette annonce d'emploi et extrait les données en JSON STRICT avec ces clés:\n" +
                         "{\n" +
                         "  \"roleTitle\": \"intitulé précis du poste\",\n" +
                         "  \"companyName\": \"nom de l'entreprise\",\n" +
                         "  \"location\": \"ville ou localisation\",\n" +
                         "  \"salaryMin\": null,\n" +
                         "  \"salaryMax\": null,\n" +
                         "  \"remote\": \"Remote\" ou \"Hybrid\" ou \"Office\",\n" +
                         "  \"contractType\": \"CDI\" ou \"CDD\" ou \"Freelance\" ou \"Stage\",\n" +
                         "  \"keySkills\": [\"compétence 1\", \"compétence 2\", \"compétence 3\"],\n" +
                         "  \"summary\": \"résumé clair de 2-3 phrases sur les missions\"\n" +
                         "}\n\n" +
                         "Texte de l'annonce :\n" + (text.Length > 3000 ? text.Substring(0, 3000) : text);

            var jsonResponse = await _aiService.GenerateOpportunitySummaryAsync(prompt, userId);
            
            // Clean markdown code fence if returned
            var cleanedJson = jsonResponse.Trim();
            if (cleanedJson.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
            {
                cleanedJson = cleanedJson.Substring(7);
            }
            else if (cleanedJson.StartsWith("```"))
            {
                cleanedJson = cleanedJson.Substring(3);
            }
            if (cleanedJson.EndsWith("```"))
            {
                cleanedJson = cleanedJson.Substring(0, cleanedJson.Length - 3);
            }
            cleanedJson = cleanedJson.Trim();

            using var doc = JsonDocument.Parse(cleanedJson);
            var root = doc.RootElement;

            if (string.IsNullOrWhiteSpace(result.RoleTitle) && root.TryGetProperty("roleTitle", out var tEl) && tEl.ValueKind == JsonValueKind.String)
            {
                result.RoleTitle = tEl.GetString() ?? string.Empty;
            }

            if (string.IsNullOrWhiteSpace(result.CompanyName) && root.TryGetProperty("companyName", out var cEl) && cEl.ValueKind == JsonValueKind.String)
            {
                result.CompanyName = cEl.GetString() ?? string.Empty;
            }

            if (string.IsNullOrWhiteSpace(result.Location) && root.TryGetProperty("location", out var lEl) && lEl.ValueKind == JsonValueKind.String)
            {
                result.Location = lEl.GetString();
            }

            if (!result.RemoteCondition.HasValue && root.TryGetProperty("remote", out var rEl) && rEl.ValueKind == JsonValueKind.String)
            {
                var rStr = rEl.GetString();
                if (Enum.TryParse<RemoteCondition>(rStr, true, out var rc))
                {
                    result.RemoteCondition = rc;
                }
            }

            if (root.TryGetProperty("keySkills", out var sEl) && sEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var skill in sEl.EnumerateArray())
                {
                    if (skill.ValueKind == JsonValueKind.String)
                    {
                        var s = skill.GetString();
                        if (!string.IsNullOrWhiteSpace(s)) result.KeySkills.Add(s);
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(result.Description) && root.TryGetProperty("summary", out var sumEl) && sumEl.ValueKind == JsonValueKind.String)
            {
                result.Description = sumEl.GetString();
            }

            result.ExtractionMethod = "AI";
            result.Success = true;
            result.Message = "Annonce enrichie avec succès par l'IA.";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Échec de l'enrichissement IA pour l'annonce");
        }
    }
}
