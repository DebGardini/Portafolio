import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PrestamoService {
  // URL base para la API - Cambiar según corresponda
  private apiUrl = 'http://localhost:3000/api'; // URL por defecto, ajustar según necesidad

  constructor(private http: HttpClient) { }

  // Buscar alumno por RUT
  buscarAlumnoPorRut(rut: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/alumnos/buscar/${rut}`)
      .pipe(
        catchError(error => {
          console.error('Error al buscar alumno:', error);
          return of(null);
        })
      );
  }

  // Registrar un nuevo alumno
  registrarAlumno(alumnoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/alumnos/registrar`, alumnoData);
  }

  // Obtener notebooks disponibles
  getNotebooksDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notebooks/disponibles`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener notebooks disponibles:', error);
          // Datos de ejemplo en caso de error
          return of([
            { id: 1, nombre: 'Notebook Dell', modelo: 'XPS 13' },
            { id: 2, nombre: 'Notebook HP', modelo: 'Spectre x360' },
            { id: 3, nombre: 'Notebook Lenovo', modelo: 'ThinkPad X1' }
          ]);
        })
      );
  }

  // Realizar préstamo
  realizarPrestamo(rutAlumno: string, notebookId: number): Observable<any> {
    const prestamoData = {
      rutAlumno,
      notebookId,
      fechaPrestamo: new Date().toISOString()
    };
    
    return this.http.post<any>(`${this.apiUrl}/prestamos/crear`, prestamoData);
  }
}