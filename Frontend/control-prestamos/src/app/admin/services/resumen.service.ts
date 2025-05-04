import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

interface Prestamo {
  id: number;
  student: string;
  notebook: string;
  fechaPrestamo: string;
  fechaDevolucion: string;
  estado: string;
}

interface Solicitud {
  studentName: string;
  notebookModel: string;
  beginDate: string;
  endDate?: string;
}

// Define the Student interface
interface Student {
  Id?: number;
  id?: number;
  Rut?: number;
  rut?: number;
  Dv?: string;
  dv?: string;
  Name?: string;
  name?: string;
  Lastname?: string;
  lastname?: string;
  Email?: string;
  email?: string;
  Phone?: string;
  phone?: string;
  Campus?: string;
  campus?: string;
  Career?: string;
  career?: string;
  Blocked?: boolean;
  blocked?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ResumenService {
  private apiUrl = 'http://localhost:5166/api';

  constructor(private http: HttpClient) {}

  // Obtener cantidad de préstamos activos
  getPrestamosActivos(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/loans/active/all`).pipe(
      map(response => {
        const prestamos = response?.$values || [];
        const now = new Date();
        // Filtramos para incluir solo los préstamos que NO han excedido el límite de 2 horas
        const prestamosNoVencidos = prestamos.filter((prestamo: any) => {
          const startDate = new Date(prestamo.beginDate);
          const endTime = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 horas
          return endTime.getTime() > now.getTime();
        });
        return prestamosNoVencidos.length;
      }),
      catchError(error => {
        console.error('Error al obtener préstamos activos:', error);
        return of(0);
      })
    );
  }

  // Obtener cantidad de préstamos vencidos (pendientes con tiempo expirado)
  getPrestamosVencidos(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/loans/active/all`).pipe(
      map(response => {
        const prestamos = response?.$values || [];
        const now = new Date();
        // Filtramos para incluir solo los préstamos que HAN excedido el límite de 2 horas
        const prestamosVencidos = prestamos.filter((prestamo: any) => {
          const startDate = new Date(prestamo.beginDate);
          const endTime = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 horas
          return endTime.getTime() <= now.getTime();
        });
        return prestamosVencidos.length;
      }),
      catchError(error => {
        console.error('Error al obtener préstamos vencidos:', error);
        return of(0);
      })
    );
  }

  // Obtener historial de solicitudes activas y retornadas
  getHistorialSolicitudes(): Observable<any[]> {
    return forkJoin({
      activas: this.http.get<any>(`${this.apiUrl}/loans/active/all`),
      retornadas: this.http.get<any>(`${this.apiUrl}/loans/returned/all`),
      notebooks: this.http.get<any>(`${this.apiUrl}/Notebooks/all`).pipe(
        map(response => Array.isArray(response) ? response : response?.$values || [])
      ),
    }).pipe(
      switchMap(({ activas, retornadas, notebooks }) => {
        console.log('API response - activas:', activas);
        console.log('API response - retornadas:', retornadas);
        console.log('API response - notebooks:', notebooks);
        
        const solicitudesActivas = activas?.$values || [];
        const solicitudesRetornadas = retornadas?.$values || [];

        console.log('Solicitudes activas procesadas:', solicitudesActivas);
        console.log('Solicitudes retornadas procesadas:', solicitudesRetornadas);

        const mappedActivas = solicitudesActivas.map((solicitud: any) => {
          const notebook = notebooks.find((n: any) => n.id === solicitud.notebookId);
          console.log('Procesando préstamo activo:', solicitud);
          console.log('ID del estudiante encontrado:', solicitud.studentRut);
          return {
            studentId: solicitud.studentRut, // Guardamos el ID del estudiante
            notebook: notebook ? `${notebook.brand} - ${notebook.model}` : 'Desconocido',
            fechaPrestamo: solicitud.beginDate,
            fechaDevolucion: null,
            estado: 'Activo',
          };
        });

        const mappedRetornadas = solicitudesRetornadas.map((solicitud: any) => {
          const notebook = notebooks.find((n: any) => n.id === solicitud.notebookId);
          console.log('Procesando préstamo retornado:', solicitud);
          console.log('ID del estudiante encontrado:', solicitud.studentRut);
          return {
            studentId: solicitud.studentRut, // Guardamos el ID del estudiante
            notebook: notebook ? `${notebook.brand} - ${notebook.model}` : 'Desconocido',
            fechaPrestamo: solicitud.beginDate,
            fechaDevolucion: solicitud.endDate,
            estado: 'Finalizado',
          };
        });

        const allSolicitudes = [...mappedActivas, ...mappedRetornadas];
        console.log('Todas las solicitudes antes de obtener estudiantes:', allSolicitudes);
        
        // Si no hay solicitudes, devolver un array vacío
        if (allSolicitudes.length === 0) {
          console.log('No hay solicitudes para mostrar');
          return of([]);
        }
        
        // Crear un array de observables para obtener la información de cada estudiante
        const studentRequests = allSolicitudes.map(solicitud => {
          console.log('Solicitando información del estudiante con ID:', solicitud.studentId);
          return this.getStudentById(solicitud.studentId).pipe(
            map(student => {
              console.log('Respuesta de estudiante recibida completa:', student);
              console.log('Valor de name:', student.name);
              console.log('Valor de lastname:', student.lastname);
              
              // Extraer nombre y apellido con comprobaciones exhaustivas
              const nombre = student.name || student.Name || '';
              const apellido = student.lastname || student.Lastname || '';
              
              console.log('Nombre extraído:', nombre);
              console.log('Apellido extraído:', apellido);
              
              const nombreCompleto = `${nombre} ${apellido}`.trim();
              console.log('Nombre completo formateado:', nombreCompleto);
              
              return {
                ...solicitud,
                student: nombreCompleto || `RUT: ${solicitud.studentId}`
              };
            }),
            catchError(error => {
              console.error('Error al obtener estudiante:', error);
              return of({...solicitud, student: `RUT: ${solicitud.studentId}`});
            })
          );
        });
        
        // Combinar todos los observables y devolver el resultado final
        return forkJoin(studentRequests).pipe(
          map(results => {
            console.log('Resultados finales con información de estudiantes:', results);
            return results;
          }),
          catchError(error => {
            console.error('Error al combinar solicitudes con estudiantes:', error);
            // Asegurar que al menos se muestre el ID del estudiante
            return of(allSolicitudes.map(s => ({...s, student: `RUT: ${s.studentId}`})));
          })
        );
      }),
      // Manejo de errores global
      catchError(error => {
        console.error('Error global al obtener historial de solicitudes:', error);
        return of([]);
      })
    );
  }

  // Obtener todos los préstamos pendientes
  getPrestamosPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/loans/pending/all`);
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

  // Obtener todos los notebooks
  getAllNotebooks(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/Notebooks/all`).pipe(
      map(response => {
        console.log('API response - all notebooks:', response);
        if (response && response.$values && Array.isArray(response.$values)) {
          return response.$values;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error al obtener todos los notebooks:', error);
        return of([]);
      })
    );
  }

  // Obtener cantidad de préstamos finalizados
  getPrestamosFinalizados(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/loans/returned/all`).pipe(
      map(response => {
        const prestamos = response?.$values || [];
        return prestamos.length;
      }),
      catchError(error => {
        console.error('Error al obtener préstamos finalizados:', error);
        return of(0);
      })
    );
  }

  // Fetch student information by ID
  getStudentById(studentId: number): Observable<Student> {
    // Primera prueba: /students/by-rut/{studentId}
    return this.http.get<Student>(`${this.apiUrl}/students/by-rut/${studentId}`).pipe(
      map(student => {
        console.log('Estudiante encontrado por by-rut:', student);
        return student;
      }),
      catchError(error1 => {
        console.error(`Error al obtener estudiante por by-rut:`, error1);
        
        // Segunda prueba: /students/rut/{studentId}
        return this.http.get<Student>(`${this.apiUrl}/students/rut/${studentId}`).pipe(
          map(student => {
            console.log('Estudiante encontrado por rut:', student);
            return student;
          }),
          catchError(error2 => {
            console.error(`Error al obtener estudiante por rut:`, error2);
            
            // Tercera prueba: /Students/GetByRut/{studentId}
            return this.http.get<Student>(`${this.apiUrl}/Students/GetByRut/${studentId}`).pipe(
              map(student => {
                console.log('Estudiante encontrado por GetByRut:', student);
                return student;
              }),
              catchError(error3 => {
                console.error(`Error al obtener estudiante por GetByRut:`, error3);
                
                // Si falla, devolver objeto con RUT formateado correctamente
                return of({
                  Id: studentId,
                  Rut: studentId,
                  Name: 'Estudiante',  // Un texto genérico en lugar de vacío
                  Lastname: `${studentId}`,  // Solo el RUT, sin prefijo
                  Dv: '',
                  Email: '',
                  Phone: '',
                  Campus: '',
                  Career: ''
                } as Student);
              })
            );
          })
        );
      })
    );
  }
}
