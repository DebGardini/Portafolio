using LoanControlAPI.Models;

namespace LoanControlAPI.Interfaces;

public interface IStudentService
{
    Task<Student> CreateStudentAsync(Student student);
    Task<Student> GetStudentByIdAsync(int id);
    Task<Student> GetStudentByRutAsync(int rut);
}