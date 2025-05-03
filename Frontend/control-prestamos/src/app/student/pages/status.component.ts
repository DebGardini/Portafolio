import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../admin/components/header.component';
import { ActivatedRoute } from '@angular/router';
import { PrestamoService } from '../../admin/services/prestamo.service';

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
              this.countdown = this.studentData.tiempoRestante;
            }
          },
          (error) => {
            console.error('Error fetching student data:', error);
          }
        );
      }
    });
  }
}
