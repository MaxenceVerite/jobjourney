using System.Threading.Tasks;

namespace MyJobBoard.Application.Common.Interfaces;

public interface IAiService
{
    Task<string> GenerateCompanySummaryAsync(string companyName, string userId);
    Task<string> ParseLinkedInProfileAsync(string profileText, string userId);
}
