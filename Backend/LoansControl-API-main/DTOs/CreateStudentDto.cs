using System.ComponentModel.DataAnnotations;

namespace LoanControlAPI.DTOs;

public class CreateStudentDto
{
    [Required(ErrorMessage = "El RUT es obligatorio")]
    [Range(1000000, 99999999, ErrorMessage = "El RUT debe estar entre 1.000.000 y 99.999.999")]
    public int Rut { get; set; }

    [Required(ErrorMessage = "El dígito verificador es obligatorio")]
    [RegularExpression("[0-9Kk]", ErrorMessage = "El DV debe ser un número o la letra K")]
    public char Dv { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(50, ErrorMessage = "El nombre no puede tener más de 50 caracteres")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [StringLength(50, ErrorMessage = "El apellido no puede tener más de 50 caracteres")]
    public string Lastname { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato de correo electrónico no es válido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio")]
    [Phone(ErrorMessage = "El formato de teléfono no es válido")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campus es obligatorio")]
    public string Campus { get; set; } = string.Empty;

    [Required(ErrorMessage = "La carrera es obligatoria")]
    public string Career { get; set; } = string.Empty;
}