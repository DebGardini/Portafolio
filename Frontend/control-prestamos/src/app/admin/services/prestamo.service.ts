import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PrestamoService {
  // URL base para la API - Cambiar según corresponda
  private apiUrl = 'http://localhost:5166/api';

  constructor(private http: HttpClient) {}

  // Buscar alumno por RUT
  buscarAlumnoPorRut(rut: string): Observable<any> {
    // Extraer solo la parte numérica del RUT (sin dígito verificador)
    const rutNumerico = rut.split('-')[0];

    // Realizar la solicitud al backend con el RUT numérico
    return this.http.get<any>(`${this.apiUrl}/students/${rutNumerico}`);
  }

  // Registrar un nuevo alumno
  registrarAlumno(alumnoData: any): Observable<any> {
    console.log('Datos del nuevo alumno:', alumnoData);
    return this.http.post<any>(`${this.apiUrl}/students/new`, alumnoData);
  }

  // Obtener notebooks disponibles
  getNotebooksDisponibles(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/notebooks/available`)
      .pipe(
        map(response => {
          console.log('Original API response:', response);

          // Handle the specific format where notebooks are in $values property
          if (response && response.$values && Array.isArray(response.$values)) {
            return response.$values;
          }

          // Check if response is already an array
          if (Array.isArray(response)) {
            return response;
          }

          // If the API returns an object with a data property containing the array
          if (response && response.data && Array.isArray(response.data)) {
            return response.data;
          }

          // If we can't extract an array, return an empty array to prevent errors
          console.error('Unexpected response format from API:', response);
          return [];
        }),
        catchError(error => {
          console.error('Error fetching notebooks:', error);
          return of([]);  // Return empty array on error
        })
      );
  }

  // Registrar un préstamo con el formato completo
  registrarPrestamo(prestamoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/loans/new`, prestamoData);
  }
}
