import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, forkJoin, from, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

// Interfaces para tipado estricto
interface NotebookStats {
  id: number;
  marca: string;
  modelo: string;
  serialNumber: string;
  prestamos: number;
  tiempoPromedio: number;
}

interface StudentStats {
  id: number;
  nombre: string;
  rut: string;
  bloqueos: number;
  prestamos: number;
  tiempoPromedio: number;
}

interface Loan {
  id?: number;
  notebookId: number;
  studentRut: number;
  beginDate: string;
  endDate?: string | null;
  loanState: number;
  [key: string]: any;
}

interface Student {
  rut: number;
  dv: string;
  name: string;
  lastname: string;
  blocked: boolean;
  [key: string]: any;
}

interface Notebook {
  id: number;
  brand: string;
  model: string;
  serialNumber: string;
  available: boolean;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene datos de uso de equipos utilizando endpoints existentes
   * @param periodo Periodo de tiempo (day, week, month, semester)
   */
  getEquipmentUsageData(periodo: string): Observable<{ notebooks: NotebookStats[] }> {
    
    // Obtenemos préstamos activos
    const activeLoansObs = this.http.get(`${this.apiUrl}/loans/active/all`).pipe(
      map(response => this.processApiResponse<Loan>(response)),
      catchError(error => {
        console.warn('No hay préstamos activos o error al obtenerlos:', error);
        return of([]);
      })
    );

    // Obtenemos préstamos devueltos
    const returnedLoansObs = this.http.get(`${this.apiUrl}/loans/returned/all`).pipe(
      map(response => this.processApiResponse<Loan>(response)),
      catchError(error => {
        console.warn('No hay préstamos devueltos o error al obtenerlos:', error);
        return of([]);
      })
    );

    // Obtenemos la lista de notebooks
    const notebooksObs = this.http.get(`${this.apiUrl}/notebooks/all`).pipe(
      map(response => this.processApiResponse<Notebook>(response)),
      catchError(error => {
        console.error('Error al obtener la lista de notebooks:', error);
        return of([]);
      })
    );

    // combinamos los resultados cuando todos estén disponibles
    return forkJoin({
      activeLoans: activeLoansObs,
      returnedLoans: returnedLoansObs,
      notebooks: notebooksObs
    }).pipe(
      map(({ activeLoans, returnedLoans, notebooks }) => {
        // Combinar todos los préstamos
        const allLoans = [...activeLoans, ...returnedLoans];
        
        console.log(`Total préstamos cargados: ${allLoans.length} (Activos: ${activeLoans.length}, Devueltos: ${returnedLoans.length})`);
        
        // Filtrar por el periodo seleccionado
        const startDate = this.getStartDateByPeriod(periodo);
        
        console.log(`Filtrando préstamos desde: ${startDate.toISOString()}, período: ${periodo}`);
        
        // Asegurarse de que filtramos correctamente con la fecha ISO para comparaciones precisas
        const filteredLoans = allLoans.filter(loan => {
          const loanDate = new Date(loan.beginDate);
          const result = loanDate >= startDate;
          return result;
        });
        
        console.log(`Total de préstamos después del filtrado: ${filteredLoans.length} de ${allLoans.length}`);

        // Procesamiento de estadísticas por notebook
        const notebooksStats = notebooks.map(notebook => {
          const notebookLoans = filteredLoans.filter(loan => loan.notebookId === notebook.id);
          
          // Calcular tiempo promedio solo para préstamos completados
          const completedLoans = notebookLoans.filter(loan => loan.endDate);
          const avgTime = completedLoans.length > 0 
            ? completedLoans.reduce((sum: number, loan: Loan) => {
                const beginDate = new Date(loan.beginDate);
                const endDate = new Date(loan.endDate as string);
                return sum + (endDate.getTime() - beginDate.getTime()) / (1000 * 60); // en minutos
              }, 0) / completedLoans.length
            : 0;
          
          return {
            id: notebook.id,
            marca: notebook.brand,
            modelo: notebook.model,
            serialNumber: notebook.serialNumber,
            prestamos: notebookLoans.length,
            tiempoPromedio: Math.round(avgTime)
          };
        }).sort((a, b) => b.prestamos - a.prestamos); // Ordenar por más préstamos primero

        return { notebooks: notebooksStats };
      }),
      catchError(error => {
        console.error('Error obteniendo datos de uso de equipos:', error);
        return of({ notebooks: [] });
      })
    );
  }

  /**
   * Obtiene datos de estadísticas de estudiantes utilizando endpoints existentes
   * @param periodo Periodo de tiempo (day, week, month, semester)
   */
  getStudentStatsData(periodo: string): Observable<{ 
    topEstudiantes: StudentStats[], 
    porcentajeEstudiantesSancionados: number, 
    tiempoPromedioGeneral: number 
  }> {
    console.log('Obteniendo estadísticas de estudiantes para período:', periodo);
    
    // Obtenemos préstamos activos
    const activeLoansObs = this.http.get(`${this.apiUrl}/loans/active/all`).pipe(
      map(response => this.processApiResponse<Loan>(response)),
      tap(data => console.log('Préstamos activos obtenidos:', data.length)),
      catchError(error => {
        console.warn('No hay préstamos activos o error al obtenerlos:', error);
        return of([]);  
      })
    );

    // Obtenemos préstamos devueltos
    const returnedLoansObs = this.http.get(`${this.apiUrl}/loans/returned/all`).pipe(
      map(response => this.processApiResponse<Loan>(response)),
      tap(data => console.log('Préstamos devueltos obtenidos:', data.length)),
      catchError(error => {
        console.warn('No hay préstamos devueltos o error al obtenerlos:', error);
        return of([]);  
      })
    );

    // Obtenemos la lista de estudiantes bloqueados
    const blockedStudentsObs = this.http.get(`${this.apiUrl}/sanctions/blocked`).pipe(
      map(response => this.processApiResponse<Student>(response)),
      tap(data => console.log('Estudiantes bloqueados obtenidos:', data.length)),
      catchError(error => {
        console.warn('Error al obtener estudiantes bloqueados:', error);
        return of([]);
      })
    );

    // combinamos los resultados cuando todos estén disponibles
    return forkJoin({
      activeLoans: activeLoansObs,
      returnedLoans: returnedLoansObs,
      blockedStudents: blockedStudentsObs
    }).pipe(
      switchMap(({ activeLoans, returnedLoans, blockedStudents }) => {
        // Combinar todos los préstamos
        const allLoans = [...activeLoans, ...returnedLoans];
        
        console.log(`Estadísticas de estudiantes - Total préstamos cargados: ${allLoans.length} (Activos: ${activeLoans.length}, Devueltos: ${returnedLoans.length})`);
        console.log(`Estudiantes bloqueados: ${blockedStudents.length}`);
        
        // Filtrar por el periodo seleccionado
        const startDate = this.getStartDateByPeriod(periodo);
        console.log('Fecha de inicio del filtrado:', startDate.toISOString());
        
        const filteredLoans = allLoans.filter(loan => {
          const loanDate = new Date(loan.beginDate);
          return loanDate >= startDate;
        });
        
        console.log(`Total préstamos después del filtrado: ${filteredLoans.length}`);

        // Extraer RUTs únicos de los préstamos filtrados
        const uniqueStudentRuts = Array.from(new Set(filteredLoans.map(loan => {
          const rutStudiante = typeof loan.studentRut === 'string' ? 
            parseInt(loan.studentRut as string) : loan.studentRut;
          return rutStudiante;
        })));
        
        console.log(`RUTs únicos de estudiantes encontrados: ${uniqueStudentRuts.length}`);
        
        if (uniqueStudentRuts.length === 0) {
          return of({
            topEstudiantes: [],
            porcentajeEstudiantesSancionados: 0,
            tiempoPromedioGeneral: 0
          });
        }
        
        // Obtener información detallada de cada estudiante
        const studentObservables = uniqueStudentRuts.map(rut => 
          this.http.get(`${this.apiUrl}/students/rut/${rut}`).pipe(
            map(response => this.processApiResponse<Student>(response)[0] || null),
            catchError(error => {
              console.warn(`Error al obtener información del estudiante con RUT ${rut}:`, error);
              return of(null);
            })
          )
        );
        
        return forkJoin(studentObservables).pipe(
          map(studentsData => {
            // Filtrar estudiantes nulos (que no se pudieron obtener)
            const students = studentsData.filter((student): student is Student => student !== null);
            console.log(`Información de estudiantes obtenida: ${students.length} de ${uniqueStudentRuts.length}`);
            
            // Crear un mapa de estudiantes por RUT para acceder rápidamente a sus datos
            const studentsMap: Record<number, Student> = {};
            students.forEach(student => {
              // Asegurar que el RUT sea tratado como número
              const rutNumber = typeof student.rut === 'string' ? parseInt(student.rut) : student.rut;
              studentsMap[rutNumber] = student;
            });
            
            console.log(`Mapa de estudiantes creado con ${Object.keys(studentsMap).length} entradas`);

            // Agrupar préstamos por estudiante
            const studentLoansMap: Record<number, Loan[]> = {};
            filteredLoans.forEach(loan => {
              // Asegurar que el RUT del estudiante sea tratado como número
              const rutStudiante = typeof loan.studentRut === 'string' ? 
                parseInt(loan.studentRut as string) : loan.studentRut;
                
              if (!studentLoansMap[rutStudiante]) {
                studentLoansMap[rutStudiante] = [];
              }
              studentLoansMap[rutStudiante].push(loan);
            });
            
            console.log(`Mapa de préstamos por estudiante creado con ${Object.keys(studentLoansMap).length} estudiantes`);

            // Generar estadísticas de top estudiantes
            let topEstudiantes = Object.keys(studentLoansMap).map(rut => {
              const rutNum = parseInt(rut);
              const loans = studentLoansMap[rutNum];
              const student = studentsMap[rutNum];
              
              if (!student) {
                console.warn(`Estudiante con RUT ${rutNum} no encontrado en la base de datos pero tiene préstamos`);
                return null;
              }

              // Calcular tiempo promedio solo para préstamos completados
              const completedLoans = loans.filter(loan => loan.endDate);
              const avgTime = completedLoans.length > 0 
                ? completedLoans.reduce((sum: number, loan: Loan) => {
                    const beginDate = new Date(loan.beginDate);
                    const endDate = new Date(loan.endDate as string);
                    return sum + (endDate.getTime() - beginDate.getTime()) / (1000 * 60); // en minutos
                  }, 0) / completedLoans.length
                : 0;
              
              // Verificar si el estudiante está bloqueado
              const isBlocked = blockedStudents.some(
                blockedStudent => 
                  (typeof blockedStudent.rut === 'string' ? 
                    parseInt(blockedStudent.rut) : blockedStudent.rut) === rutNum
              );
              
              const blockCount = isBlocked ? 1 : 0;
              
              return {
                id: student['id'] || rutNum, 
                nombre: `${student.name} ${student.lastname}`,
                rut: `${student.rut}-${student.dv}`,
                bloqueos: blockCount,
                prestamos: loans.length,
                tiempoPromedio: Math.round(avgTime)
              };
            }).filter((item): item is StudentStats => item !== null);
            
            // Ordenar por número de préstamos y tomar los top 10
            topEstudiantes = topEstudiantes
              .sort((a, b) => b.prestamos - a.prestamos)
              .slice(0, 10);
            
            console.log(`Top estudiantes generados: ${topEstudiantes.length}`);
            console.log('Primer estudiante del top:', topEstudiantes.length > 0 ? topEstudiantes[0] : 'Ninguno');

            // Calcular porcentaje de estudiantes sancionados
            const totalEstudiantes = students.length;
            const estudiantesSancionados = blockedStudents.length;
            const porcentajeSancionados = totalEstudiantes > 0 
              ? (estudiantesSancionados / totalEstudiantes) * 100 
              : 0;
            
            console.log(`Porcentaje de estudiantes sancionados: ${porcentajeSancionados}% (${estudiantesSancionados} de ${totalEstudiantes})`);

            // Calcular tiempo promedio general de préstamos
            const completedLoans = filteredLoans.filter(loan => loan.endDate);
            const tiempoPromedioGeneral = completedLoans.length > 0 
              ? completedLoans.reduce((sum: number, loan: Loan) => {
                  const beginDate = new Date(loan.beginDate);
                  const endDate = new Date(loan.endDate as string);
                  return sum + (endDate.getTime() - beginDate.getTime()) / (1000 * 60);
                }, 0) / completedLoans.length
              : 0;
            
            console.log(`Tiempo promedio general: ${tiempoPromedioGeneral} minutos (${completedLoans.length} préstamos completados)`);

            return {
              topEstudiantes,
              porcentajeEstudiantesSancionados: Math.round(porcentajeSancionados * 10) / 10, 
              tiempoPromedioGeneral: Math.round(tiempoPromedioGeneral * 10) / 10 
            };
          }),
          catchError(error => {
            console.error('Error al procesar datos de estudiantes:', error);
            return of({
              topEstudiantes: [],
              porcentajeEstudiantesSancionados: 0,
              tiempoPromedioGeneral: 0
            });
          })
        );
      }),
      catchError(error => {
        console.error('Error obteniendo estadísticas de estudiantes:', error);
        return of({
          topEstudiantes: [],
          porcentajeEstudiantesSancionados: 0,
          tiempoPromedioGeneral: 0
        });
      })
    );
  }

  /**
   * Exporta reporte a formato Excel (XLSX)
   * @param reporteId Identificador del reporte
   * @param periodo Periodo de tiempo
   */
  exportToExcel(reporteId: string, periodo: string): Observable<Blob> {
    // Obtener los datos según el tipo de reporte
    return this.generateExportData(reporteId, periodo).pipe(
      switchMap(data => {
        if (!data || data.length === 0) {
          throw new Error('No hay datos disponibles para exportar');
        }
        
        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Control de Préstamos';
        workbook.lastModifiedBy = 'Sistema de Control de Préstamos';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        // Nombre del reporte para el título
        const reportName = reporteId === 'equipment' 
          ? 'Reporte de Uso de Equipos' 
          : 'Reporte de Estadísticas de Estudiantes';
        
        // Periodo para incluir en el reporte
        const periodName = this.getPeriodoNombre(periodo);
        
        // Crear una hoja de trabajo
        const worksheet = workbook.addWorksheet('Reporte');
        
        // Añadir título y metadatos
        worksheet.addRow([reportName]);
        worksheet.getRow(1).font = { bold: true, size: 16 };
        worksheet.addRow(['Periodo:', periodName]);
        worksheet.addRow(['Fecha de exportación:', new Date().toLocaleString()]);
        worksheet.addRow([]);
        
        // Obtener las columnas
        const headers = Object.keys(data[0]);
        
        
        const headerTranslations: Record<string, string> = {
          'id': 'ID',
          'marca': 'Marca',
          'modelo': 'Modelo',
          'serialNumber': 'Número de Serie',
          'prestamos': 'Número de Préstamos',
          'tiempoPromedio': 'Tiempo Promedio (min)',
          'nombre': 'Nombre Completo',
          'rut': 'RUT'
        };
        
        
        const headerRow = worksheet.addRow(headers.map(header => headerTranslations[header] || header));
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Añadir datos
        data.forEach(item => {
          const rowData = headers.map(header => item[header]);
          worksheet.addRow(rowData);
        });
        
        
        if (worksheet.columns) {
          worksheet.columns.forEach(column => {
            if (column && typeof column.eachCell === 'function') {
              let maxLength = 0;
              column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                  maxLength = columnLength;
                }
              });
              column.width = Math.min(maxLength + 2, 30);
            }
          });
        }
        
        // Si es reporte de equipos y hay suficientes datos, crear un gráfico
        if (reporteId === 'equipment' && data.length > 0) {
          const chartSheet = workbook.addWorksheet('Gráfico');
          chartSheet.addRow(['Equipo', 'Préstamos']);
          
          // Añadir datos para el gráfico
          data.forEach(item => {
            chartSheet.addRow([`${item.marca} ${item.modelo} (ID: ${item.id})`, item.prestamos]);
          });
          
          // ExcelJS en el navegador no puede crear gráficos directamente
          // Se añaden los datos en una hoja separada para que el usuario pueda crear el gráfico manualmente
          chartSheet.addRow([]);
          chartSheet.addRow(['Nota: Para visualizar el gráfico, seleccione los datos y utilice la función "Insertar gráfico" de Excel']);
        }
        
        // Convertir la Promise en Observable
        return from(workbook.xlsx.writeBuffer().then(buffer => {
          return new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
        }));
      }),
      catchError(error => {
        console.error('Error exportando a Excel:', error);
        throw new Error('Error al generar el archivo Excel');
      })
    );
  }

  /**
   * Exporta reporte a formato PDF
   * @param reporteId Identificador del reporte
   * @param periodo Periodo de tiempo
   */
  exportToPDF(reporteId: string, periodo: string): Observable<Blob> {
    // Si es el reporte de equipos, incluir también los datos del gráfico
    const exportObservable: Observable<{ 
      tableData: any[]; 
      chartData?: { label: string; value: number; }[];
      metadata?: { porcentajeEstudiantesSancionados: number; tiempoPromedioGeneral: number; };
    }> = reporteId === 'equipment' 
      ? this.getEquipmentUsageData(periodo).pipe(
          map(data => ({
            tableData: data.notebooks,
            chartData: data.notebooks.map(item => ({
              label: `${item.marca} ${item.modelo} (ID: ${item.id})`,
              value: item.prestamos
            }))
          }))
        )
      : this.getStudentStatsData(periodo).pipe(
          map(data => ({
            tableData: data.topEstudiantes,
            chartData: data.topEstudiantes.map(item => ({
              label: item.nombre,
              value: item.prestamos
            })), // Añadir datos para el gráfico de estudiantes también
            metadata: {
              porcentajeEstudiantesSancionados: data.porcentajeEstudiantesSancionados,
              tiempoPromedioGeneral: data.tiempoPromedioGeneral
            }
          }))
        );

    return exportObservable.pipe(
      map(result => {
        const data = result.tableData;
        
        if (!data || data.length === 0) {
          throw new Error('No hay datos disponibles para exportar');
        }
        
        // Crear un nuevo documento PDF
        try {
          const doc = new jsPDF();
          
          // Configurar título y metadatos
          const reportName = reporteId === 'equipment' 
            ? 'REPORTE DE USO DE EQUIPOS' 
            : 'REPORTE DE ESTADÍSTICAS DE ESTUDIANTES';
          
          const periodName = this.getPeriodoNombre(periodo);
      
          
          // Título y metadatos
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(reportName, 14, 20);
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.text(`Periodo: ${periodName}`, 14, 30);
          doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 14, 37);
          
          // Si es reporte de estudiantes, incluir estadísticas generales
          let yPos = 50;
          
          if (reporteId === 'students' && result.metadata) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('ESTADÍSTICAS GENERALES', 14, yPos);
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Porcentaje de Estudiantes Sancionados: ${result.metadata.porcentajeEstudiantesSancionados}%`, 14, yPos + 10);
            doc.text(`Tiempo Promedio General de Préstamo: ${result.metadata.tiempoPromedioGeneral} minutos`, 14, yPos + 17);
            
            yPos = 75; // Actualizar posición vertical
          }
          
          
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.text('DATOS DETALLADOS', 14, yPos);
          
          
          const headers = Object.keys(data[0]);
          
          
          const headerTranslations: Record<string, string> = {
            'id': 'ID',
            'marca': 'Marca',
            'modelo': 'Modelo',
            'serialNumber': 'No. Serie',
            'prestamos': 'Préstamos',
            'tiempoPromedio': 'T. Prom (min)',
            'nombre': 'Nombre',
            'rut': 'RUT',
            'bloqueos': 'Bloqueos'
          };
          
          
          const tableHeaders = headers.map(header => headerTranslations[header] || header);
          
          // Crear cuerpo de la tabla
          const tableBody = data.map(item => 
            headers.map(header => item[header])
          );
          
          
          const maxRows = Math.min(data.length, 20);
          
          
          const startY = yPos + 10;
          
          // Determinar ancho máximo de página disponible
          const pageWidth = doc.internal.pageSize.getWidth();
          const margin = 14;
          const tableWidth = pageWidth - (margin * 2);
          
          // Calcular ancho proporcional para cada columna
          const colWidths = headers.map((header, index) => {
            
            if (header === 'id') {
              return tableWidth * 0.05; 
            }
            if (['prestamos', 'bloqueos'].includes(header)) {
              return tableWidth * 0.12; 
            }
            if (header === 'tiempoPromedio') {
              return tableWidth * 0.15; 
            }
            if (['serialNumber', 'rut'].includes(header)) {
              return tableWidth * 0.13; 
            }
            if (['marca', 'modelo'].includes(header)) {
              return tableWidth * 0.15; 
            }
            if (header === 'nombre') {
              return tableWidth * 0.25;
            }
            // Valor por defecto para otras columnas
            return tableWidth * (1 / headers.length);
          });
          
          
          doc.setFillColor(230, 230, 230);
          doc.setDrawColor(0);
          doc.setLineWidth(0.1);
          
          
          doc.rect(margin, startY, tableWidth, 8, 'F');
          
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(0);
          
          let xOffset = margin;
          tableHeaders.forEach((header, index) => {
            doc.text(header, xOffset + 2, startY + 5);
            xOffset += colWidths[index];
          });
          
          
          doc.setFont('helvetica', 'normal');
          let rowY = startY + 8;
          
          // Verificar si necesitamos una nueva página
          const checkAndAddPage = (y: number) => {
            if (y > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              return 20; 
            }
            return y;
          };
          
          tableBody.forEach((row, rowIndex) => {
            rowY = checkAndAddPage(rowY);
            
            
            if (rowIndex % 2 === 1) {
              doc.setFillColor(245, 245, 245);
              doc.rect(margin, rowY, tableWidth, 8, 'F');
            }
            
            xOffset = margin;
            row.forEach((cell, cellIndex) => {
              doc.text(String(cell), xOffset + 2, rowY + 5);
              xOffset += colWidths[cellIndex];
            });
            
            rowY += 8;
          });
          
          // Crear gráfico para cualquier tipo de reporte que tenga datos de gráfico
          if (result.chartData && result.chartData.length > 0) {
            
            if (rowY > doc.internal.pageSize.getHeight() - 60) {
              doc.addPage();
              rowY = 20;
            } else {
              rowY += 10;
            }
            
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('REPRESENTACIÓN GRÁFICA DE PRÉSTAMOS', 14, rowY);
            
            rowY += 10;
            
            // Ordenar por número de préstamos descendente
            const sortedData = [...result.chartData].sort((a, b) => b.value - a.value);
            
            // Encontrar el valor máximo para escalar
            const maxValue = Math.max(...sortedData.map(item => item.value));
            const barMaxWidth = 100; // Ancho máximo de la barra en puntos
            
            // Color de gráfico según tipo de reporte
            const graphColor = reporteId === 'equipment' 
              ? { r: 75, g: 192, b: 192 }  
              : { r: 255, g: 99, b: 132 }; 
            
            // Dibujar gráfico de barras simple
            sortedData.forEach((item, index) => {
              if (index < 10) { 
                const barWidth = (item.value / maxValue) * barMaxWidth;
                
                // Dibujar etiqueta
                const label = item.label.length > 25 ? item.label.substring(0, 22) + '...' : item.label;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.text(label, margin, rowY + (index * 8));
                
                // Dibujar barra
                doc.setFillColor(graphColor.r, graphColor.g, graphColor.b);
                doc.rect(margin + 70, rowY + (index * 8) - 4, barWidth, 5, 'F');
                
                // Valor
                doc.setFont('helvetica', 'bold');
                doc.text(String(item.value), margin + 70 + barWidth + 5, rowY + (index * 8));
              }
            });
          }
          
          // Añadir pie de página
          const totalPages = (doc.internal as any).getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text(`Página ${i} de ${totalPages} - Sistema de Control de Préstamos`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { 
              align: 'center' 
            });
          }
          
          // Convertir a Blob
          const blob = doc.output('blob');
          return blob;
        } catch (error) {
          console.error('Error generando el documento PDF:', error);
          throw new Error('Error al generar el archivo PDF');
        }
      }),
      catchError(error => {
        console.error('Error exportando a PDF:', error);
        throw new Error('Error al generar el archivo PDF');
      })
    );
  }

  /**
   * Obtiene el nombre del período para los reportes
   */
  private getPeriodoNombre(periodo: string): string {
    switch(periodo) {
      case 'day': return 'Último día';
      case 'week': return 'Última semana';
      case 'month': return 'Último mes';
      case 'semester': return 'Último semestre';
      default: return periodo;
    }
  }

  /**
   * Genera datos para exportación según el tipo de reporte
   */
  private generateExportData(reporteId: string, periodo: string): Observable<any[]> {
    switch(reporteId) {
      case 'equipment':
        return this.getEquipmentUsageData(periodo).pipe(
          map(data => data.notebooks)
        );
      case 'students':
        return this.getStudentStatsData(periodo).pipe(
          map(data => data.topEstudiantes)
        );
      default:
        return of([]);
    }
  }

  /**
   * Procesa la respuesta de la API para manejar diferentes formatos de respuesta
   */
  private processApiResponse<T>(response: any): T[] {
    if (!response) return [];
    
    // Manejar respuestas con formato $values
    if (response.$values && Array.isArray(response.$values)) {
      return response.$values as T[];
    }
    
    // Manejar arrays directos
    if (Array.isArray(response)) {
      return response as T[];
    }
    
    // Manejar objeto simple
    return [response] as T[];
  }

  /**
   * Determina la fecha de inicio según el período seleccionado
   */
  private getStartDateByPeriod(period: string): Date {
    const now = new Date();
    let result: Date;
    
    switch(period.toLowerCase()) {
      case 'day':
        result = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'week':
        result = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        result = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'semester':
        result = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      default:
        result = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); // Semana por defecto
    }
    
    // Resetear la hora a 00:00:00 para comparaciones más precisas
    result.setHours(0, 0, 0, 0);
    return result;
  }
}
