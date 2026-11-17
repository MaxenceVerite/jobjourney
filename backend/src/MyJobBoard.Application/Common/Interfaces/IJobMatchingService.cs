using System.Threading.Tasks;
using MyJobBoard.Application.Common.Models.Matching;

namespace MyJobBoard.Application.Common.Interfaces;

public interface IJobMatchingService
{
    Task<SmartMatchSearchResponse> FindSmartMatchesAsync(string userId, SmartMatchSearchRequest request);
}

