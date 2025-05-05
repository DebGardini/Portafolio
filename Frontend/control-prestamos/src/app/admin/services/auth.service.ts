import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isLoggedIn = false;

  constructor(private router: Router, private http: HttpClient) {
    // Verificar si ya hay una sesión guardada al iniciar el servicio
    this.checkAuthStatus();
  }

  // Método para verificar si hay una sesión activa almacenada
  private checkAuthStatus(): void {
    const token = this.getToken();
    const expiration = localStorage.getItem('token_expiration');
    
    if (token && expiration) {
      // Verificar si el token ha expirado
      const expirationDate = new Date(expiration);
      if (expirationDate > new Date()) {
        this.isLoggedIn = true;
      } else {
        // Si el token expiró, limpiar la sesión
        this.clearSession();
      }
    }
  }

  // Método para iniciar sesión usando la API
  login(username: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/account/login`, { username, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            this.isLoggedIn = true;
            
            // Guardar el token y su información
            localStorage.setItem('isLoggedIn', 'true');
            this.setToken(response.token);
            
            // Establecer expiración del token (ejemplo: 2 horas)
            const expiration = new Date();
            expiration.setHours(expiration.getHours() + 2);
            localStorage.setItem('token_expiration', expiration.toISOString());
          }
        }),
        map(response => !!response && !!response.token),
        catchError(error => {
          console.error('Error en login:', error);
          return of(false);
        })
      );
  }

  // Método para cerrar sesión
  logout(): void {
    this.clearSession();
    this.router.navigate(['/']);
  }

  // Método para limpiar toda la información de sesión
  private clearSession(): void {
    this.isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token_expiration');
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    this.checkAuthStatus(); // Verificar estado actual antes de responder
    return this.isLoggedIn;
  }

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}