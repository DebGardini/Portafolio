import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


interface Prestamo {
  id: number;
  usuario: string;
  notebook: string;
  fechaPrestamo: string;
  fechaDevolucion: string;
  estado: string;
}

@Injectable({
  providedIn: 'root',
})
export class ResumenService {
  private apiUrl = 'https://api.misitio.com'; // Reemplaza con la URL de tu API

  constructor(private http: HttpClient) {}

  // Obtener cantidad de prestamos activos
  getPrestamosActivos(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/prestamos/activos`);
  }

  // Obtener cantidad de prestamos vencidos
  getPrestamosVencidos(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/prestamos/vencidos`);
  }

  // Obtener historial de solicitudes
  getHistorialSolicitudes(): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(`${this.apiUrl}/solicitudes/historial`);
  }

  // Obtener inventario de notebooks
  getInventarioNotebooks(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notebooks/inventario`);
  }
}
