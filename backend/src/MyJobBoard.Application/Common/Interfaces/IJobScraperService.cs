using MyJobBoard.Application.DTOs;

namespace MyJobBoard.Application.Common.Interfaces;

public interface IJobScraperService
{
    Task<JobImportResultDto> ScrapeJobAsync(JobImportRequestDto request, string userId, CancellationToken cancellationToken = default);
}
