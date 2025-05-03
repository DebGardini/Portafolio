import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PrestamosActivosService {

  private apiUrl = 'http://localhost:5166/api'; // URL base de tu backend

  constructor(private http: HttpClient) {}

  obtenerPrestamos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/loans/active/all`);
  }

  obtenerPrestamosPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/loans/pending/all`).pipe(
      catchError(error => {
        if (error.status === 404) {
          console.warn('No se encontraron préstamos pendientes.');
          return of([]); // Devolver un array vacío si no hay datos
        }
        throw error; // Re-lanzar otros errores
      })
    );
  }

  sancionarAlumno(rut: string): Observable<void> {
    const url = `${this.apiUrl}/sancionar/${rut}`;
    return this.http.post<void>(url, {});
  }

  actualizarPrestamo(id: string, nuevosDatos: any): Observable<void> {
    const url = `${this.apiUrl}/prestamos/${id}`;
    return this.http.put<void>(url, nuevosDatos);
  }

  eliminarPrestamo(rut: string): Observable<void> {
    const url = `${this.apiUrl}/prestamos/${rut}`;
    return this.http.delete<void>(url);
  }
}
