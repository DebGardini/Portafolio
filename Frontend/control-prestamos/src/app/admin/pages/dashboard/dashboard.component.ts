import { Component, OnInit } from '@angular/core';
import { ResumenService } from '../../services/resumen.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';




@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, CommonModule, MatTableModule, 
            MatChipsModule, MatIconModule,],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  prestamosActivos: number = 0;
  prestamosVencidos: number = 0;
  historialSolicitudes: any[] = [];
  inventarioNotebooks: number = 0;

  constructor(private resumenService: ResumenService) {}

  ngOnInit(): void {
    this.loadResumenData();
  }

  // Método para cargar todos los datos del dashboard
  loadResumenData(): void {
    this.resumenService.getPrestamosActivos().subscribe((data) => {
      this.prestamosActivos = data;
    });

    this.resumenService.getPrestamosVencidos().subscribe((data) => {
      this.prestamosVencidos = data;
    });

    this.resumenService.getHistorialSolicitudes().subscribe((data) => {
      this.historialSolicitudes = data;
    });

    this.resumenService.getInventarioNotebooks().subscribe((data) => {
      this.inventarioNotebooks = data;
    });
  }
}