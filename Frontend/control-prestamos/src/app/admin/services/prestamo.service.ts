import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrestamoService {

  private baseUrl = 'https://tu-api-url.com/api';  // Cambia esta URL por la de tu API

  constructor(private http: HttpClient) { }

  // Obtener los préstamos activos
  getPrestamosActivos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/prestamos/activos`);
  }

  // Realizar un nuevo préstamo
  realizarPrestamo(rutAlumno: string, notebookId: number): Observable<any> {
    const prestamo = {
      rut: rutAlumno,
      notebookId: notebookId
    };
    return this.http.post<any>(`${this.baseUrl}/prestamos`, prestamo);
  }

  // Devolver un préstamo
  devolverPrestamo(prestamoId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/prestamos/devolver`, { prestamoId });
  }

  // Obtener historial de préstamos
  getHistorialPrestamos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/prestamos/historial`);
  }
}
