using LoanControlAPI.Models;

namespace LoanControlAPI.Interfaces;

public interface ITokenService
{
    string CreateToken(AppUser user);
}