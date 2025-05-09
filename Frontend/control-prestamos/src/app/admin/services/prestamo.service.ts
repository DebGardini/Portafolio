import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PrestamoService {
  // URL base para la API desde el archivo de configuración
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Buscar alumno por RUT
  buscarAlumnoPorRut(rut: string): Observable<any> {
    // Extraer solo la parte numérica del RUT (sin dígito verificador)
    const rutNumerico = rut.replace(/\D/g, '');
    console.log('Buscando alumno con RUT (limpio):', rutNumerico);

    return this.http.get<any>(`${this.apiUrl}/students/rut/${rutNumerico}`).pipe(
      map(student => {
        console.log('Alumno encontrado:', student);
        return student;
      }),
      catchError(error => {
        console.error('Error al buscar alumno por RUT:', error);
        return of(null);
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

          if (response && response.$values && Array.isArray(response.$values)) {
            return response.$values;
          }

          if (Array.isArray(response)) {
            return response;
          }

          if (response && response.data && Array.isArray(response.data)) {
            return response.data;
          }

          console.error('Unexpected response format from API:', response);
          return [];
        }),
        catchError(error => {
          console.error('Error fetching notebooks:', error);
          return of([]);  
        })
      );
  }

  // Registrar un préstamo con el formato completo
  registrarPrestamo(prestamoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/loans/new`, prestamoData);
  }

  // Actualizar la disponibilidad de un notebook (marcar como no disponible cuando se presta)
  actualizarDisponibilidadNotebook(notebookId: number, disponible: boolean): Observable<any> {
    console.log(`Notebook ${notebookId} - La disponibilidad se maneja automáticamente por la API al registrar el préstamo`);
    
    return of({ success: true });
  }

  // Buscar información completa del alumno por RUT (incluye préstamos)
  getEstadoCompletoAlumno(rut: string): Observable<any> {
    const rutNumerico = rut.split('-')[0];
    
    // Primero, obtenemos todos los notebooks para tenerlos disponibles
    return this.http.get<any>(`${this.apiUrl}/notebooks/all`).pipe(
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
                  
                  // Obtenemos las sanciones activas
                  return this.http.get<any>(`${this.apiUrl}/sanctions/active/${rutNumerico}`).pipe(
                    map(sanciones => {
                      const sancionesActivas = sanciones?.$values || [];
                      
                      return {
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
                        bloqueos: alumno.blocked ? ['Bloqueo por préstamos vencidos'] : [],
                        sanciones: sancionesActivas
                      };
                    }),
                    catchError(() => {
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
                    })
                  );
                } else {
                  // No tiene préstamos activos, verificamos sanciones
                  return this.http.get<any>(`${this.apiUrl}/sanctions/active/${rutNumerico}`).pipe(
                    map(sanciones => {
                      const sancionesActivas = sanciones?.$values || [];
                      const tieneSanciones = sancionesActivas && sancionesActivas.length > 0;
                      
                      return {
                        ...alumno,
                        estadoPrestamo: null, 
                        bloqueos: tieneSanciones ? ['Bloqueo por sanción aplicada'] : (alumno.blocked ? ['Bloqueo por préstamos vencidos'] : []),
                        sanciones: sancionesActivas
                      };
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

  // Verificar si un alumno tiene préstamos activos o pendientes
  verificarPrestamosActivos(rut: string): Observable<any> {
    const rutNumerico = rut.replace(/\D/g, '');
    
    console.log('Verificando préstamos activos para RUT:', rutNumerico);
    
    return this.http.get<any>(`${this.apiUrl}/loans/active/all`).pipe(
      map(response => {
        console.log('Respuesta de préstamos activos:', response);
        const prestamosActivos = response && response.$values ? response.$values : (Array.isArray(response) ? response : []);
        
        const prestamosDelAlumno = prestamosActivos.filter((prestamo: any) => {
          const prestamoRut = prestamo.studentRut ? String(prestamo.studentRut).replace(/\D/g, '') : '';
          const prestamoStudentId = prestamo.studentId ? String(prestamo.studentId).replace(/\D/g, '') : '';
          
          return prestamoRut === rutNumerico || 
                 prestamoStudentId === rutNumerico ||
                 parseInt(prestamoRut) === parseInt(rutNumerico) ||
                 parseInt(prestamoStudentId) === parseInt(rutNumerico);
        });
        
        console.log('Préstamos encontrados para este alumno:', prestamosDelAlumno.length);
        
        if (prestamosDelAlumno.length > 0) {
          // Verificar si hay algún préstamo vencido (pendiente)
          const prestamoVencido = prestamosDelAlumno.find((prestamo: any) => {
            const fechaPrestamo = new Date(prestamo.beginDate);
            const fechaLimite = new Date(fechaPrestamo.getTime() + (2 * 60 * 60 * 1000)); // 2 horas
            return new Date() > fechaLimite;
          });
          
          return {
            hasPrestamos: true,
            isExpired: !!prestamoVencido,
            prestamo: prestamosDelAlumno[0]
          };
        }
        
        return null;
      }),
      catchError(error => {
        console.error('Error al verificar préstamos activos:', error);
        return of(null);
      })
    );
  }
}
