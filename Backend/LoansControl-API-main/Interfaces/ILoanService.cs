using LoanControlAPI.Enums;
using LoanControlAPI.Models;

namespace LoanControlAPI.Interfaces;

public interface ILoanService
{
    Task<Loan> CreateLoanAsync(Loan loan);
    Task<List<Loan>> GetLoansByRutAsync(int Rut);
    Task<List<Loan>> GetActiveLoansByRutAsync(int Rut);
    Task<List<Loan>> GetAllActiveLoansAsync();
    Task<List<Loan>> GetAllPendingLoansAsync();
    Task<List<Loan>> GetAllReturnedLoansAsync();
    Task<Loan> ModifyLoanStateAsync(int id, LoanState loanState);
}