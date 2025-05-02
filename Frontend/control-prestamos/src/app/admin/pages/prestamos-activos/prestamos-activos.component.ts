import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { PrestamosActivosService } from './../../services/prestamos-activos.service';

@Component({
  selector: 'app-prestamos-activos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './prestamos-activos.component.html',
  styleUrls: ['./prestamos-activos.component.css']
})
export class PrestamosActivosComponent implements OnInit {
  searchTerm = '';
  columnas: string[] = ['usuario', 'notebook', 'fechaPrestamo', 'horaLimite', 'tiempoRestante', 'estado', 'accion'];

  data: any[] = [];
  historialData: any[] = [];
  sancionados: string[] = [];
  filteredData: any[] = [];

  @ViewChild('historialModal') historialModal!: TemplateRef<any>;
  @ViewChild('editarModal') editarModal!: TemplateRef<any>;

  prestamoSeleccionado: any = null;
  nuevoEstado: string = '';

  constructor(private dialog: MatDialog, private prestamosService: PrestamosActivosService) {}

  ngOnInit() {
    this.prestamosService.obtenerPrestamos().subscribe(prestamos => {
      this.data = prestamos;
      this.filteredData = [...this.data];
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    this.filteredData = this.data.filter(item =>
      item.usuario.toLowerCase().includes(term) || item.notebook.toLowerCase().includes(term)
    );
  }

  calcularTiempoRestante(horaLimite: Date): string {
    const ahora = new Date();
    const diferencia = new Date(horaLimite).getTime() - ahora.getTime();
  
    if (diferencia <= 0) return 'Finalizado';
  
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  
    return `${horas}h ${minutos}m`;
  }

  getEstadoLabel(element: any): string {
    const ahora = new Date();
    if (element.estadoPersonalizado) {
      return element.estadoPersonalizado;
    }
    return new Date(element.horaLimite) >= ahora ? 'Activo' : 'Finalizado';
  }

  getEstadoClass(element: any): string {
    const estado = this.getEstadoLabel(element);
    if (estado === 'Activo') return 'text-green-600 font-bold';
    if (estado === 'Pendiente') return 'text-yellow-600 font-bold';
    if (estado === 'Finalizado') return 'text-blue-600 font-bold';
    return 'text-red-600 font-bold';
  }

  editarPrestamo(element: any) {
    this.prestamoSeleccionado = element;
    this.nuevoEstado = this.getEstadoLabel(element);
    this.dialog.open(this.editarModal);
  }

  guardarCambios() {
    if (this.prestamoSeleccionado) {
      if (this.nuevoEstado === 'Finalizado') {
        const finalizado = {
          ...this.prestamoSeleccionado,
          estadoPersonalizado: 'Finalizado',
          fechaFinalizacion: new Date()
        };
        this.historialData.push(finalizado);

        this.prestamosService.eliminarPrestamo(this.prestamoSeleccionado.rut).subscribe(() => {
          this.data = this.data.filter(p => p.rut !== this.prestamoSeleccionado.rut);
          this.applyFilter();
        });
      } else {
        this.prestamosService.actualizarPrestamo(this.prestamoSeleccionado.rut, { estadoPersonalizado: this.nuevoEstado }).subscribe(() => {
          this.prestamoSeleccionado.estadoPersonalizado = this.nuevoEstado;
          this.applyFilter();
        });
      }
      this.dialog.closeAll();
    }
  }

  bloquearAlumno(element: any) {
    if (confirm(`¿Seguro que deseas bloquear a ${element.usuario}?`)) {
      this.prestamosService.sancionarAlumno(element.rut).subscribe(() => {
        alert(`${element.usuario} ha sido bloqueado.`);
        this.sancionados.push(element.rut);
      });
    }
  }
}
