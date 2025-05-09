namespace LoanControlAPI.Models;

// Student model
// RUT is stored as an integer, and the verification digit (DV) is stored as a char.
public class Student
{
    public int Id { get; set; }
    public int Rut { get; set; }
    public char Dv { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Lastname { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Campus { get; set; } = string.Empty;
    public string Career { get; set; } = string.Empty;
    public bool? Blocked { get; set; }
}