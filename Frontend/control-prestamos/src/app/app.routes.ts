import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { DashboardComponent } from './admin/pages/dashboard.component';
import { StatusComponent } from './student/pages/status.component';

export const routes: Routes = [
    {
        path: 'admin',
        component: AdminLayoutComponent,
        children: [
          { path: '', component: DashboardComponent },
          // puedes seguir agregando: /inventario, /solicitudes, etc
        ]
      },
  { path: 'estudiante', component: StatusComponent },
  { path: '', redirectTo: '/estudiante', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];