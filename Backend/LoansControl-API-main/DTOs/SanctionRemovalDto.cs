namespace LoanControlAPI.DTOs;

public class SanctionRemovalDto
{
    public int StudentRut { get; set; }
    public int? LoanId { get; set; }
    public bool UnblockStudent { get; set; } = true;
}