using LoanControlAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanControlAPI.Controllers;

[Route("api/notebooks")]
[ApiController]
public class NotebooksController : ControllerBase
{
    private readonly INotebookService _notebookService;
    public NotebooksController(INotebookService notebookService)
    {
        _notebookService = notebookService;
    }
    
    // GET: api/notebooks/all
    // Endpoint to get all notebooks
    [HttpGet("all")]
    public async Task<IActionResult> GetAllNotebooks()
    {
        try
        {
            var notebooks = await _notebookService.GetAllNotebooksAsync();
            return Ok(notebooks);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error when getting notebooks", Details = ex.Message });
        }
    }
    
    // GET: api/notebooks/available
    // Endpoint to get all available notebooks
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableNotebooks()
    {
        try
        {
            var notebooks = await _notebookService.GetAvailableNotebooksAsync();
            return Ok(notebooks);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error when getting available notebooks", Details = ex.Message });
        }
    }
}