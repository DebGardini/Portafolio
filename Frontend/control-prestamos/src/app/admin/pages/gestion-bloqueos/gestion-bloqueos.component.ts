import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReplacePipe } from '../../pipes/replace.pipe';
import { SanctionService } from '../../services/sanction.service';

// Interfaz para los datos de bloqueo
interface BlockedStudent {
  studentName: string;
  studentRut: number;
  studentDv: string;
  description: string;
  startDate: string | null;
  finishDate: string | null;
  [key: string]: any; // Para otras propiedades
}

@Component({
  selector: 'app-gestion-bloqueos',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ReplacePipe
  ],
  templateUrl: './gestion-bloqueos.component.html',
  styleUrl: './gestion-bloqueos.component.css'
})
export class GestionBloqueosComponent implements OnInit {
  // Propiedades para el manejo de datos y estado
  rawData: BlockedStudent[] = [];
  filteredData: BlockedStudent[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  
  // Nombres de meses en español para formateo de fechas
  private meses: string[] = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];

  constructor(
    private sanctionService: SanctionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBlockedStudents();
  }

  // Cargar la lista de alumnos bloqueados
  loadBlockedStudents(): void {
    this.isLoading = true;
    
    // Obtener los alumnos bloqueados con sus sanciones
    this.sanctionService.getBlockedStudents().subscribe({
      next: (data: BlockedStudent[]) => {
        console.log('Alumnos bloqueados con sus sanciones:', data);
        
        // Filtrar para mostrar solo el último bloqueo por alumno
        const uniqueBlockedStudents = data.reduce((acc, current) => {
          const existing = acc.find(student => student.studentRut === current.studentRut);
          if (!existing || new Date(existing.finishDate || 0) < new Date(current.finishDate || 0)) {
            return acc.filter(student => student.studentRut !== current.studentRut).concat(current);
          }
          return acc;
        }, [] as BlockedStudent[]);
        
        this.rawData = uniqueBlockedStudents;
        this.filteredData = [...uniqueBlockedStudents];
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar alumnos bloqueados:', error);
        this.isLoading = false;
        this.showSnackbar('Error al cargar los alumnos bloqueados');
      }
    });
  }

  // Quitar bloqueo a un alumno
  quitarBloqueo(alumno: BlockedStudent): void {
    if (!alumno || !alumno.studentRut) {
      this.showSnackbar('Error: No se pudo identificar al alumno');
      return;
    }
    
    this.isLoading = true;
    
    // Limpiar el RUT (eliminar guiones y puntos)
    const rutNumerico = String(alumno.studentRut).replace(/\D/g, '');
    
    this.sanctionService.removeBlock(rutNumerico).subscribe({
      next: (response: any) => {
        console.log('Bloqueo eliminado:', response);
        // Recargar la lista de alumnos bloqueados
        this.loadBlockedStudents();
        this.showSnackbar(`Se ha quitado el bloqueo a ${alumno.studentName || 'alumno'}`);
      },
      error: (error: any) => {
        console.error('Error al quitar bloqueo:', error);
        this.isLoading = false;
        this.showSnackbar('Error al quitar el bloqueo');
      }
    });
  }

  // Filtrar la lista de alumnos bloqueados
  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredData = [...this.rawData];
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase();
    
    this.filteredData = this.rawData.filter(alumno => 
      (alumno.studentName && alumno.studentName.toLowerCase().includes(searchTermLower)) ||
      (alumno.studentRut && String(alumno.studentRut).includes(searchTermLower))
    );
  }

  // Formatear fechas como DD-MES-AAAA y hora como HH:MM:SS
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = this.meses[date.getMonth()];
      const year = date.getFullYear();
      
      // Formatear hora (HH:MM:SS)
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `Fecha: ${day}-${month}-${year}\nHora: ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return dateString;
    }
  }

  // Mostrar mensaje emergente (snackbar)
  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
