import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Obtener el token de autenticación
  const token = authService.getToken();
  
  // Usar la URL de la API desde el entorno
  if (token && req.url.includes(environment.apiUrl)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Access-Control-Allow-Origin': '*', // Ayuda con CORS
        'Content-Type': 'application/json'
      }
    });
  }
  
  return next(req);
};