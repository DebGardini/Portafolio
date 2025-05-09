using LoanControlAPI.Models;

namespace LoanControlAPI.Interfaces;

public interface INotebookService
{
    Task<List<Notebook>> GetAllNotebooksAsync();
    Task<List<Notebook>> GetAvailableNotebooksAsync();
}