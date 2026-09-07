using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyJobBoard.Application.Common.Interfaces;
using MyJobBoard.Application.Common.Models.FranceTravail;

namespace MyJobBoard.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class JobBoardController : ControllerBase
{
    private readonly IFranceTravailService _franceTravailService;
    private readonly ICurrentUserService _currentUserService;

    public JobBoardController(IFranceTravailService franceTravailService, ICurrentUserService currentUserService)
    {
        _franceTravailService = franceTravailService;
        _currentUserService = currentUserService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchOffers([FromQuery] FranceTravailSearchParams searchParams)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        searchParams.UserId = userId;
        
        try
        {
            var result = await _franceTravailService.SearchOffersAsync(searchParams);
            return Ok(result);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = "Erreur lors de la recherche des offres.", details = ex.Message });
        }
    }
}
