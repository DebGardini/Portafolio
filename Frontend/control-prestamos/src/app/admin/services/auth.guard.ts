import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      // Guardar mensaje para mostrar en la página principal
      sessionStorage.setItem('auth_redirect_reason', 'Acceso restringido. Solo administradores.');
      
      // Redirigir a la página principal donde se mostrará el formulario de login
      this.router.navigate(['/']);
      return false;
    }
  }
}