import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrestamoService } from '../admin/services/prestamo.service';
import { AuthService } from '../admin/services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../admin/components/header.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, MatSnackBarModule]
})
export class HomeComponent {
  adminLoginForm: FormGroup;
  studentSearchForm: FormGroup;
  isLoading = false;
  loginError = '';
  studentData: any = null;
  showAdminLogin = false; 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private prestamoService: PrestamoService,
    private authService: AuthService,
    private http: HttpClient,
    private snackBar: MatSnackBar 
  ) {
    this.adminLoginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.studentSearchForm = this.fb.group({
      rut: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}(-[0-9kK])?$/)]]
    });
    
    // Verificar si hay un mensaje de redirección
    const redirectReason = sessionStorage.getItem('auth_redirect_reason');
    if (redirectReason) {
      this.showMessage(redirectReason);
      sessionStorage.removeItem('auth_redirect_reason');
      this.showAdminLogin = true; // Mostrar automáticamente el formulario de login
    }
  }

  toggleAdminLogin() {
    this.showAdminLogin = !this.showAdminLogin;
    this.loginError = ''; // Limpiar errores anteriores
  }

  loginAsAdmin() {
    if (this.adminLoginForm.invalid) {
      this.showMessage('Por favor complete todos los campos correctamente');
      return;
    }
    
    this.isLoading = true;
    this.loginError = '';
    
    const { username, password } = this.adminLoginForm.value;
    
    this.authService.login(username, password).subscribe(
      success => {
        this.isLoading = false;
        if (success) {
          this.router.navigate(['/admin']);
          this.showMessage('Inicio de sesión exitoso');
        } else {
          this.loginError = 'Credenciales incorrectas. Por favor intente nuevamente.';
        }
      },
      error => {
        this.isLoading = false;
        this.loginError = 'Error al conectar con el servidor. Por favor intente más tarde.';
        console.error('Error de autenticación:', error);
      }
    );
  }

  searchStudent() {
    if (this.studentSearchForm.invalid) {
      this.showMessage('Por favor ingrese un RUT válido');
      return;
    }
    
    const rut = this.studentSearchForm.value.rut;
    // Redirección corregida a la ruta /estudiante con el parámetro rut
    this.router.navigate(['/estudiante'], { queryParams: { rut } });
  }
  
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}