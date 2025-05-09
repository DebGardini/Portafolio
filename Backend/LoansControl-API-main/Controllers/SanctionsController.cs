using LoanControlAPI.DTOs;
using LoanControlAPI.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LoanControlAPI.Controllers;

[Route("api/sanctions")]
[ApiController]
public class SanctionsController : ControllerBase
{
    private readonly ISanctionService _sanctionService;
    public SanctionsController(ISanctionService sanctionService)
    {
        _sanctionService = sanctionService;
    }
    
    // PUT: api/sanctions/apply/{rut}
    // Endpoint to apply a sanction to a student
    [HttpPut("apply/{rut}")]
    public async Task<IActionResult> ApplySanction(int rut, [FromBody] SanctionDto sanctionDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { Message = "Invalid sanction data", Errors = ModelState });

        try
        {
            var result = await _sanctionService.ApplySanctionAsync(rut, sanctionDto);
            if (result == null)
                return NotFound(new { Message = $"Student with RUT: {rut} not found" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error when applying sanction", Details = ex.Message });
        }
    }
    
    // PUT: api/sanctions/remove/{rut}
    // Endpoint to remove a sanction from a student
    [HttpPut("remove/{rut}")]
    public async Task<IActionResult> RemoveSanction(int rut, [FromBody] SanctionRemovalDto sanctionRemovalDtoDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { Message = "Invalid sanction data", Errors = ModelState });

        try
        {
            var result = await _sanctionService.RemoveSanctionAsync(rut, sanctionRemovalDtoDto);
            if (result == null)
                return NotFound(new { Message = $"Student with RUT: {rut} not found" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error when removing sanction", Details = ex.Message });
        }
    }
    
    // GET: api/sanctions/active/{rut}
    // Endpoint to get all active sanctions for a student
    [HttpGet("active/{rut}")]
    public async Task<IActionResult> GetActiveSanctions(int rut)
    {
        try
        {
            var sanctions = await _sanctionService.GetActiveSanctionsByRutAsync(rut);
            return Ok(sanctions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error retrieving active sanctions", Details = ex.Message });
        }
    }
    
    // GET: api/sanctions/check/{rut}
    // Endpoint to check if a student has active sanctions
    [HttpGet("check/{rut}")]
    public async Task<IActionResult> CheckActiveSanctions(int rut)
    {
        try
        {
            var hasActiveSanctions = await _sanctionService.HasActiveSanctionsAsync(rut);
            return Ok(new { HasActiveSanctions = hasActiveSanctions });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error checking active sanctions", Details = ex.Message });
        }
    }
    
    // GET: api/sanctions/blocked
    // Endpoint to get all blocked students
    [HttpGet("blocked")]
    public async Task<IActionResult> GetBlockedStudents()
    {
        try
        {
            var blockedStudents = await _sanctionService.GetBlockedStudentsAsync();
            return Ok(blockedStudents);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error retrieving blocked students", Details = ex.Message });
        }
    }
}