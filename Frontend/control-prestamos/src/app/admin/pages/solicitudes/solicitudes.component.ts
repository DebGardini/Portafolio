import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PrestamoService } from '../../services/prestamo.service';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-solicitudes',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatInputModule,
    MatSnackBarModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule
  ],
  standalone: true,
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css'
})
export class SolicitudesComponent implements OnInit {
  // Formularios
  searchForm!: FormGroup;
  enrolForm!: FormGroup;
  prestamoForm!: FormGroup;

  // Variables para gestionar los datos
  alumnoExistente = false;
  alumnoEncontrado = false;
  notebooksDisponibles: any[] = [];  // Lista de notebooks disponibles
  alumno: any;  // Información del alumno
  
  // Estados de UI
  isLoading = false;
  busquedaRealizada = false;

  constructor(
    private fb: FormBuilder, 
    private prestamoService: PrestamoService,
    private snackBar: MatSnackBar
  ) {
    this.initForms();
  }

  ngOnInit() {
    // Cargar datos iniciales si es necesario
    this.cargarNotebooksDisponibles();
  }

  private initForms() {
    // Formulario para buscar alumno
    this.searchForm = this.fb.group({
      rut: ['', [Validators.required, Validators.pattern(/^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]$/)]]
    });

    // Formulario para enrolar alumno
    this.enrolForm = this.fb.group({
      nombre: ['', Validators.required],
      rut: [{value: '', disabled: true}, Validators.required],
      sede: ['', Validators.required],
      carrera: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
    });

    // Formulario para realizar el préstamo
    this.prestamoForm = this.fb.group({
      notebookId: ['', Validators.required]
    });
  }

  // Método para buscar al alumno por RUT
  buscarAlumno() {
    if (this.searchForm.invalid) {
      this.snackBar.open('Por favor ingrese un RUT válido', 'Cerrar', { duration: 3000 });
      return;
    }

    const rut = this.searchForm.value.rut;
    this.isLoading = true;
    this.busquedaRealizada = true;

    this.prestamoService.buscarAlumnoPorRut(rut)
      .pipe(
        tap(alumno => {
          if (alumno) {
            // Alumno encontrado
            this.alumnoExistente = true;
            this.alumnoEncontrado = true;
            this.alumno = alumno;
            this.snackBar.open(`Alumno ${alumno.nombre} encontrado`, 'Cerrar', { duration: 3000 });
          } else {
            // Alumno no encontrado
            this.alumnoExistente = false;
            this.alumnoEncontrado = false;
            // Preparar formulario de enrolamiento con el RUT
            this.enrolForm.patchValue({ rut: rut });
            this.enrolForm.get('rut')?.enable();
            this.snackBar.open('Alumno no encontrado. Por favor complete el registro.', 'Cerrar', { duration: 3000 });
          }
        }),
        catchError(error => {
          console.error('Error al buscar alumno:', error);
          this.snackBar.open('Error al buscar el alumno', 'Cerrar', { duration: 3000 });
          this.alumnoExistente = false;
          this.alumnoEncontrado = false;
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  // Método para enrolar un alumno
  enrolarAlumno() {
    if (this.enrolForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const alumnoData = this.enrolForm.value;

    this.prestamoService.registrarAlumno(alumnoData)
      .pipe(
        tap(nuevoAlumno => {
          this.alumno = nuevoAlumno;
          this.alumnoExistente = true;
          this.alumnoEncontrado = true;
          this.snackBar.open('Alumno registrado con éxito', 'Cerrar', { duration: 3000 });
        }),
        catchError(error => {
          console.error('Error al registrar alumno:', error);
          this.snackBar.open('Error al registrar el alumno', 'Cerrar', { duration: 3000 });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  // Método para realizar el préstamo de un notebook
  realizarPrestamo() {
    if (this.prestamoForm.invalid || !this.alumno) {
      this.snackBar.open('Por favor seleccione un notebook', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const rutAlumno = this.alumno.rut;
    const notebookId = this.prestamoForm.value.notebookId;

    this.prestamoService.realizarPrestamo(rutAlumno, notebookId)
      .pipe(
        tap(response => {
          console.log('Préstamo realizado con éxito', response);
          this.snackBar.open('Préstamo realizado con éxito', 'Cerrar', { duration: 3000 });
          // Resetear los formularios
          this.resetForms();
        }),
        catchError(error => {
          console.error('Error al realizar el préstamo', error);
          this.snackBar.open('Error al realizar el préstamo', 'Cerrar', { duration: 3000 });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  // Método para cargar notebooks disponibles
  cargarNotebooksDisponibles() {
    this.prestamoService.getNotebooksDisponibles()
      .pipe(
        tap(notebooks => {
          this.notebooksDisponibles = notebooks;
        }),
        catchError(error => {
          console.error('Error al cargar notebooks disponibles:', error);
          this.snackBar.open('Error al cargar notebooks disponibles', 'Cerrar', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe();
  }

  // Método para resetear los formularios
  resetForms() {
    this.searchForm.reset();
    this.enrolForm.reset();
    this.prestamoForm.reset();
    this.alumnoExistente = false;
    this.alumnoEncontrado = false;
    this.busquedaRealizada = false;
  }

  // Cancelar operación
  cancelar() {
    this.resetForms();
  }
}