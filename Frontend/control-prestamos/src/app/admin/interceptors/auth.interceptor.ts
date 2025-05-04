import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Obtener el token de autenticación
  const token = authService.getToken();
  
  // Si hay un token y la solicitud es a la API, añadirlo a los headers
  if (token && req.url.includes('http://localhost:5166/api')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};