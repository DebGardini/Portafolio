import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PrestamoService } from '../admin/services/prestamo.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "../admin/components/header.component";
import { AuthService } from '../admin/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent]
})
export class HomeComponent {
  adminLoginForm: FormGroup;
  studentSearchForm: FormGroup;
  isLoading = false;
  studentData: any = null;
  showAdminLogin = false; 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private prestamoService: PrestamoService,
    private authService: AuthService,
    private http: HttpClient 
  ) {
    this.adminLoginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.studentSearchForm = this.fb.group({
      rut: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]]
    });
  }

  toggleAdminLogin() {
    this.showAdminLogin = !this.showAdminLogin;
  }

  loginAsAdmin() {
    if (this.adminLoginForm.invalid) {
      alert('Por favor complete todos los campos.');
      return;
    }

  /*  const { username, password } = this.adminLoginForm.value;
    this.http.post(`${environment.apiUrl}/account/login`, { username, password }).subscribe(
      (response: any) => {
        this.authService.setToken(response.token);
        this.router.navigate(['/admin']);
      },
      (error) => {
        console.error('Error al iniciar sesión:', error);
        alert('Credenciales incorrectas.');
      );
        }*/
      }

  searchStudent() {
    console.log('Método searchStudent ejecutado'); 

    if (this.studentSearchForm.invalid) {
      alert('Por favor ingrese un RUT válido.');
      console.log('Formulario inválido:', this.studentSearchForm.value); 
      return;
    }

    const rut = this.studentSearchForm.value.rut;
    console.log('RUT ingresado:', rut); 

    this.isLoading = true;

    this.prestamoService.buscarAlumnoPorRut(rut).subscribe(
      data => {
        console.log('Respuesta del servicio:', data); 
        if (data) {
          this.router.navigate(['/estudiante'], { queryParams: { rut: data.rut } }).then(() => {
            console.log('Redirección exitosa al componente status'); 
          }).catch(err => {
            console.error('Error al redirigir al componente status:', err); 
          });
        } else {
          alert('Alumno no encontrado.');
        }
        this.isLoading = false;
      },
      error => {
        console.error('Error al buscar alumno:', error); 
        alert('Alumno no encontrado.');
        this.isLoading = false;
      }
    );
  }
}