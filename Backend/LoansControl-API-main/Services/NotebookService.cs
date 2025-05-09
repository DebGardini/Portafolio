using LoanControlAPI.Data;
using LoanControlAPI.Interfaces;
using LoanControlAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LoanControlAPI.Services;

public class NotebookService : INotebookService
{
    private readonly ApplicationDbContext _context;
    public NotebookService(ApplicationDbContext context)
    {
        _context = context;
    }
    public Task<List<Notebook>> GetAllNotebooksAsync()
    {
        return _context.Notebooks.ToListAsync();
    }

    public Task<List<Notebook>> GetAvailableNotebooksAsync()
    {
        return _context.Notebooks.Where(c => c.Available == true).ToListAsync();
    }
}