using System.ComponentModel.DataAnnotations;

namespace LoanControlAPI.DTOs;

public class SanctionDto
{
    [Required(ErrorMessage = "Description is required")]
    [StringLength(200, MinimumLength = 5, ErrorMessage = "Description must be between 5 and 200 characters")]
    
    public string Description { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Finish date is required")]
    public DateTime FinishDate { get; set; }
    
    public int? LoanId { get; set; }
}