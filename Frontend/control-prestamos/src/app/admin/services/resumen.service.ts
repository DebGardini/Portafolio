import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


interface Prestamo {
  id: number;
  student: string;
  notebook: string;
  fechaPrestamo: string;
  fechaDevolucion: string;
  estado: string;
}

@Injectable({
  providedIn: 'root',
})
export class ResumenService {
  private apiUrl = 'http://localhost:5166/api'; // URL corregida sin https:// duplicado

  constructor(private http: HttpClient) {}

  // Obtener cantidad de préstamos activos
  getPrestamosActivos(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/loans/active/all`);
  }

  // Obtener cantidad de préstamos vencidos (retornados)
  getPrestamosVencidos(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/loans/returned/all`);
  }

  // Obtener historial de solicitudes
  // Este endpoint necesita un parámetro Rut según el controlador
  getHistorialSolicitudes(rut?: number): Observable<Prestamo[]> {
    const url = rut ? `${this.apiUrl}/loans?Rut=${rut}` : `${this.apiUrl}/loans`;
    return this.http.get<Prestamo[]>(url);
  }

  // Obtener todos los préstamos pendientes
  getPrestamosPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/loans/pending/all`);
  }

  // Obtener inventario de notebooks
  getInventarioNotebooks(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notebooks/all`);
  }

  // Obtener notebooks disponibles
  getNotebooksDisponibles(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notebooks/available`);
  }
}
