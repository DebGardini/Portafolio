import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, from } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces para el tipado
interface Student {
  rut: number;
  dv: string;
  name: string;
  lastname: string;
  blocked: boolean;
  [key: string]: any; // Para otras propiedades que pueda tener el estudiante
}

interface Sanction {
  id?: number;
  description: string;
  startDate: string | null;
  finishDate: string | null;
  studentRut?: number;
  [key: string]: any; // Para otras propiedades que pueda tener la sanción
}

interface StudentWithSanctions extends Student {
  studentName: string;
  studentRut: number;
  studentDv: string;
  sanctions: Sanction[];
}

interface EnrichedSanction extends Sanction {
  studentName: string;
  studentRut: number;
  studentDv: string;
}

@Injectable({
  providedIn: 'root',
})
export class SanctionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Obtener todos los alumnos bloqueados con detalles de sus sanciones activas
  getBlockedStudents(): Observable<EnrichedSanction[]> {
    return this.http.get<any>(`${this.apiUrl}/sanctions/blocked`).pipe(
      map(response => {
        // Manejo de diferentes formatos de respuesta
        if (response && response.$values && Array.isArray(response.$values)) {
          return response.$values as Student[];
        }

        if (Array.isArray(response)) {
          return response as Student[];
        }

        // Si es un único objeto (no array), convertirlo a array
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          return [response] as Student[];
        }

        console.error('Unexpected response format from API:', response);
        return [] as Student[];
      }),
      mergeMap((students: Student[]) => {
        if (!students || students.length === 0) {
          return of([] as EnrichedSanction[]);
        }

        console.log('Estudiantes bloqueados encontrados:', students);
        
        // Para cada estudiante bloqueado, obtener sus sanciones activas
        const studentsWithSanctions = students.map((student: Student) => {
          const rutNumerico = String(student.rut).replace(/\D/g, '');
          return this.getStudentActiveSanctions(rutNumerico).pipe(
            map((sanctions: Sanction[]) => {
              // Combinar información del estudiante con sus sanciones
              const studentInfo: StudentWithSanctions = {
                ...student,
                studentName: `${student.name || ''} ${student.lastname || ''}`.trim(),
                studentRut: student.rut,
                studentDv: student.dv,
                sanctions: sanctions
              };
              console.log(`Información completa para estudiante ${student.rut}:`, studentInfo);
              return studentInfo;
            }),
            catchError(error => {
              console.error(`Error al obtener sanciones para estudiante ${student.rut}:`, error);
              return of({
                ...student,
                studentName: `${student.name || ''} ${student.lastname || ''}`.trim(),
                studentRut: student.rut,
                studentDv: student.dv,
                sanctions: [] as Sanction[]
              } as StudentWithSanctions);
            })
          );
        });
        
        return forkJoin(studentsWithSanctions).pipe(
          // Convertir array de estudiantes con sanciones a un array plano de sanciones con info de estudiante
          map((studentsWithSanctions: StudentWithSanctions[]) => {
            const flattenedSanctions: EnrichedSanction[] = [];
            
            studentsWithSanctions.forEach((student: StudentWithSanctions) => {
              if (student.sanctions && student.sanctions.length > 0) {
                student.sanctions.forEach((sanction: Sanction) => {
                  flattenedSanctions.push({
                    ...sanction,
                    studentName: student.studentName,
                    studentRut: student.studentRut,
                    studentDv: student.studentDv
                  } as EnrichedSanction);
                });
              } else {
                // Incluir al estudiante aunque no tenga sanciones activas (está bloqueado pero sin detalles)
                flattenedSanctions.push({
                  description: 'Bloqueo administrativo',
                  startDate: null,
                  finishDate: null,
                  studentName: student.studentName,
                  studentRut: student.studentRut,
                  studentDv: student.studentDv
                } as EnrichedSanction);
              }
            });
            
            console.log('Lista final de sanciones con info de estudiantes:', flattenedSanctions);
            return flattenedSanctions;
          }),
          catchError(error => {
            console.error('Error al combinar estudiantes con sus sanciones:', error);
            return of([] as EnrichedSanction[]);
          })
        );
      }),
      catchError(error => {
        console.error('Error al obtener alumnos bloqueados:', error);
        return of([] as EnrichedSanction[]);
      })
    );
  }

  // Obtener las sanciones activas de un estudiante
  getStudentActiveSanctions(rut: string): Observable<Sanction[]> {
    return this.http.get<any>(`${this.apiUrl}/sanctions/active/${rut}`).pipe(
      map(response => {
        console.log(`Sanciones activas para estudiante ${rut}:`, response);
        // Manejo de diferentes formatos de respuesta
        if (response && response.$values && Array.isArray(response.$values)) {
          return response.$values as Sanction[];
        }

        if (Array.isArray(response)) {
          return response as Sanction[];
        }

        // Si es un único objeto (no array), convertirlo a array
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          return [response] as Sanction[];
        }

        return [] as Sanction[];
      }),
      catchError(error => {
        console.error(`Error al obtener sanciones activas para estudiante ${rut}:`, error);
        return of([] as Sanction[]);
      })
    );
  }

  // Quitar bloqueo a un alumno
  removeBlock(rutNumerico: string): Observable<any> {
    // Crear el cuerpo de la petición según el schema requerido
    const sanctionRemovalDto = {
      studentRut: Number(rutNumerico),
      loanId: 0, // ID de préstamo por defecto (se puede ajustar si es necesario)
      unblockStudent: true
    };
    
    // Usar PUT en lugar de DELETE y enviar el cuerpo requerido
    return this.http.put<any>(`${this.apiUrl}/sanctions/remove/${rutNumerico}`, sanctionRemovalDto).pipe(
      map(response => {
        console.log('Bloqueo eliminado correctamente:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error al quitar bloqueo:', error);
        return of(null);
      })
    );
  }
}