namespace LoanControlAPI.Models;

public class Sanction
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int StudentRut { get; set; }
    public Student Student { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime BeginDate { get; set; } = DateTime.Now;
    public DateTime FinishDate { get; set; }
    public int? LoanId { get; set; }
    public Loan? Loan { get; set; }
}