using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyJobBoard.Api.Services;
using MyJobBoard.Application.DTOs;

using Microsoft.AspNetCore.RateLimiting;

namespace MyJobBoard.Api.Controllers;

[ApiController]
[EnableRateLimiting("Auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        JwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        var email = request.GetEffectiveEmail();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "L'adresse email et le mot de passe sont requis." });
        }

        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            return BadRequest(new { error = "Un utilisateur avec cet email existe déjà." });
        }

        var user = new IdentityUser
        {
            UserName = email,
            Email = email,
            PhoneNumber = request.Tel
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Compte créé avec succès." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var email = request.GetEffectiveEmail();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Email et mot de passe requis." });
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            return Unauthorized(new { error = "Identifiants invalides." });
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            return Unauthorized(new { error = "Identifiants invalides." });
        }

        var tokens = _jwtTokenService.GenerateTokens(user);
        return Ok(tokens);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request, [FromServices] MyJobBoard.Infrastructure.Data.ApplicationDbContext dbContext)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { error = "Refresh token requis." });
        }

        var existingToken = dbContext.UserRefreshTokens.FirstOrDefault(t => t.Token == request.RefreshToken);
        if (existingToken == null || !existingToken.IsActive)
        {
            return Unauthorized(new { error = "Refresh token invalide ou expiré." });
        }

        var user = await _userManager.FindByIdAsync(existingToken.UserId);
        if (user == null)
        {
            return Unauthorized(new { error = "Session expirée." });
        }

        // Revoke the old token
        existingToken.Revoked = DateTime.UtcNow;
        
        var tokens = _jwtTokenService.GenerateTokens(user);

        // Save changes to database (including the revoked token)
        await dbContext.SaveChangesAsync();

        return Ok(tokens);
    }

    [HttpGet("checkSession")]
    [Authorize]
    public IActionResult CheckSession()
    {
        return Ok(new { status = "Active", user = User.Identity?.Name });
    }
}
