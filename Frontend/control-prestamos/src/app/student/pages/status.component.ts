import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../admin/components/header.component';
import { ActivatedRoute } from '@angular/router';
import { PrestamoService } from '../../admin/services/prestamo.service';
import { interval, Subscription } from 'rxjs';
import { ReplacePipe } from '../../admin/pipes/replace.pipe';

@Component({
  selector: 'app-status',
  standalone: true, // Añadir esta propiedad si falta
  templateUrl: './status.component.html',
  styleUrl: './status.component.css',
  imports: [CommonModule, HeaderComponent, ReplacePipe],
})
export class StatusComponent implements OnInit, OnDestroy {
  studentData: any = null;
  countdown: string = '';
  isExpired: boolean = false;
  private timerSubscription: Subscription | null = null;
  
  // Nombres de meses en español para formateo de fechas
  private meses: string[] = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];

  constructor(private route: ActivatedRoute, private prestamoService: PrestamoService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const rut = params['rut'];
      if (rut) {
        this.loadStudentData(rut);
      }
    });
  }
  
  ngOnDestroy(): void {
    // Cancelar la suscripción al temporizador cuando el componente se destruye
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
  
  loadStudentData(rut: string): void {
    this.prestamoService.getEstadoCompletoAlumno(rut).subscribe({
      next: (data) => {
        console.log("Datos completos del estudiante recibidos:", data);
        if (!data) {
          console.error('No se recibieron datos del estudiante');
          return;
        }
        
        this.studentData = data;
        
        // Formatear las fechas si existen
        if (this.studentData?.fechaPrestamo) {
          this.studentData.fechaPrestamoFormateada = this.formatDate(this.studentData.fechaPrestamo);
        }
        
        if (this.studentData?.fechaDevolucion) {
          this.studentData.fechaDevolucionFormateada = this.formatDate(this.studentData.fechaDevolucion);
        }
        
        // Si hay un préstamo activo o pendiente, iniciar el temporizador
        if (this.studentData?.fechaPrestamo && 
            (this.studentData?.estadoPrestamo === 'Activo' || this.studentData?.estadoPrestamo === 'Pendiente')) {
          this.startTimer();
        }
      },
      error: (error) => {
        console.error('Error fetching student data:', error);
      }
    });
  }
  
  // Iniciar temporizador para actualizar el tiempo restante
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
  
  // Actualizar el tiempo restante para el préstamo
  updateRemainingTime(): void {
    if (!this.studentData || !this.studentData.fechaPrestamo) {
      return;
    }
    
    const now = new Date();
    // Para la fecha de préstamo, usamos directamente la fecha no formateada
    const startDate = new Date(this.studentData.fechaPrestamo);
    const endTime = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 horas desde el inicio
    const timeLeft = endTime.getTime() - now.getTime();
    
    // Verificar si el tiempo ya expiró
    if (timeLeft <= 0) {
      this.isExpired = true;
      this.countdown = 'Tiempo vencido';
      this.studentData.estadoPrestamo = 'Pendiente'; // Actualizar el estado a pendiente
    } else {
      this.isExpired = false;
      
      // Calcular horas, minutos y segundos restantes
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);
      
      // Formato con ceros a la izquierda para mejor visualización
      const hoursStr = hoursLeft.toString().padStart(2, '0');
      const minutesStr = minutesLeft.toString().padStart(2, '0');
      const secondsStr = secondsLeft.toString().padStart(2, '0');
      
      this.countdown = `${hoursStr}:${minutesStr}:${secondsStr}`;
    }
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
      
      return ` El ${day}-${month}-${year} a las ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return dateString;
    }
  }
}
