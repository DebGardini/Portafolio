using LoanControlAPI.Enums;

namespace LoanControlAPI.Models;

public class Loan
{
    public int Id { get; set; }
    
    public int NotebookId { get; set; }
    public Notebook Notebook { get; set; }

    public int StudentRut { get; set; }
    public Student Student { get; set; }
    
    public DateTime BeginDate { get; set; } = DateTime.Now;
    public DateTime? EndDate { get; set; }
    public LoanState LoanState { get; set; }
    
    public Sanction? Sanction { get; set; }
}
