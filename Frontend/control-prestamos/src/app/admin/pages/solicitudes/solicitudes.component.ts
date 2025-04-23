import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PrestamoService } from '../../services/prestamo.service';
import { Observable } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

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
  ],
  standalone: true,
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css'
})
export class SolicitudesComponent {
  // Formularios
  searchForm!: FormGroup;
  enrolForm!: FormGroup;
  prestamoForm!: FormGroup;

  // Variables para gestionar los datos
  alumnoExistente = false;
  notebooksDisponibles: any[] = [];  // Lista de notebooks disponibles
  alumno: any;  // Información del alumno

  constructor(private fb: FormBuilder, private prestamoService: PrestamoService) {
    // Formulario para buscar alumno
    this.searchForm = this.fb.group({
      rut: ['', Validators.required]
    });

    // Formulario para enrolar alumno
    this.enrolForm = this.fb.group({
      nombre: ['', Validators.required],
      rut: ['', Validators.required],
      sede: ['', Validators.required],
      carrera: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    // Formulario para realizar el préstamo
    this.prestamoForm = this.fb.group({
      notebookId: ['', Validators.required]
    });
  }

  // Método para buscar al alumno por RUT
  buscarAlumno() {
    const rut = this.searchForm.value.rut;
    console.log(`Buscando alumno con RUT: ${rut}`);
    this.alumnoExistente = true;  // Simula que el alumno existe
    this.alumno = { rut, nombre: 'Juan Pérez' };  // Ejemplo de datos de alumno

    // Cargar notebooks disponibles (simulación por ahora)
    this.notebooksDisponibles = [
      { id: 1, nombre: 'Notebook Dell' },
      { id: 2, nombre: 'Notebook HP' },
      { id: 3, nombre: 'Notebook Lenovo' }
    ];
  }

  // Método para enrolar un alumno
  enrolarAlumno() {
    if (this.enrolForm.valid) {
      console.log('Enrolando alumno:', this.enrolForm.value);
      // Llamar al servicio para enrolar (aún no implementado el backend)
    }
  }

  // Método para realizar el préstamo de un notebook
  realizarPrestamo() {
    if (this.prestamoForm.valid) {
      const rutAlumno = this.alumno.rut;
      const notebookId = this.prestamoForm.value.notebookId;

      console.log(`Realizando préstamo para el alumno ${rutAlumno} con notebook ID: ${notebookId}`);

      // Llamada al servicio para registrar el préstamo
      this.prestamoService.realizarPrestamo(rutAlumno, notebookId)
.subscribe(response => {
        console.log('Préstamo realizado con éxito', response);
      }, error => {
        console.error('Error al realizar el préstamo', error);
      });
    }
  }
}
