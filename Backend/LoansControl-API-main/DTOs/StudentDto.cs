using System.ComponentModel.DataAnnotations;

namespace LoanControlAPI.DTOs;

public class StudentDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "RUT is required")]
    [Range(1000000, 99999999, ErrorMessage = "RUT must be between 1,000,000 and 99,999,999")]
    public int Rut { get; set; }

    [Required(ErrorMessage = "Verification digit is required")]
    [RegularExpression("[0-9Kk]", ErrorMessage = "Verification digit must be a number or K")]
    public char Dv { get; set; }

    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters")]
    public string Name { get; set; }

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Last name must be between 2 and 100 characters")]
    public string Lastname { get; set; }

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; }

    [Required(ErrorMessage = "Phone is required")]
    [RegularExpression(@"^[0-9]{9}$", ErrorMessage = "Phone must contain exactly 9 digits, without prefix")]
    public string Phone { get; set; }

    [StringLength(100, ErrorMessage = "Campus cannot exceed 100 characters")]
    public string Campus { get; set; }

    [StringLength(100, ErrorMessage = "Career cannot exceed 100 characters")]
    public string Career { get; set; }

    public bool? Blocked { get; set; }
}