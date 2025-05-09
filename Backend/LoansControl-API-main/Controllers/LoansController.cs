using LoanControlAPI.Data;
using LoanControlAPI.DTOs;
using LoanControlAPI.Enums;
using LoanControlAPI.Interfaces;
using LoanControlAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LoanControlAPI.Controllers;

[ApiController]
[Route("api/loans")]
public class LoansController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILoanService _loanService;
    
    public LoansController(ApplicationDbContext context, ILoanService loanService)
    {
        _context = context;
        _loanService = loanService;
    }
    
    // POST - api/loans
    // Endpoint to create a new loan
    [HttpPost("new")]
    public async Task<ActionResult<Loan>> CreateLoan(NewLoanDto newLoanDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { Message = "Invalid loan data", Errors = ModelState });

        try
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Rut == newLoanDto.StudentRut);
            if (student == null)
                return NotFound(new { Message = $"Student {newLoanDto.StudentRut} doesn't exist" });

            if (student.Blocked == true)
                return BadRequest(new { Message = $"Student {newLoanDto.StudentRut} is blocked" });

            var notebook = await _context.Notebooks.FindAsync(newLoanDto.NotebookId);
            if (notebook == null)
                return NotFound(new { Message = $"Notebook: {newLoanDto.NotebookId}, doesn't" });
            var loan = new Loan
            {
                NotebookId = newLoanDto.NotebookId,
                StudentRut = newLoanDto.StudentRut,
                Student = student,
                BeginDate = DateTime.Now,
                EndDate = null,
                LoanState = LoanState.Activo
            };

            var createdLoan = await _loanService.CreateLoanAsync(loan);
            return CreatedAtAction(nameof(GetLoan), new { id = createdLoan.Id }, createdLoan);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error when creating loan", Details = ex.Message });
        }
    }
    
    // GET: api/loans/{id}
    // Endpoint to get a loan by its ID
    [HttpGet("{id}")]
    public async Task<ActionResult<Loan>> GetLoan(int id)
    {
        var loan = await _context.Loans.FindAsync(id);
        if (loan == null)
            return NotFound();
        return loan;
    }
    
    // GET: api/loans/{rut}
    // Endpoint to get all loans by the Student's RUT
    [HttpGet()]
    public async Task<IActionResult> GetLoansByRut([FromQuery]int Rut)
    {
        var loansList = await _loanService.GetLoansByRutAsync(Rut);
        if (loansList.Count() == 0) return NotFound();
        return Ok(loansList);
    }
    
    // GET: api/loans/search/{rut}
    // Endpoint to get all active loans by the Student's RUT
    [HttpGet("search")]
    public async Task<IActionResult> GetActiveLoansByRut([FromQuery]int Rut)
    {
        var activeLoansList = await _loanService.GetActiveLoansByRutAsync(Rut);
        if (activeLoansList.Count() == 0) return NotFound();
        return Ok(activeLoansList);
    }
    
    // GET: api/loans/active/all
    // Endpoint to get all active loans
    [HttpGet("active/all")]
    public async Task<IActionResult> GetAllActiveLoans()
    {
        var activeLoansList = await _loanService.GetAllActiveLoansAsync();
        if (activeLoansList.Count() == 0) return NotFound();
        return Ok(activeLoansList);
    }
    
    // GET: api/loans/pending/all
    // Endpoint to get all pending loans
    [HttpGet("pending/all")]
    public async Task<IActionResult> GetAllPendingLoans()
    {
        var pendingLoansList = await _loanService.GetAllPendingLoansAsync();
        if (pendingLoansList.Count() == 0) return NotFound();
        return Ok(pendingLoansList);
    }
    
    // GET: api/loans/returned/all
    // Endpoint to get all returned loans
    [HttpGet("returned/all")]
    public async Task<IActionResult> GetAllReturnedLoans()
    {
        var returnedLoansList = await _loanService.GetAllReturnedLoansAsync();
        if (returnedLoansList.Count() == 0) return NotFound();
        return Ok(returnedLoansList);
    }
    
    // PUT: api/loans/modify/{id}
    // Endpoint to modify the state of a loan
    [HttpPut("modify/{rut}")]
    public async Task<IActionResult> ModifyLoanState(int rut, [FromBody] LoanState loanState)
    {
        if (!Enum.IsDefined(typeof(LoanState), loanState))
            return BadRequest(new { Message = "Invalid loan state: 0 = Active, 1 = Finalizado, 2 = Pendiente" });
        try
        {
            var modifiedLoan = await _loanService.ModifyLoanStateAsync(rut, loanState);
            return Ok(modifiedLoan);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error when updating loan state.", Details = ex.Message });
        }
    }
}