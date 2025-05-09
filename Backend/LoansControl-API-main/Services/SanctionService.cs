using LoanControlAPI.Data;
using LoanControlAPI.DTOs;
using LoanControlAPI.Interfaces;
using LoanControlAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LoanControlAPI.Services;

public class SanctionService : ISanctionService
{
    private readonly ApplicationDbContext _context;
    
    public SanctionService(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<Sanction> ApplySanctionAsync(int rut, SanctionDto sanctionDto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Rut == rut);
            if (student == null)
                return null;
                
            var sanction = new Sanction
            {
                StudentId = student.Id, 
                StudentRut = rut,
                Description = sanctionDto.Description,
                BeginDate = DateTime.Now,
                FinishDate = sanctionDto.FinishDate,
                LoanId = sanctionDto.LoanId
            };
            
            student.Blocked = true;
            
            _context.Sanctions.Add(sanction);
            await _context.SaveChangesAsync();
            
            await transaction.CommitAsync();
            return sanction;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<Sanction> RemoveSanctionAsync(int rut, SanctionRemovalDto removalDto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Rut == removalDto.StudentRut);
                
            if (student == null)
                return null;
                
            Sanction sanctionToReturn = null;
            
            if (removalDto.LoanId.HasValue)
            {
                // End specific sanction
                var sanction = await _context.Sanctions
                    .FirstOrDefaultAsync(s => s.StudentRut == removalDto.StudentRut &&
                                              s.LoanId == removalDto.LoanId &&
                                              s.FinishDate > DateTime.Now);
                                             
                if (sanction != null)
                {
                    sanction.FinishDate = DateTime.Now;
                    sanctionToReturn = sanction;
                }
            }
            else
            {
                // End all sanctions
                var sanctions = await _context.Sanctions
                    .Where(s => s.StudentRut == removalDto.StudentRut && 
                                s.FinishDate > DateTime.Now)
                    .ToListAsync();
                    
                foreach (var sanction in sanctions)
                {
                    sanction.FinishDate = DateTime.Now;
                }
                
                sanctionToReturn = sanctions.FirstOrDefault();
            }
            
            // Explicitly unblock if requested
            if (removalDto.UnblockStudent)
            {
                student.Blocked = false;
            }
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            return sanctionToReturn;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<Student>> GetBlockedStudentsAsync()
    {
        return await _context.Students
            .Where(s => s.Blocked == true)
            .ToListAsync();
    }

    public async Task<List<Sanction>> GetActiveSanctionsByRutAsync(int rut)
    {
        return await _context.Sanctions
            .Where(s => s.StudentRut == rut && s.FinishDate > DateTime.Now)
            .ToListAsync();
    }

    public async Task<bool> HasActiveSanctionsAsync(int rut)
    {
        return await _context.Sanctions
            .AnyAsync(s => s.StudentRut == rut && s.FinishDate > DateTime.Now);
    }
}