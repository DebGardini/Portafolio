import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { StatusComponent } from './student/pages/status.component';
import { HomeComponent } from './index/home.component';
import { AuthGuard } from './admin/services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'prestamos-activos',
        loadComponent: () => import('./admin/pages/prestamos-activos/prestamos-activos.component').then(m => m.PrestamosActivosComponent)
      },
      {
        path: 'solicitudes',
        loadComponent: () => import('./admin/pages/solicitudes/solicitudes.component').then(m => m.SolicitudesComponent)
      }
    ]
  },
  { path: 'estudiante', component: StatusComponent },
  { path: '**', redirectTo: '' }
];