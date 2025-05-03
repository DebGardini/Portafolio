import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  notebooksDisponibles: Notebook[] = [];
  isLoading = false;
  busquedaRealizada = false;

  constructor(
    private fb: FormBuilder,
    private prestamoService: PrestamoService,
    private snackBar: MatSnackBar
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
    this.prestamoService.buscarAlumnoPorRut(rut).subscribe(
      (alumno) => {
        this.busquedaRealizada = true;
        if (alumno) {
          this.alumno = alumno;
          this.alumnoEncontrado = true;
          this.alumnoExistente = true;
          this.snackBar.open(`Alumno ${alumno.nombre} encontrado`, 'Cerrar', { duration: 3000 });
        } else {
          this.alumno = null;
          this.alumnoEncontrado = false;
          this.alumnoExistente = false;
          this.enrolForm.patchValue({ rut });
          this.enrolForm.get('rut')?.enable();
          this.snackBar.open('Alumno no encontrado. Complete el registro.', 'Cerrar', { duration: 3000 });
        }
      },
      (error) => {
        if (error.status === 404) {
          this.busquedaRealizada = true;
          this.alumno = null;
          this.alumnoEncontrado = false;
          this.alumnoExistente = false;
          this.enrolForm.patchValue({ rut });
          this.enrolForm.get('rut')?.enable();
          this.snackBar.open('Alumno no encontrado. Complete el registro.', 'Cerrar', { duration: 3000 });
        } else {
          console.error('Error al buscar alumno:', error);
          this.snackBar.open('Error al buscar el alumno. Intente nuevamente.', 'Cerrar', { duration: 3000 });
        }
        this.isLoading = false;
      },
      () => {
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
      rut: this.enrolForm.value.rut, // Enviar como string
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
    if (this.prestamoForm.invalid || !this.alumno) {
      this.snackBar.open('Por favor seleccione un notebook', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const solicitudData = {
      id: 0,
      notebookId: this.prestamoForm.value.notebookId,
      notebook: null,
      studentRut: this.alumno.rut,
      student: null,
      beginDate: new Date().toISOString(),
      endDate: null,
      loanState: 0,
      sanction: null
    };

    this.prestamoService.registrarPrestamo(solicitudData).subscribe(
      (response) => {
        this.snackBar.open('Préstamo realizado con éxito', 'Cerrar', { duration: 3000 });
        this.resetForms();
      },
      (error) => {
        console.error('Error al realizar el préstamo:', error);
        this.snackBar.open('Error al realizar el préstamo', 'Cerrar', { duration: 3000 });
      },
      () => {
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
    this.busquedaRealizada = false;
  }

  cancelar(): void {
    this.resetForms();
  }
}