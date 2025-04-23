import { Component } from '@angular/core';
import { SidebarComponent } from '../components/sidebar.component';
import { HeaderComponent } from '../components/header.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent, RouterOutlet, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {}