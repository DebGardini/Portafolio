import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTabsModule, MatTabGroup, MatTabChangeEvent } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportesService } from '../../services/reportes.service';
import Chart from 'chart.js/auto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  filterForm: FormGroup;
  
  // Datos para tablas
  equipmentData: any[] = [];
  studentData: any[] = [];
  
  // Columnas para tablas - Eliminada la columna "problemas"
  equipmentColumns: string[] = ['id', 'marca', 'modelo', 'prestamos', 'tiempoPromedio'];
  studentColumns: string[] = ['nombre', 'rut', 'prestamos', 'tiempoPromedio'];
  
  // Indicadores de carga
  loadingEquipment = false;
  loadingStudents = false;
  
  // Variables para métricas
  porcentajeSancionados = 0;
  tiempoPromedioGeneral = 0;
  
  // Referencias a canvas para gráficos y pestañas
  @ViewChild('equipmentChart') equipmentChartRef?: ElementRef;
  @ViewChild('studentChart') studentChartRef?: ElementRef;
  @ViewChild(MatTabGroup) tabGroup?: MatTabGroup;
  
  // Instancias de gráficos
  private equipmentChart?: Chart;
  private studentChart?: Chart;
  
  // Control de subscripciones
  private subscriptions: Subscription[] = [];
  
  // Control del estado de renderizado
  private currentTabIndex = 0;
  private chartRendered = false;
  private studentChartRendered = false;
  
  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService
  ) {
    this.filterForm = this.fb.group({
      periodo: ['week'] // Valor por defecto: última semana
    });
  }

  ngOnInit(): void {
    // Cargar datos iniciales cuando se inicia el componente
    this.loadAllReports();
    
    // Suscribirse a cambios en el filtro
    const filterSub = this.filterForm.get('periodo')?.valueChanges.subscribe(periodo => {
      this.loadAllReports();
    });
    
    if (filterSub) {
      this.subscriptions.push(filterSub);
    }
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      // Suscribirse a los cambios de pestaña
      if (this.tabGroup) {
        const tabSub = this.tabGroup.selectedTabChange.subscribe((event: MatTabChangeEvent) => {
          this.currentTabIndex = event.index;
          console.log('Cambio de pestaña a índice:', this.currentTabIndex);
          
          // Si cambiamos a la pestaña de equipos (índice 0) y tenemos datos, renderizar el gráfico
          if (this.currentTabIndex === 0 && this.equipmentData.length > 0 && !this.chartRendered) {
            console.log('Renderizando gráfico después de cambio de pestaña');
            this.renderEquipmentChartWithRetry();
          }
          
          // Si cambiamos a la pestaña de estudiantes (índice 1) y tenemos datos, renderizar el gráfico
          if (this.currentTabIndex === 1 && this.studentData.length > 0 && !this.studentChartRendered) {
            console.log('Renderizando gráfico de estudiantes después de cambio de pestaña');
            this.renderStudentChart();
          }
        });
        
        this.subscriptions.push(tabSub);
        
        // Si estamos en la pestaña de equipos e intentamos renderizar
        if (this.tabGroup.selectedIndex === 0 && this.equipmentData.length > 0) {
          console.log('Iniciando renderizado de gráfico después de AfterViewInit');
          this.renderEquipmentChartWithRetry();
        }
        
        // Si estamos en la pestaña de estudiantes e intentamos renderizar
        if (this.tabGroup.selectedIndex === 1 && this.studentData.length > 0) {
          console.log('Iniciando renderizado de gráfico de estudiantes después de AfterViewInit');
          this.renderStudentChart();
        }
      }
    }, 100);
  }
  
  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Destruir los gráficos si existen
    if (this.equipmentChart) {
      this.equipmentChart.destroy();
    }
    if (this.studentChart) {
      this.studentChart.destroy();
    }
  }
  
  /**
   * Carga todos los reportes según el período seleccionado
   */
  loadAllReports(): void {
    const periodo = this.filterForm.get('periodo')?.value || 'week';
    this.loadEquipmentReport(periodo);
    this.loadStudentReport(periodo);
  }
  
  /**
   * Carga el reporte de uso de equipos
   */
  loadEquipmentReport(periodo: string): void {
    this.loadingEquipment = true;
    this.chartRendered = false;
    
    // Si había un gráfico previo, destruirlo
    if (this.equipmentChart) {
      this.equipmentChart.destroy();
      this.equipmentChart = undefined;
    }
    
    this.reportesService.getEquipmentUsageData(periodo).subscribe({
      next: (data) => {
        this.equipmentData = data.notebooks;
        this.loadingEquipment = false;
        
        // Solo intentamos renderizar si estamos en la pestaña correcta
        if (this.tabGroup && this.tabGroup.selectedIndex === 0) {
          console.log('Datos cargados. Intentando renderizar gráfico...');
          setTimeout(() => {
            this.renderEquipmentChartWithRetry();
          }, 300);
        }
      },
      error: (error) => {
        console.error('Error al cargar datos de uso de equipos', error);
        this.loadingEquipment = false;
      }
    });
  }
  
  /**
   * Renderiza el gráfico con reintentos
   */
  renderEquipmentChartWithRetry(retry = 3): void {
    if (retry <= 0) {
      console.error('No se pudo renderizar el gráfico después de múltiples intentos');
      return;
    }
    
    if (!this.equipmentChartRef) {
      console.log('Canvas no disponible. Reintentando en 300ms... Intentos restantes:', retry);
      setTimeout(() => this.renderEquipmentChartWithRetry(retry - 1), 300);
      return;
    }
    
    // Verificar que el elemento tenga dimensiones
    const canvas = this.equipmentChartRef.nativeElement;
    const parent = canvas.parentElement;
    if (!parent || parent.offsetWidth === 0 || parent.offsetHeight === 0) {
      console.log('El contenedor del canvas no tiene dimensiones. Reintentando en 300ms... Intentos restantes:', retry);
      setTimeout(() => this.renderEquipmentChartWithRetry(retry - 1), 300);
      return;
    }
    
    // Proceder a renderizar
    this.renderEquipmentChart();
  }
  
  /**
   * Carga el reporte de estadísticas de estudiantes
   */
  loadStudentReport(periodo: string): void {
    this.loadingStudents = true;
    this.studentChartRendered = false;
    
    // Si había un gráfico previo, destruirlo
    if (this.studentChart) {
      this.studentChart.destroy();
      this.studentChart = undefined;
    }
    
    this.reportesService.getStudentStatsData(periodo).subscribe({
      next: (data) => {
        this.studentData = data.topEstudiantes;
        this.porcentajeSancionados = data.porcentajeEstudiantesSancionados;
        this.tiempoPromedioGeneral = data.tiempoPromedioGeneral;
        this.loadingStudents = false;
        
        // Solo intentamos renderizar si estamos en la pestaña correcta
        if (this.tabGroup && this.tabGroup.selectedIndex === 1) {
          console.log('Datos de estudiantes cargados. Intentando renderizar gráfico...');
          setTimeout(() => {
            this.renderStudentChartWithRetry();
          }, 300);
        }
      },
      error: (error) => {
        console.error('Error al cargar estadísticas de estudiantes', error);
        this.loadingStudents = false;
      }
    });
  }
  
  /**
   * Renderiza el gráfico de uso de equipos
   */
  renderEquipmentChart(): void {
    // Asegurarse de que hay datos y que el canvas existe
    if (!this.equipmentData.length || !this.equipmentChartRef) {
      console.warn('No se puede renderizar el gráfico: sin datos o canvas no disponible');
      return;
    }
    
    console.log('Renderizando gráfico con', this.equipmentData.length, 'elementos');
    
    try {
      // Destruir el gráfico anterior si existe
      if (this.equipmentChart) {
        this.equipmentChart.destroy();
      }
      
      // Datos para el gráfico - usar ID para hacer los labels únicos
      const labels = this.equipmentData.map(item => `${item.marca} ${item.modelo} (ID: ${item.id})`);
      const data = this.equipmentData.map(item => item.prestamos);
      
      // Definir explícitamente las dimensiones del canvas
      const canvas = this.equipmentChartRef.nativeElement;
      const parent = canvas.parentElement;
      
      // Asegurarse de que el contenedor tenga suficiente altura
      if (parent && parent.style) {
        if (window.innerWidth >= 1100) {
          parent.style.height = '450px';
        } else {
          parent.style.height = '350px';
        }
      }
      
      // Crear nuevo gráfico
      this.equipmentChart = new Chart(
        canvas,
        {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Número de préstamos',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            animation: {
              duration: 500
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
              }
            }
          }
        }
      );
      
      this.chartRendered = true;
      console.log('Gráfico renderizado exitosamente');
    } catch (error) {
      console.error('Error al renderizar el gráfico:', error);
    }
  }
  
  /**
   * Renderiza el gráfico de estadísticas de estudiantes
   */
  renderStudentChart(): void {
    // Asegurarse de que hay datos y que el canvas existe
    if (!this.studentData.length || !this.studentChartRef) {
      console.warn('No se puede renderizar el gráfico de estudiantes: sin datos o canvas no disponible');
      return;
    }
    
    console.log('Renderizando gráfico de estudiantes con', this.studentData.length, 'elementos');
    
    try {
      // Destruir el gráfico anterior si existe
      if (this.studentChart) {
        this.studentChart.destroy();
      }
      
      // Datos para el gráfico - usar préstamos en lugar de bloqueos para el gráfico
      const labels = this.studentData.map(item => item.nombre);
      const data = this.studentData.map(item => item.prestamos); // Mostrar número de préstamos
      
      // Definir explícitamente las dimensiones del canvas
      const canvas = this.studentChartRef.nativeElement;
      const parent = canvas.parentElement;
      
      // Asegurarse de que el contenedor tenga suficiente altura
      if (parent && parent.style) {
        if (window.innerWidth >= 1100) {
          parent.style.height = '450px';
        } else {
          parent.style.height = '350px';
        }
      }
      
      // Crear nuevo gráfico
      this.studentChart = new Chart(
        canvas,
        {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Número de préstamos', // Etiqueta actualizada para reflejar lo que muestra
                data: data,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            animation: {
              duration: 500
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
              }
            }
          }
        }
      );
      
      this.studentChartRendered = true;
      console.log('Gráfico de estudiantes renderizado exitosamente');
    } catch (error) {
      console.error('Error al renderizar el gráfico de estudiantes:', error);
    }
  }
  
  /**
   * Renderiza el gráfico con reintentos
   */
  renderStudentChartWithRetry(retry = 3): void {
    if (retry <= 0) {
      console.error('No se pudo renderizar el gráfico de estudiantes después de múltiples intentos');
      return;
    }
    
    if (!this.studentChartRef) {
      console.log('Canvas de estudiantes no disponible. Reintentando en 300ms... Intentos restantes:', retry);
      setTimeout(() => this.renderStudentChartWithRetry(retry - 1), 300);
      return;
    }
    
    // Verificar que el elemento tenga dimensiones
    const canvas = this.studentChartRef.nativeElement;
    const parent = canvas.parentElement;
    if (!parent || parent.offsetWidth === 0 || parent.offsetHeight === 0) {
      console.log('El contenedor del canvas de estudiantes no tiene dimensiones. Reintentando en 300ms... Intentos restantes:', retry);
      setTimeout(() => this.renderStudentChartWithRetry(retry - 1), 300);
      return;
    }
    
    // Proceder a renderizar
    this.renderStudentChart();
  }
  
  /**
   * Exportar datos a Excel
   */
  exportarExcel(reportType: string): void {
    const periodo = this.filterForm.get('periodo')?.value || 'week';
    this.reportesService.exportToExcel(reportType, periodo).subscribe({
      next: (blob) => {
        // Crear un enlace temporal para descargar el archivo
        const extension = 'xlsx'; // Extensión correcta para Excel
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = '';
        if (reportType === 'equipment') {
          filename = `reporte_uso_equipos_${periodo}.${extension}`;
        } else if (reportType === 'students') {
          filename = `reporte_estudiantes_${periodo}.${extension}`;
        } else {
          filename = `reporte_${reportType}_${periodo}.${extension}`;
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        console.error('Error al exportar a Excel:', error);
        alert('Error al exportar. Por favor, verifica que existan datos para exportar e intenta nuevamente.');
      }
    });
  }
  
  /**
   * Exportar datos a PDF
   */
  exportarPDF(reportType: string): void {
    const periodo = this.filterForm.get('periodo')?.value || 'week';
    this.reportesService.exportToPDF(reportType, periodo).subscribe({
      next: (blob) => {
        // Crear un enlace temporal para descargar el archivo
        const extension = 'pdf'; // Extensión correcta para PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let filename = '';
        if (reportType === 'equipment') {
          filename = `reporte_uso_equipos_${periodo}.${extension}`;
        } else if (reportType === 'students') {
          filename = `reporte_estudiantes_${periodo}.${extension}`;
        } else {
          filename = `reporte_${reportType}_${periodo}.${extension}`;
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        console.error('Error al exportar a PDF:', error);
        alert('Error al exportar. Por favor, verifica que existan datos para exportar e intenta nuevamente.');
      }
    });
  }
}