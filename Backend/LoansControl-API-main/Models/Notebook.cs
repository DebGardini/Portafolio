namespace LoanControlAPI.Models;

public class Notebook
{
    public int Id { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public bool Available { get; set; } = true;
    public List<Loan>? Loans { get; set; }
}