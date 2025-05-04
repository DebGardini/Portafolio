import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResumenService } from '../../services/resumen.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { catchError, finalize, of, forkJoin, interval, Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReplacePipe } from '../../pipes/replace.pipe';

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, CommonModule, MatTableModule, MatIconModule, ReplacePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  prestamosActivos: number = 0;
  prestamosVencidos: number = 0;
  prestamosFinalizados: number = 0;
  historialSolicitudes: any[] = [];
  notebooksList: Notebook[] = [];
  notebooksDisponiblesCount: number = 0;
  notebooksTotalesCount: number = 0;
  isLoading: boolean = false;
  error: string | null = null;
  private timerSubscription: Subscription | null = null;
  
  // Nombres de meses en español
  private meses: string[] = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];

  constructor(private resumenService: ResumenService) {}

  ngOnInit(): void {
    this.loadResumenData();
    this.loadPrestamosActivos();
    this.loadHistorialSolicitudes();
    this.loadPrestamosFinalizados();
    this.loadNotebooksTotales();
  }
  
  ngOnDestroy(): void {
    // Cancelar la suscripción al temporizador cuando el componente se destruye
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // Método para cargar todos los datos del dashboard
  loadResumenData(): void {
    this.isLoading = true;

    this.resumenService.getPrestamosVencidos()
      .pipe(
        catchError(error => {
          console.error('Error al cargar préstamos vencidos:', error);
          this.error = 'Error al cargar préstamos vencidos';
          return of(0);
        })
      )
      .subscribe(data => {
        this.prestamosVencidos = data;
      });

    // Eliminamos la llamada duplicada a getHistorialSolicitudes aquí
    // Esta llamada ahora solo se hace en loadHistorialSolicitudes()

    this.resumenService.getNotebooksDisponibles()
      .pipe(
        catchError(error => {
          console.error('Error al cargar la cantidad de notebooks disponibles:', error);
          this.error = 'Error al cargar la cantidad de notebooks disponibles';
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(data => {
        console.log('Processed notebooks data:', data);
        this.notebooksList = data;
        this.notebooksDisponiblesCount = data.length;
        console.log('Cantidad de notebooks disponibles:', this.notebooksDisponiblesCount);
      });
  }

  loadPrestamosActivos(): void {
    this.resumenService.getPrestamosActivos()
      .pipe(
        catchError(error => {
          console.error('Error al cargar préstamos activos:', error);
          this.error = 'Error al cargar préstamos activos';
          return of(0);
        })
      )
      .subscribe(data => {
        this.prestamosActivos = data;
      });
  }

  loadHistorialSolicitudes(): void {
    this.resumenService.getHistorialSolicitudes()
      .pipe(
        catchError(error => {
          console.error('Error al cargar el historial de solicitudes:', error);
          this.error = 'Error al cargar el historial de solicitudes';
          return of([]);
        })
      )
      .subscribe(data => {
        // Ordenamos el historial por fecha de préstamo (más reciente primero)
        this.historialSolicitudes = this.sortByDate(data);
        console.log('Historial de solicitudes con nombres:', this.historialSolicitudes);
        
        // Iniciar el temporizador para los préstamos activos
        this.startTimer();
      });
  }
  
  // Cargar préstamos finalizados
  loadPrestamosFinalizados(): void {
    this.resumenService.getPrestamosFinalizados()
      .pipe(
        catchError(error => {
          console.error('Error al cargar préstamos finalizados:', error);
          this.error = 'Error al cargar préstamos finalizados';
          return of(0);
        })
      )
      .subscribe(data => {
        this.prestamosFinalizados = data;
      });
  }

  // Cargar notebooks totales
  loadNotebooksTotales(): void {
    this.resumenService.getAllNotebooks()
      .pipe(
        catchError(error => {
          console.error('Error al cargar notebooks totales:', error);
          this.error = 'Error al cargar notebooks totales';
          return of([]);
        })
      )
      .subscribe(data => {
        this.notebooksTotalesCount = data.length;
      });
  }
  
  // Método para ordenar el historial por fecha (más reciente primero)
  sortByDate(solicitudes: any[]): any[] {
    return [...solicitudes].sort((a, b) => {
      const dateA = new Date(a.fechaPrestamo).getTime();
      const dateB = new Date(b.fechaPrestamo).getTime();
      return dateB - dateA; // Orden descendente (B-A para más reciente primero)
    });
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
    
    this.historialSolicitudes.forEach(solicitud => {
      if (solicitud.estado === 'Activo') {
        const startDate = new Date(solicitud.fechaPrestamo);
        const endTime = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 horas desde el inicio
        const timeLeft = endTime.getTime() - now.getTime();
        
        // Verificar si el tiempo ya expiró
        if (timeLeft <= 0) {
          solicitud.isExpired = true;
          solicitud.tiempoRestante = 'Tiempo vencido';
        } else {
          solicitud.isExpired = false;
          
          // Calcular horas, minutos y segundos restantes
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
          const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);
          
          // Formato con ceros a la izquierda para mejor visualización
          const hoursStr = hoursLeft.toString().padStart(2, '0');
          const minutesStr = minutesLeft.toString().padStart(2, '0');
          const secondsStr = secondsLeft.toString().padStart(2, '0');
          
          solicitud.tiempoRestante = `${hoursStr}:${minutesStr}:${secondsStr}`;
        }
      }
    });
  }
}