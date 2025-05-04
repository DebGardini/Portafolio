import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

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
    return this.http.get<any>(`${this.apiUrl}/students/by-rut/${rutNumerico}`)
      .pipe(
        catchError(error => {
          console.error('Error al buscar alumno por RUT:', error);
          return of(null); // Devolver null en caso de error
        })
      );
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

  // Buscar información completa del alumno por RUT (incluye préstamos)
  getEstadoCompletoAlumno(rut: string): Observable<any> {
    // Extraer solo la parte numérica del RUT (sin dígito verificador)
    const rutNumerico = rut.split('-')[0];
    
    // Primero, obtenemos todos los notebooks para tenerlos disponibles
    return this.http.get<any>(`${this.apiUrl}/Notebooks/all`).pipe(
      switchMap(notebooksResponse => {
        const notebooks = Array.isArray(notebooksResponse) ? notebooksResponse : notebooksResponse?.$values || [];
        
        // Comenzamos obteniendo el alumno
        return this.buscarAlumnoPorRut(rutNumerico).pipe(
          switchMap(alumno => {
            if (!alumno) {
              return of(null);
            }
            
            // Obtenemos los préstamos activos
            return this.http.get<any>(`${this.apiUrl}/loans/active/all`).pipe(
              switchMap(response => {
                const prestamosActivos = response?.$values || [];
                
                // Buscamos un préstamo activo para este estudiante
                const prestamoActivo = prestamosActivos.find((p: any) => 
                  p.studentRut === parseInt(rutNumerico) || p.studentRut === rutNumerico
                );
                
                // Si encontramos un préstamo activo
                if (prestamoActivo) {
                  // Buscamos el notebook en el array de notebooks
                  const notebook = notebooks.find((n: any) => n.id === prestamoActivo.notebookId);
                  
                  // Verificamos si el préstamo ha expirado
                  const now = new Date();
                  const startDate = new Date(prestamoActivo.beginDate);
                  const endTime = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 horas
                  const tiempoExpirado = now > endTime;
                  
                  return of({
                    ...alumno,
                    fechaPrestamo: prestamoActivo.beginDate,
                    fechaDevolucion: prestamoActivo.endDate || null,
                    notebookId: prestamoActivo.notebookId,
                    notebook: notebook ? {
                      id: notebook.id,
                      marca: notebook.brand,
                      modelo: notebook.model,
                      serialNumber: notebook.serialNumber
                    } : null,
                    estadoPrestamo: tiempoExpirado ? 'Pendiente' : 'Activo',
                    bloqueos: alumno.blocked ? ['Bloqueo por préstamos vencidos'] : []
                  });
                } else {
                  // No tiene préstamos activos, verificamos si tiene finalizados
                  return this.http.get<any>(`${this.apiUrl}/loans/returned/all`).pipe(
                    map(returnedResponse => {
                      const prestamosRetornados = returnedResponse?.$values || [];
                      
                      // Buscamos un préstamo finalizado para este estudiante
                      const prestamoFinalizado = prestamosRetornados.find((p: any) => 
                        p.studentRut === parseInt(rutNumerico) || p.studentRut === rutNumerico
                      );
                      
                      if (prestamoFinalizado) {
                        // Buscamos el notebook en el array de notebooks
                        const notebook = notebooks.find((n: any) => n.id === prestamoFinalizado.notebookId);
                        
                        return {
                          ...alumno,
                          fechaPrestamo: prestamoFinalizado.beginDate,
                          fechaDevolucion: prestamoFinalizado.endDate,
                          notebookId: prestamoFinalizado.notebookId,
                          notebook: notebook ? {
                            id: notebook.id,
                            marca: notebook.brand,
                            modelo: notebook.model,
                            serialNumber: notebook.serialNumber
                          } : null,
                          estadoPrestamo: 'Finalizado',
                          bloqueos: alumno.blocked ? ['Bloqueo por préstamos vencidos'] : []
                        };
                      } else {
                        // No tiene ningún préstamo
                        return {
                          ...alumno,
                          estadoPrestamo: null,
                          bloqueos: alumno.blocked ? ['Bloqueo por préstamos vencidos'] : []
                        };
                      }
                    }),
                    catchError(() => {
                      return of({
                        ...alumno,
                        estadoPrestamo: null,
                        bloqueos: alumno.blocked ? ['Bloqueo por préstamos vencidos'] : []
                      });
                    })
                  );
                }
              }),
              catchError(() => {
                // Error al obtener préstamos activos
                return of({
                  ...alumno,
                  estadoPrestamo: null,
                  bloqueos: alumno.blocked ? ['Bloqueo por préstamos vencidos'] : []
                });
              })
            );
          }),
          catchError(error => {
            console.error('Error al buscar información del alumno:', error);
            return of(null);
          })
        );
      }),
      catchError(error => {
        console.error('Error al obtener notebooks:', error);
        return of(null);
      })
    );
  }
}
