import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../admin/components/header.component';
import { ActivatedRoute } from '@angular/router';
import { PrestamoService } from '../../admin/services/prestamo.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css'],
  imports: [CommonModule, HeaderComponent],
})
export class StatusComponent implements OnInit {
  studentData: any = null;
  countdown: string = '';

  constructor(private route: ActivatedRoute, private prestamoService: PrestamoService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const rut = params['rut'];
      if (rut) {
        this.prestamoService.buscarAlumnoPorRut(rut).subscribe(
          (data) => {
            this.studentData = data;
            if (this.studentData?.tiempoRestante) {
              this.startCountdown(this.studentData.tiempoRestante);
            }
          },
          (error) => {
            console.error('Error fetching student data:', error);
          }
        );
      }
    });
  }

  private startCountdown(endTime: string): void {
    const endDate = new Date(endTime).getTime();
    interval(1000).subscribe(() => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance > 0) {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        this.countdown = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        this.countdown = 'Tiempo expirado';
        this.studentData.estadoPrestamo = 'Pendiente';
      }
    });
  }
}
