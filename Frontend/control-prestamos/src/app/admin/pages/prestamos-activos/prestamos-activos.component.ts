import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PrestamosActivosService } from './../../services/prestamos-activos.service';
import { ResumenService } from '../../services/resumen.service';
import { interval, Subscription } from 'rxjs';
import { ReplacePipe } from '../../pipes/replace.pipe';
import { BlockStudentDialogComponent } from '../../components/dialogs/block-student-dialog.component';

@Component({
  selector: 'app-prestamos-activos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatDialogModule,
    ReplacePipe
  ],
  templateUrl: './prestamos-activos.component.html',
  styleUrls: ['./prestamos-activos.component.css']
})
export class PrestamosActivosComponent implements OnInit, OnDestroy {
  searchTerm = '';
  prestamosActivos: any[] = [];
  filteredData: any[] = [];
  sancionados: string[] = [];
  isLoading = false;
  
  private timerSubscription: Subscription | null = null;
  
  // Nombres de meses en español
  private meses: string[] = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];

  constructor(
    private prestamosService: PrestamosActivosService,
    private resumenService: ResumenService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cargarPrestamosActivos();
  }
  
  ngOnDestroy(): void {
    // Cancelar la suscripción al temporizador cuando el componente se destruye
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
  
  cargarPrestamosActivos() {
    this.isLoading = true;
    
    this.resumenService.getHistorialSolicitudes().subscribe({
      next: (solicitudes) => {
        // Filtrar solo los préstamos activos (no finalizados)
        this.prestamosActivos = solicitudes.filter(solicitud => 
          solicitud.estado === 'Activo'
        );
        
        // Ordenar los préstamos por fecha de préstamo, del más reciente al más antiguo
        this.prestamosActivos.sort((a, b) => {
          const fechaA = new Date(a.fechaPrestamo).getTime();
          const fechaB = new Date(b.fechaPrestamo).getTime();
          return fechaB - fechaA; // Orden descendente (más reciente primero)
        });
        
        this.filteredData = [...this.prestamosActivos];
        this.isLoading = false;
        
        // Iniciar el temporizador para actualizar el tiempo restante
        this.startTimer();
        
        console.log('Préstamos activos cargados y ordenados:', this.prestamosActivos);
      },
      error: (error) => {
        console.error('Error al obtener préstamos activos:', error);
        this.snackBar.open('Error al cargar los préstamos activos', 'Cerrar', { duration: 3000 });
        this.prestamosActivos = [];
        this.filteredData = [];
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    
    // Si el campo de búsqueda está vacío, mostrar todos los préstamos
    if (!term) {
      this.filteredData = [...this.prestamosActivos];
      return;
    }
    
    // Buscar coincidencias por nombre o RUT (guardado en studentId)
    this.filteredData = this.prestamosActivos.filter(item => {
      const nameMatch = item.student?.toLowerCase()?.includes(term) ?? false;
      const rutMatch = item.studentId?.toString()?.includes(term) ?? false;
      
      return nameMatch || rutMatch;
    });
    
    // Los resultados ya estarán ordenados por fecha porque prestamosActivos ya está ordenado
    // y filteredData es un subconjunto de prestamosActivos
  }
  
  // Formatear fechas como DD-MES-AAAA y hora como HH:MM:SS
  formatDate(dateString: string): string {
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
  
  // Iniciar temporizador para actualizar el tiempo restante de los préstamos
  startTimer(): void {
    // Cancelar cualquier temporizador existente
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    // Actualizar tiempo restante inmediatamente
    this.updateRemainingTime();
    
    // Configurar intervalo para actualizar cada segundo (1000ms)
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateRemainingTime();
    });
  }
  
  // Actualizar el tiempo restante para cada préstamo activo
  updateRemainingTime(): void {
    const now = new Date();
    
    this.prestamosActivos.forEach(prestamo => {
      if (prestamo.estado === 'Activo') {
        const startDate = new Date(prestamo.fechaPrestamo);
        const endTime = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 horas
        const timeLeft = endTime.getTime() - now.getTime();
        
        // Verificar si el tiempo ya expiró
        if (timeLeft <= 0) {
          prestamo.isExpired = true;
          prestamo.tiempoRestante = 'Tiempo vencido';
        } else {
          prestamo.isExpired = false;
          
          // Calcular horas, minutos y segundos restantes
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
          const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);
          
          // Formato con ceros a la izquierda para mejor visualización
          const hoursStr = hoursLeft.toString().padStart(2, '0');
          const minutesStr = minutesLeft.toString().padStart(2, '0');
          const secondsStr = secondsLeft.toString().padStart(2, '0');
          
          prestamo.tiempoRestante = `${hoursStr}:${minutesStr}:${secondsStr}`;
        }
      }
    });
    
    // Solo actualizamos la vista si no hay una búsqueda activa
    if (!this.searchTerm) {
      this.filteredData = [...this.prestamosActivos];
    }
  }

  finalizarPrestamo(element: any) {
    if (confirm(`¿Seguro que deseas finalizar el préstamo de ${element.student}?`)) {
      this.isLoading = true;
      this.prestamosService.finalizarPrestamo(element.studentId).subscribe({
        next: () => {
          this.snackBar.open(`El préstamo de ${element.student} ha sido finalizado con éxito`, 'Cerrar', { duration: 3000 });
          this.cargarPrestamosActivos();
        },
        error: (error) => {
          console.error('Error al finalizar el préstamo:', error);
          this.snackBar.open('Error al finalizar el préstamo', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  eliminarPrestamo(element: any) {
    if (confirm(`¿Seguro que deseas eliminar el préstamo de ${element.student}?`)) {
      this.isLoading = true;
      this.prestamosService.eliminarPrestamo(element.studentId).subscribe({
        next: () => {
          this.snackBar.open(`El préstamo de ${element.student} ha sido eliminado`, 'Cerrar', { duration: 3000 });
          this.cargarPrestamosActivos();
        },
        error: (error) => {
          console.error('Error al eliminar el préstamo:', error);
          this.snackBar.open('Error al eliminar el préstamo', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  bloquearAlumno(element: any) {
    // Primero confirmamos que el usuario desea bloquear al alumno
    if (confirm(`¿Desea proceder a bloquear a ${element.student}? \nEste proceso finalizará el préstamo actual y aplicará una sanción.`)) {
      this.isLoading = true;
      
      // Primero finalizamos el préstamo para liberar el notebook
      this.prestamosService.finalizarPrestamo(element.studentId).subscribe({
        next: () => {
          // Una vez finalizado el préstamo, mostramos el diálogo para la sanción
          const dialogRef = this.dialog.open(BlockStudentDialogComponent, {
            width: '500px',
            data: {
              student: element.student,
              studentId: element.studentId,
              loanId: element.loanId // Si existe
            }
          });
          
          // Cuando se cierra el diálogo, procesamos la sanción
          dialogRef.afterClosed().subscribe(result => {
            this.isLoading = false;
            
            if (result) {
              this.isLoading = true;
              
              // Aplicar la sanción con los datos del diálogo
              this.prestamosService.aplicarSancion(element.studentId, {
                description: result.description,
                finishDate: result.finishDate,
                loanId: result.loanId
              }).subscribe({
                next: () => {
                  this.snackBar.open(`Sanción aplicada a ${element.student} correctamente`, 'Cerrar', { duration: 3000 });
                  this.sancionados.push(element.studentId);
                  this.isLoading = false;
                  this.cargarPrestamosActivos();
                },
                error: (error) => {
                  console.error('Error al aplicar la sanción:', error);
                  this.snackBar.open('Error al aplicar la sanción', 'Cerrar', { duration: 3000 });
                  this.isLoading = false;
                }
              });
            }
          });
        },
        error: (error) => {
          console.error('Error al finalizar el préstamo:', error);
          this.snackBar.open('Error al finalizar el préstamo, no se pudo bloquear al alumno', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }
}
