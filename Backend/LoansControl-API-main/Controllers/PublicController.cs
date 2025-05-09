using LoanControlAPI.Interfaces;
using LoanControlAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace LoanControlAPI.Controllers;

[Route ("api/public")]
[ApiController]
public class PublicController : ControllerBase
{
    // This controller is for public endpoints that do not require authentication
    private readonly ILoanService _loanService;
    private readonly ISanctionService _sanctionService;
    public PublicController(ILoanService loanService, ISanctionService sanctionService)
    {
        _loanService = loanService;
        _sanctionService = sanctionService;
    }
   
    // GET: api/public/{rut}
    // Endpoint to get all active loans by the student's RUT
    [HttpGet("rut/")]
    public async Task<IActionResult> GetActiveLoansByRut([FromQuery] int rut)
    {
        try
        {
            var loans = await _loanService.GetActiveLoansByRutAsync(rut);
            if (loans == null || !loans.Any())
                return NotFound(new { Message = $"No active loans found for student with RUT: {rut}" });
            
            return Ok(loans);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error when getting active loans", Details = ex.Message });
        }
    }
}