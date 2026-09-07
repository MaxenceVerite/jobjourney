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

public class GroqAiService : IAiService
{
    private readonly HttpClient _httpClient;
    private readonly AiSettings _settings;
    private readonly IApplicationDbContext _context;

    public GroqAiService(HttpClient httpClient, IOptions<AiSettings> settings, IApplicationDbContext context)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _context = context;
    }

    public async Task<string> GenerateCompanySummaryAsync(string companyName, string userId)
    {
        var apiKey = _settings.GroqApiKey;
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("Groq API Key is not configured.");
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
            model = "qwen/qwen3.8-27b", // Fast model, good for extraction
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            response_format = new { type = "json_object" }
        };

        var jsonBody = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = content;

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Groq API Error ({response.StatusCode}): {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseJson);
        var textResult = jsonDoc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return textResult ?? "{}";
    }

    public async Task<string> ParseLinkedInProfileAsync(string profileText, string userId)
    {
        var apiKey = _settings.GroqApiKey;
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("Groq API Key is not configured.");
        }

        var prompt = $"Voici un copier-coller (ou texte extrait d'un PDF) d'un profil LinkedIn. " +
                     $"Extrais les informations suivantes et retourne-les **uniquement** sous forme de JSON valide : " +
                     $"- 'firstName': Prénom\n" +
                     $"- 'lastName': Nom\n" +
                     $"- 'jobTitle': Le titre actuel ou recherché (ex: Software Engineer, Product Manager, etc.)\n" +
                     $"- 'experienceYears': Une estimation du nombre d'années d'expérience au total (nombre entier ou décimal)\n" +
                     $"- 'linkedInUrl': Si tu trouves l'URL du profil, sinon null\n" +
                     $"Ne renvoie rien d'autre que du JSON. Texte du profil :\n\n{profileText}";

        var requestBody = new
        {
            model = "qwen/qwen3.8-27b",
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            response_format = new { type = "json_object" }
        };

        var jsonBody = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = content;

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Groq API Error ({response.StatusCode}): {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseJson);
        var textResult = jsonDoc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return textResult ?? "{}";
    }
}
