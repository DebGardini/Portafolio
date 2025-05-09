using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LoanControlAPI.Interfaces;
using LoanControlAPI.Models;
using Microsoft.IdentityModel.Tokens;

namespace LoanControlAPI.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly SymmetricSecurityKey _key;
    
    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        var signingKey = Environment.GetEnvironmentVariable("JWT_SIGNING_KEY");
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
    }
    
    public string CreateToken(AppUser user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.GivenName, user.UserName)
        };
        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        
        var issuer = _configuration["JWT:Issuer"]
            .Replace("%ADDRESS%", Environment.GetEnvironmentVariable("ADDRESS"));
        var audience = _configuration["JWT:Audience"]
            .Replace("%ADDRESS%", Environment.GetEnvironmentVariable("ADDRESS"));
        
        // Create token
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddDays(7),
            SigningCredentials = creds,
            Issuer = issuer,
            Audience = audience
        };
        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}