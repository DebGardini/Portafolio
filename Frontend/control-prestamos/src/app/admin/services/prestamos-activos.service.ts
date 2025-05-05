import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrestamosActivosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerPrestamos(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/loans/active/all`).pipe(
      map(response => {
        // Manejar tanto arrays directos como respuestas con $values
        if (response && response.$values) {
          return response.$values;
        }
        return Array.isArray(response) ? response : [];
      }),
      catchError(error => {
        console.error('Error al obtener préstamos activos:', error);
        return of([]);
      })
    );
  }

  /**
   * @deprecated Este método ya no se utiliza. Los préstamos pendientes son los préstamos activos con temporizador expirado.
   */
  obtenerPrestamosPendientes(): Observable<any[]> {
    console.warn('Este método está obsoleto. Utilice obtenerPrestamos() y filtre por tiempo expirado');
    return this.http.get<any>(`${this.apiUrl}/loans/pending/all`).pipe(
      map(response => {
        if (response && response.$values) {
          return response.$values;
        }
        return Array.isArray(response) ? response : [];
      }),
      catchError(error => {
        if (error.status === 404) {
          console.warn('No se encontraron préstamos pendientes.');
          return of([]); // Devolver un array vacío si no hay datos
        }
        console.error('Error al obtener préstamos pendientes:', error);
        return of([]); // Para cualquier otro error, devuelve array vacío
      })
    );
  }

  finalizarPrestamo(rut: string): Observable<void> {
    // Esta función finaliza el préstamo cambiando su estado a 1 (finalizado)
    // lo que automáticamente devuelve el notebook al stock como disponible
    // El controlador espera directamente el valor del enum LoanState, no un objeto
    return this.http.put<void>(`${this.apiUrl}/loans/modify/${rut}`, 1).pipe(
      catchError(error => {
        console.error('Error al finalizar préstamo:', error);
        throw error;
      })
    );
  }

  eliminarPrestamo(rut: string): Observable<void> {
    // Esta función elimina el préstamo del sistema
    return this.http.delete<void>(`${this.apiUrl}/loans/${rut}`).pipe(
      catchError(error => {
        console.error('Error al eliminar préstamo:', error);
        throw error;
      })
    );
  }

  sancionarAlumno(rut: string): Observable<void> {
    // Función para marcar al alumno como bloqueado
    return this.http.post<void>(`${this.apiUrl}/students/${rut}/block`, {}).pipe(
      catchError(error => {
        console.error('Error al bloquear alumno:', error);
        throw error;
      })
    );
  }

  aplicarSancion(rut: string, sancionData: { description: string; finishDate: Date; loanId?: number }): Observable<any> {
    // Función para aplicar una sanción con período de tiempo específico
    return this.http.put<any>(`${this.apiUrl}/sanctions/apply/${rut}`, sancionData).pipe(
      catchError(error => {
        console.error('Error al aplicar sanción al alumno:', error);
        throw error;
      })
    );
  }

  actualizarPrestamo(rut: string, datos: any): Observable<any> {
    // Función para actualizar el estado de un préstamo
    return this.http.patch<any>(`${this.apiUrl}/loans/${rut}`, datos).pipe(
      catchError(error => {
        console.error('Error al actualizar préstamo:', error);
        throw error;
      })
    );
  }
}
