using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using MyJobBoard.Application.DTOs;
using MyJobBoard.Domain.Entities;
using MyJobBoard.Infrastructure.Data;

namespace MyJobBoard.Api.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _dbContext;

    public JwtTokenService(IConfiguration configuration, ApplicationDbContext dbContext)
    {
        _configuration = configuration;
        _dbContext = dbContext;
    }

    public TokenResponseDto GenerateTokens(IdentityUser user)
    {
        var secretKey = _configuration["Jwt:Key"] ?? "super_secret_jwt_key_myjobboard_2024_secure_key_123456789";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = creds,
            Issuer = _configuration["Jwt:Issuer"] ?? "MyJobBoard",
            Audience = _configuration["Jwt:Audience"] ?? "MyJobBoardApp"
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var accessToken = tokenHandler.WriteToken(token);

        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        var userRefreshToken = new UserRefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow
        };

        _dbContext.UserRefreshTokens.Add(userRefreshToken);
        _dbContext.SaveChanges();

        return new TokenResponseDto
        {
            TokenType = "Bearer",
            AccessToken = accessToken,
            ExpiresIn = (int)TimeSpan.FromDays(7).TotalSeconds,
            RefreshToken = refreshToken
        };
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secretKey = _configuration["Jwt:Key"] ?? "super_secret_jwt_key_myjobboard_2024_secure_key_123456789";
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateLifetime = false // Here we want to read expired tokens to refresh
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }
            return principal;
        }
        catch
        {
            return null;
        }
    }
}
