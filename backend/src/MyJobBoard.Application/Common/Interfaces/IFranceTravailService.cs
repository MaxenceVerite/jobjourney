using System.Threading.Tasks;
using MyJobBoard.Application.Common.Models.FranceTravail;

namespace MyJobBoard.Application.Common.Interfaces;

public interface IFranceTravailService
{
    Task<FranceTravailSearchResponse?> SearchOffersAsync(FranceTravailSearchParams searchParams);
}
