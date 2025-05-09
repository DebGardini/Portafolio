import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrestamosActivosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  finalizarPrestamo(rut: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/loans/modify/${rut}`, 1).pipe(
      catchError(error => {
        console.error('Error al finalizar préstamo:', error);
        throw error;
      })
    );
  }

  aplicarSancion(rut: string, sancionData: { description: string; finishDate: Date; loanId?: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/sanctions/apply/${rut}`, sancionData).pipe(
      catchError(error => {
        console.error('Error al aplicar sanción al alumno:', error);
        throw error;
      })
    );
  }
}
