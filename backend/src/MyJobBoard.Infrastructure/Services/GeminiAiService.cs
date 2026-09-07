using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Domain.Entities;

namespace MyJobBoard.Infrastructure.Services;

public class GeminiAiService : IAiService
{
    private readonly HttpClient _httpClient;
    private readonly AiSettings _settings;
    private readonly IApplicationDbContext _context;

    public GeminiAiService(HttpClient httpClient, IOptions<AiSettings> settings, IApplicationDbContext context)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _context = context;
    }

    public async Task<string> GenerateCompanySummaryAsync(string companyName, string userId)
    {
        var today = DateTime.UtcNow.Date;
        AiUsage? usage = null;
        var userSettings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        var apiKey = userSettings?.AiApiKey;
        var usingCustomKey = !string.IsNullOrEmpty(apiKey);
        
        if (!usingCustomKey)
        {
            apiKey = _settings.GeminiApiKey;
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Gemini API Key is not configured.");
            }

            usage = await _context.AiUsages.FirstOrDefaultAsync(u => u.UserId == userId && u.Date == today);

            if (usage != null && usage.RequestsCount >= _settings.MaxRequestsPerDay)
            {
                throw new Exception("AI quota exceeded for today.");
            }
        }

        // Create prompt
        var prompt = $"Agis comme un coach carrière. Fais une recherche sur l'entreprise '{companyName}' et fournis un dossier de préparation d'entretien au format JSON strict avec EXACTEMENT ces clés (en minuscules) :\n" +
                     "- 'pitch' : Résumé de 2-3 phrases sur ce qu'ils vendent ou font réellement.\n" +
                     "- 'competitors' : Liste de leurs principaux concurrents ou positionnement marché.\n" +
                     "- 'culture' : Leurs valeurs affichées ou leur culture d'entreprise.\n" +
                     "- 'interviewtips' : 2-3 conseils pour réussir un entretien chez eux (sujets à aborder, traits de personnalité recherchés).\n" +
                     "IMPORTANT: Tu dois OBLIGATOIREMENT rédiger les textes en FRANÇAIS, même si les clés du JSON sont en anglais.\n" +
                     "Ne renvoie absolument rien d'autre que du JSON valide.";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                response_mime_type = "application/json"
            }
        };

        var jsonBody = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={apiKey}";
        
        var response = await _httpClient.PostAsync(url, content);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Gemini API Error ({response.StatusCode}): {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        
        using var jsonDoc = JsonDocument.Parse(responseJson);
        var textResult = jsonDoc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        // Increment quota only if not using custom key
        if (!usingCustomKey)
        {
            if (usage == null)
            {
                usage = new AiUsage
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Date = today,
                    RequestsCount = 1
                };
                _context.AiUsages.Add(usage);
            }
            else
            {
                usage.RequestsCount++;
                _context.AiUsages.Update(usage);
            }

            await _context.SaveChangesAsync(default);
        }

        return textResult ?? "{}";
    }

    public async Task<string> ParseLinkedInProfileAsync(string profileText, string userId)
    {
        var today = DateTime.UtcNow.Date;
        AiUsage? usage = null;
        var userSettings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        var apiKey = userSettings?.AiApiKey;
        var usingCustomKey = !string.IsNullOrEmpty(apiKey);
        
        if (!usingCustomKey)
        {
            apiKey = _settings.GeminiApiKey;
            if (string.IsNullOrEmpty(apiKey))
                throw new InvalidOperationException("Gemini API Key is not configured.");

            usage = await _context.AiUsages.FirstOrDefaultAsync(u => u.UserId == userId && u.Date == today);
            if (usage != null && usage.RequestsCount >= _settings.MaxRequestsPerDay)
                throw new Exception("AI quota exceeded for today.");
        }

        var prompt = $"Voici un copier-coller (ou texte extrait d'un PDF) d'un profil LinkedIn. " +
                     $"Extrais les informations suivantes et retourne-les **uniquement** sous forme de JSON valide : " +
                     $"- 'firstName': Prénom\n" +
                     $"- 'lastName': Nom\n" +
                     $"- 'jobTitle': Le titre actuel ou recherché (ex: Software Engineer, Product Manager, etc.)\n" +
                     $"- 'experienceYears': Une estimation du nombre d'années d'expérience au total (nombre entier ou décimal)\n" +
                     $"- 'linkedInUrl': Si tu trouves l'URL du profil, sinon null\n" +
                     $"Ne renvoie rien d'autre que du JSON. Texte du profil :\n\n{profileText}";

        var requestBody = new { contents = new[] { new { parts = new[] { new { text = prompt } } } }, generationConfig = new { response_mime_type = "application/json" } };
        var jsonBody = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={apiKey}";
        var response = await _httpClient.PostAsync(url, content);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Gemini API Error ({response.StatusCode}): {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseJson);
        var textResult = jsonDoc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

        if (!usingCustomKey)
        {
            if (usage == null)
                _context.AiUsages.Add(new AiUsage { Id = Guid.NewGuid(), UserId = userId, Date = today, RequestsCount = 1 });
            else
            {
                usage.RequestsCount++;
                _context.AiUsages.Update(usage);
            }
            await _context.SaveChangesAsync(default);
        }

        return textResult ?? "{}";
    }
}
