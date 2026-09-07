namespace MyJobBoard.Infrastructure.Services;

public class AiSettings
{
    public string GeminiApiKey { get; set; } = string.Empty;
    public string GroqApiKey { get; set; } = string.Empty;
    public int MaxRequestsPerDay { get; set; } = 10;
}
