using LoanControlAPI.Data;
using LoanControlAPI.Enums;
using LoanControlAPI.Interfaces;
using LoanControlAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LoanControlAPI.Services;

public class LoanService : ILoanService
{
    private readonly ApplicationDbContext _context;

    public LoanService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Loan> CreateLoanAsync(Loan loan)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var notebook = await _context.Notebooks.FindAsync(loan.NotebookId);
            if (notebook == null)
                throw new Exception("Notebook not found");
            if (!notebook.Available)
                throw new Exception("Notebook is not available");
            notebook.Available = false;
            if (loan.LoanState == 0)
                loan.LoanState = LoanState.Activo;
            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return loan;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<Loan>> GetLoansByRutAsync(int Rut)
    {
        return await _context.Loans.Where(l => l.StudentRut == Rut).ToListAsync();
    }
    
    public async Task<List<Loan>> GetActiveLoansByRutAsync(int Rut)
    {
        return await _context.Loans
            .Where(l => l.StudentRut == Rut && l.LoanState == LoanState.Activo)
            .ToListAsync();
    }

    public async Task<List<Loan>> GetAllActiveLoansAsync()
    {
        return await _context.Loans
            .Where(l => l.LoanState == LoanState.Activo)
            .ToListAsync();
    }

    public async Task<List<Loan>> GetAllPendingLoansAsync()
    {
        return await _context.Loans
            .Where(l => l.LoanState == LoanState.Pendiente)
            .ToListAsync();
    }

    public async Task<List<Loan>> GetAllReturnedLoansAsync()
    {
        return await _context.Loans
            .Where(l => l.LoanState == LoanState.Finalizado)
            .ToListAsync();
    }

    public async Task<Loan> ModifyLoanStateAsync(int rut, LoanState loanState)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var loan = await _context.Loans
                .Include(l => l.Notebook)
                .Where(l => l.StudentRut == rut && l.LoanState == LoanState.Activo)
                .OrderByDescending(l => l.BeginDate)
                .FirstOrDefaultAsync();

            if (loan == null)
                throw new Exception($"No se encontró un préstamo activo para el estudiante con RUT {rut}");

            loan.LoanState = loanState;
            if (loanState == LoanState.Finalizado)
            {
                loan.EndDate = DateTime.Now;
                if (loan.Notebook != null)
                {
                    loan.Notebook.Available = true;
                }
            }
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return loan;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}