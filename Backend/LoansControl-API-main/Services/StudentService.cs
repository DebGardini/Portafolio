using LoanControlAPI.Data;
using LoanControlAPI.Interfaces;
using LoanControlAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LoanControlAPI.Services;

public class StudentService : IStudentService
{
    private readonly ApplicationDbContext _dbContext;
    public StudentService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Student> CreateStudentAsync(Student student)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var existingStudent = await _dbContext.Students.FirstOrDefaultAsync(s => s.Rut == student.Rut);
            if (existingStudent != null)
                throw new Exception("Ya existe un estudiante con este RUT");
            _dbContext.Students.Add(student);
            await _dbContext.SaveChangesAsync();
            
            await transaction.CommitAsync();
            return student;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }                
    }

    public async Task<Student> GetStudentByIdAsync(int id)
    {
        var student = await _dbContext.Students.FirstOrDefaultAsync(s => s.Id == id);
        if (student == null)
            throw new Exception("Student doesn't exist");
        return student;
    }

    public async Task<Student> GetStudentByRutAsync(int rut)
    {
        var student = await _dbContext.Students.FirstOrDefaultAsync(s => s.Rut == rut);
        if (student == null)
            throw new Exception("No existe un estudiante con este RUT");
        return student;
    }
}