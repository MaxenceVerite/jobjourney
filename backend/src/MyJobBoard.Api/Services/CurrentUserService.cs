using System.Security.Claims;
using MyJobBoard.Application.Common.Interfaces;

namespace MyJobBoard.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? UserEmail => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);
}
