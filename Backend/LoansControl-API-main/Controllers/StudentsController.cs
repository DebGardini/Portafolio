using LoanControlAPI.Data;
using LoanControlAPI.DTOs;
using LoanControlAPI.Interfaces;
using LoanControlAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace LoanControlAPI.Controllers;

[ApiController]
[Route("api/students")]
public class StudentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IStudentService _studentService;
    
    public StudentsController(ApplicationDbContext context, IStudentService studentService)
    {
        _context = context;
        _studentService = studentService;
    }
    
    // POST - api/students
    // Endpoint to create a new student
    [HttpPost("new")]
    public async Task<ActionResult<Student>> CreateStudent(CreateStudentDto studentDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { Message = "Model isn't valid", Errors = ModelState });
        try
        {
            var student = new Student
            {
                Rut = studentDto.Rut,
                Dv = studentDto.Dv,
                Name = studentDto.Name,
                Lastname = studentDto.Lastname,
                Email = studentDto.Email,
                Phone = studentDto.Phone,
                Campus = studentDto.Campus,
                Career = studentDto.Career,
                Blocked = false
            };
            var createdStudent = await _studentService.CreateStudentAsync(student);
            return CreatedAtAction(nameof(GetStudent), new { id = createdStudent.Id }, createdStudent);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error when creating student", Details = ex.Message });
        }
    }
    
    // GET: api/students/{id}
    // Endpoint to get a student by its ID
    [HttpGet("id/{id}")]
    public async Task<ActionResult<Student>> GetStudent(int id)
    {
        var student = await _studentService.GetStudentByIdAsync(id);

        if (student == null)
            return NotFound();
        
        // To-do: Usar AutoMapper para mapear el objeto Student a StudentDto
        var studentDto = new StudentDto
        {
            Id = student.Id,
            Rut = student.Rut,
            Dv = student.Dv,
            Name = student.Name,
            Lastname = student.Lastname,
            Email = student.Email,
            Phone = student.Phone,
            Campus = student.Campus,
            Career = student.Career,
            Blocked = student.Blocked
        };

        return Ok(studentDto);
    }
    
    // GET: api/students/{rut}
    // Endpoint to get a student by its RUT
    [HttpGet("rut/{rut}")]
    public async Task<ActionResult<Student>> GetStudentByRut(int rut)
    {
        var student = await _studentService.GetStudentByRutAsync(rut);

        if (student == null)
            return NotFound();
        
        // To-do: Usar AutoMapper para mapear el objeto Student a StudentDto
        var studentDto = new StudentDto
        {
            Id = student.Id,
            Rut = student.Rut,
            Dv = student.Dv,
            Name = student.Name,
            Lastname = student.Lastname,
            Email = student.Email,
            Phone = student.Phone,
            Campus = student.Campus,
            Career = student.Career,
            Blocked = student.Blocked
        };
        return Ok(studentDto);
    }
}