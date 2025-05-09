import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router'; // Importar Router para navegación
import { PrestamoService } from '../../services/prestamo.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule } from '@angular/forms';

interface Notebook {
  $id?: string;
  id: number;
  brand: string;
  model: string;
  serialNumber: string;
  available: boolean;
  loans: any[] | null;
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  searchForm: FormGroup;
  enrolForm: FormGroup;
  prestamoForm: FormGroup;

  alumno: any = null;
  alumnoEncontrado: boolean = false;
  alumnoExistente: boolean = false;
  prestamoBloqueado: boolean = false;
  notebooksDisponibles: Notebook[] = [];
  isLoading = false;
  busquedaRealizada = false;

  constructor(
    private fb: FormBuilder,
    private prestamoService: PrestamoService,
    private snackBar: MatSnackBar,
    private router: Router // Inyectar Router para navegación
  ) {
    this.searchForm = this.fb.group({
      rut: ['', [Validators.required, Validators.pattern((/^[0-9]{7,8}$/))]]
    });

    this.enrolForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      rut: [{ value: '', disabled: true }, Validators.required],
      dv: ['', Validators.required],
      campus: ['', Validators.required],
      career: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.prestamoForm = this.fb.group({
      notebookId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarNotebooksDisponibles();
  }

  buscarAlumno(): void {
    if (this.searchForm.invalid) {
      this.snackBar.open('Por favor ingrese un RUT válido', 'Cerrar', { duration: 3000 });
      return;
    }

    const rut = this.searchForm.value.rut;
    this.isLoading = true;
    
    // Primero verificamos directamente si tiene préstamos activos
    this.prestamoService.verificarPrestamosActivos(rut).subscribe(
      (tienePrestamos) => {
        if (tienePrestamos && tienePrestamos.hasPrestamos) {
          // Ya sabemos que tiene préstamos, bloqueamos de inmediato
          this.busquedaRealizada = true;
          this.isLoading = false;
          this.prestamoBloqueado = true;
          
          // Ahora buscamos el alumno para mostrar su información
          this.prestamoService.buscarAlumnoPorRut(rut).subscribe(
            (alumno) => {
              if (alumno) {
                this.alumno = alumno;
                this.alumnoEncontrado = true;
                this.alumnoExistente = false; // No permitimos continuar
                
                const nombreCompleto = alumno.name && alumno.lastname ? 
                  `${alumno.name} ${alumno.lastname}` : 
                  (alumno.nombre || 'Estudiante');
                
                const tipoMensaje = tienePrestamos.isExpired ? 
                  'tiene un préstamo pendiente por devolver' : 
                  'ya tiene un préstamo activo';
                
                this.snackBar.open(`⚠️ IMPORTANTE: ${nombreCompleto} ${tipoMensaje}. No puede solicitar otro préstamo.`, 
                  'Entendido', { duration: 8000 });
              }
            }
          );
          return; // Terminamos aquí, no continuamos con el flujo normal
        } else {
          // No tiene préstamos activos, continuamos con el flujo normal
          this.continuarBusquedaSinPrestamos(rut);
        }
      },
      (error) => {
        console.error('Error verificando préstamos activos:', error);
        // Por precaución, continuamos con el flujo normal pero con advertencia en consola
        this.continuarBusquedaSinPrestamos(rut);
      }
    );
  }
  
  // Función auxiliar para continuar con el flujo cuando no hay préstamos activos
  private continuarBusquedaSinPrestamos(rut: string): void {
    this.prestamoService.buscarAlumnoPorRut(rut).subscribe(
      (alumno) => {
        this.busquedaRealizada = true;
        if (alumno) {
          this.alumno = alumno;
          this.alumnoEncontrado = true;
          
          // Verificación de préstamos activos y sanciones
          this.prestamoService.getEstadoCompletoAlumno(rut).subscribe(
            (estadoAlumno) => {
              if (estadoAlumno) {
                // Verificar directamente si el alumno está bloqueado, sin depender de las fechas de las sanciones
                if (alumno.blocked === true) {
                  this.alumnoExistente = false;
                  this.prestamoBloqueado = true;
                  
                  const mensaje = `ADVERTENCIA: ${alumno.name} ${alumno.lastname} está bloqueado. No puede solicitar préstamos.`;
                  this.snackBar.open(mensaje, 'Entendido', { duration: 8000 });
                  this.isLoading = false;
                  return;
                }

                // Si el alumno no está bloqueado, resetear la bandera
                this.prestamoBloqueado = false;
                
                // Verificar si tiene préstamos activos (segunda verificación)
                if (estadoAlumno.estadoPrestamo === 'Activo' || estadoAlumno.estadoPrestamo === 'Pendiente') {
                  this.alumnoExistente = false;
                  this.prestamoBloqueado = true;
                  
                  const mensaje = estadoAlumno.estadoPrestamo === 'Pendiente' ? 
                    `ADVERTENCIA: ${alumno.name} ${alumno.lastname} tiene un préstamo pendiente por devolver. No puede solicitar otro préstamo.` :
                    `ADVERTENCIA: ${alumno.name} ${alumno.lastname} ya tiene un préstamo activo. No puede solicitar otro préstamo.`;
                  
                  this.snackBar.open(mensaje, 'Entendido', { duration: 8000 });
                  this.isLoading = false;
                  return;
                }
                
                // El alumno está disponible para préstamo
                this.alumnoExistente = true;
                this.prestamoBloqueado = false;
                
                const nombreCompleto = alumno.name && alumno.lastname ? 
                  `${alumno.name} ${alumno.lastname}` : 
                  (alumno.nombre || 'Estudiante');
                this.snackBar.open(`Alumno ${nombreCompleto} encontrado`, 'Cerrar', { duration: 3000 });
              } else {
                // Error al obtener el estado del alumno
                this.alumnoExistente = false;
                this.prestamoBloqueado = true;
                
                this.snackBar.open(`Error al verificar el estado del alumno. Por seguridad, no se permite continuar.`, 
                  'Entendido', { duration: 5000 });
              }
              this.isLoading = false;
            },
            (error) => {
              console.error('Error al obtener estado completo del alumno:', error);
              this.alumnoExistente = false;
              this.prestamoBloqueado = true;
              
              this.snackBar.open(`Error al verificar el estado del alumno. Por seguridad, no se permite continuar.`, 
                'Entendido', { duration: 5000 });
              this.isLoading = false;
            }
          );
        } else {
          this.alumno = null;
          this.alumnoEncontrado = false;
          this.alumnoExistente = false;
          this.prestamoBloqueado = false;
          this.enrolForm.patchValue({ rut });
          this.enrolForm.get('rut')?.enable();
          this.snackBar.open('Alumno no encontrado. Complete el registro.', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      },
      (error) => {
        if (error.status === 404) {
          this.busquedaRealizada = true;
          this.alumno = null;
          this.alumnoEncontrado = false;
          this.alumnoExistente = false;
          this.prestamoBloqueado = false;
          this.enrolForm.patchValue({ rut });
          this.enrolForm.get('rut')?.enable();
          this.snackBar.open('Alumno no encontrado. Complete el registro.', 'Cerrar', { duration: 3000 });
        } else {
          console.error('Error al buscar alumno:', error);
          this.snackBar.open('Error al buscar el alumno. Intente nuevamente.', 'Cerrar', { duration: 3000 });
        }
        this.isLoading = false;
      }
    );
  }

  enrolarAlumno(): void {
    if (this.enrolForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const alumnoData = {
      name: this.enrolForm.value.name,
      lastname: this.enrolForm.value.lastname,
      rut: this.enrolForm.value.rut,
      dv: this.enrolForm.value.dv,
      campus: this.enrolForm.value.campus,
      career: this.enrolForm.value.career,
      phone: this.enrolForm.value.phone,
      email: this.enrolForm.value.email
    };
    this.prestamoService.registrarAlumno(alumnoData).subscribe(
      (nuevoAlumno) => {
        this.alumno = nuevoAlumno;
        this.alumnoEncontrado = true;
        this.alumnoExistente = true;
        this.snackBar.open('Alumno registrado con éxito', 'Cerrar', { duration: 3000 });
      },
      (error) => {
        console.error('Error al registrar alumno:', error);
        this.snackBar.open('Error al registrar el alumno', 'Cerrar', { duration: 3000 });
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  realizarPrestamo(): void {
    // Verificar si el préstamo está bloqueado
    if (this.prestamoBloqueado) {
      this.snackBar.open('No es posible realizar el préstamo. El alumno ya tiene un préstamo activo o pendiente.', 'Entendido', { duration: 5000 });
      return;
    }
    
    if (this.prestamoForm.invalid || !this.alumno) {
      this.snackBar.open('Por favor seleccione un notebook', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const notebookId = parseInt(this.prestamoForm.value.notebookId);
    
    // Asegurarnos que el RUT sea numérico para enviar al servidor
    const studentRut = parseInt(String(this.alumno.rut).replace(/\D/g, ''));
    
    // Corregir formato del objeto para que coincida con lo que espera la API
    const solicitudData = {
      NotebookId: notebookId,  // Primera letra mayúscula
      StudentRut: studentRut,  // Primera letra mayúscula
      BeginDate: new Date().toISOString(),  // Primera letra mayúscula
      LoanState: 0  // Primera letra mayúscula, corresponde a préstamo activo
    };

    console.log('Enviando datos de préstamo:', solicitudData);

    this.prestamoService.registrarPrestamo(solicitudData).subscribe(
      (response) => {
        console.log('Préstamo registrado exitosamente:', response);
        this.snackBar.open('Préstamo realizado con éxito', 'Cerrar', { duration: 3000 });
        
        // Recargar la lista de notebooks disponibles
        this.cargarNotebooksDisponibles();
        this.resetForms();
        this.isLoading = false; // Añadido: desactivar indicador de carga después de éxito

        // Redirigir al dashboard después de realizar el préstamo
        this.router.navigate(['/admin']);
      },
      (error) => {
        console.error('Error al realizar el préstamo:', error);
        this.snackBar.open('Error al realizar el préstamo: ' + (error.error?.message || 'Verifique los datos'), 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    );
  }

  cargarNotebooksDisponibles(): void {
    this.prestamoService.getNotebooksDisponibles().subscribe(
      (notebooks) => {
        this.notebooksDisponibles = notebooks;
      },
      (error) => {
        console.error('Error al cargar notebooks disponibles:', error);
        this.snackBar.open('Error al cargar notebooks disponibles', 'Cerrar', { duration: 3000 });
      }
    );
  }

  resetForms(): void {
    this.searchForm.reset();
    this.enrolForm.reset();
    this.prestamoForm.reset();
    this.alumno = null;
    this.alumnoEncontrado = false;
    this.alumnoExistente = false;
    this.prestamoBloqueado = false;
    this.busquedaRealizada = false;
  }

  cancelar(): void {
    this.resetForms();
  }

  // Función para formatear fecha en formato DD-MMM-AAAA
  private formatearFecha(fecha: Date): string {
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    
    return `${dia}-${mes}-${anio}`;
  }
}