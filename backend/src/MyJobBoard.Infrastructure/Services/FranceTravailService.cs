using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Application.Common.Models.FranceTravail;

namespace MyJobBoard.Infrastructure.Services;

public class FranceTravailService : IFranceTravailService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;

    public FranceTravailService(HttpClient httpClient, IMemoryCache cache, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _cache = cache;
        _configuration = configuration;
    }

    private async Task<string> GetAccessTokenAsync(string clientId, string clientSecret)
    {
        var cacheKey = $"FranceTravailToken_{clientId}";
        
        if (_cache.TryGetValue(cacheKey, out string cachedToken))
        {
            return cachedToken;
        }

        var tokenUrl = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
        
        var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl);
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            {"grant_type", "client_credentials"},
            {"client_id", clientId},
            {"client_secret", clientSecret},
            {"scope", "api_offresdemploiv2 o2dsoffre"}
        });

        var response = await _httpClient.SendAsync(request);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Erreur d'authentification France Travail : {error}");
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var token = doc.RootElement.GetProperty("access_token").GetString();
        var expiresIn = doc.RootElement.GetProperty("expires_in").GetInt32();

        if (token != null)
        {
            _cache.Set(cacheKey, token, TimeSpan.FromSeconds(expiresIn - 60)); // Keep a 60s margin
            return token;
        }
        
        throw new Exception("Impossible de parser le token France Travail.");
    }

    public async Task<FranceTravailSearchResponse?> SearchOffersAsync(FranceTravailSearchParams searchParams)
    {
        var clientId = _configuration["FranceTravailSettings:ClientId"];
        var clientSecret = _configuration["FranceTravailSettings:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException("Les identifiants France Travail ne sont pas configurés sur le serveur.");
        }

        var token = await GetAccessTokenAsync(clientId, clientSecret);

        var query = new List<string>();
        if (!string.IsNullOrEmpty(searchParams.Keyword))
        {
            query.Add($"motsCles={Uri.EscapeDataString(searchParams.Keyword)}");
        }
        
        if (!string.IsNullOrEmpty(searchParams.Commune))
        {
            query.Add($"commune={Uri.EscapeDataString(searchParams.Commune)}");
            if (searchParams.Rayon.HasValue)
            {
                query.Add($"distance={searchParams.Rayon.Value}"); // The API actually uses "distance" parameter for rayon!
            }
        }
        
        if (!string.IsNullOrEmpty(searchParams.TypeContrat))
        {
            query.Add($"typeContrat={Uri.EscapeDataString(searchParams.TypeContrat)}");
        }
        
        if (!string.IsNullOrEmpty(searchParams.Experience))
        {
            query.Add($"experience={Uri.EscapeDataString(searchParams.Experience)}");
        }
        
        if (searchParams.PublishDate.HasValue)
        {
            query.Add($"publieeDepuis={searchParams.PublishDate.Value}");
        }

        if (!string.IsNullOrEmpty(searchParams.EducationLevel))
        {
            query.Add($"qualification={Uri.EscapeDataString(searchParams.EducationLevel)}"); // 0: Non cadre, 9: Cadre, etc.
        }

        if (searchParams.RemoteMode == "true")
        {
            // FT API doesn't have a clear remote parameter in standard search, so we append to keyword
            if (string.IsNullOrEmpty(searchParams.Keyword)) {
                query.Add($"motsCles={Uri.EscapeDataString("télétravail")}");
            } else {
                // If it already had motsCles, it was added above. We need to modify it.
                // It's easier to just pass it in motsCles directly before. But since query is a list:
                query.RemoveAll(q => q.StartsWith("motsCles="));
                query.Add($"motsCles={Uri.EscapeDataString(searchParams.Keyword + " télétravail")}");
            }
        }
        
        query.Add($"range={searchParams.RangeStart}-{searchParams.RangeEnd}");

        var url = $"https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?{string.Join("&", query)}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {token}");
        request.Headers.Add("Accept", "application/json");

        var response = await _httpClient.SendAsync(request);
        
        if (response.StatusCode == System.Net.HttpStatusCode.NoContent || response.StatusCode == System.Net.HttpStatusCode.PartialContent)
        {
            // API returns 204 or 206 based on results range
        }
        else if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Erreur API France Travail ({response.StatusCode}): {error}");
        }

        if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
        {
            return new FranceTravailSearchResponse();
        }

        var jsonString = await response.Content.ReadAsStringAsync();
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<FranceTravailSearchResponse>(jsonString, options);
    }
}
