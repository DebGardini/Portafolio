import { Component, OnInit } from '@angular/core';
import { ResumenService } from '../../services/resumen.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { catchError, finalize, of } from 'rxjs';


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
  notebooksDisponibles: number = 0;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private resumenService: ResumenService) {}

  ngOnInit(): void {
    this.loadResumenData();
  }

  // Método para cargar todos los datos del dashboard
  loadResumenData(): void {
    this.isLoading = true;

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

    this.resumenService.getHistorialSolicitudes().subscribe((data) => {
      this.historialSolicitudes = data;
    });

    this.resumenService.getNotebooksDisponibles()
      .pipe(
        catchError(error => {
          console.error('Error al cargar la cantidad de notebooks disponibles:', error);
          this.error = 'Error al cargar la cantidad de notebooks disponibles';
          return of(0);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(data => {
        this.notebooksDisponibles = data;
      });
  }
}