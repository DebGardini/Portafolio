using LoanControlAPI.DTOs;
using LoanControlAPI.Models;

namespace LoanControlAPI.Interfaces;

public interface ISanctionService
{
    Task<Sanction> ApplySanctionAsync(int rut, SanctionDto sanctionDto);
    Task<List<Sanction>> GetActiveSanctionsByRutAsync(int rut);
    Task<bool> HasActiveSanctionsAsync(int rut);
    Task<Sanction> RemoveSanctionAsync(int rut, SanctionRemovalDto removalDto);
    Task<List<Student>> GetBlockedStudentsAsync();
}