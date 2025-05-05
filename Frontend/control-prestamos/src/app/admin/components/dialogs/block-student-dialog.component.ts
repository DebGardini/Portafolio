import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-block-student-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule
  ],
  template: `
    <h2 mat-dialog-title>Bloquear Alumno</h2>
    <mat-dialog-content>
      <p>Bloquear al alumno: <strong>{{ data.student }}</strong></p>
      
      <form [formGroup]="blockForm" class="block-form">
        <div class="option-group">
          <label>Duración del bloqueo:</label>
          <mat-radio-group formControlName="durationType" class="duration-options">
            <mat-radio-button value="24h">24 horas</mat-radio-button>
            <mat-radio-button value="2w">2 semanas</mat-radio-button>
            <mat-radio-button value="semester">1 semestre</mat-radio-button>
          </mat-radio-group>
        </div>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción del bloqueo</mat-label>
          <textarea 
            matInput 
            formControlName="description" 
            placeholder="Razón del bloqueo..." 
            rows="4"
          ></textarea>
          <mat-error *ngIf="blockForm.get('description')?.hasError('required')">
            La descripción es obligatoria
          </mat-error>
          <mat-error *ngIf="blockForm.get('description')?.hasError('minlength')">
            La descripción debe tener al menos 5 caracteres
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button 
        mat-raised-button 
        color="warn" 
        [disabled]="blockForm.invalid"
        (click)="onSubmit()"
      >
        Bloquear
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .block-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .option-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 8px;
    }
    label {
      margin-bottom: 8px;
      font-weight: 500;
    }
    .duration-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class BlockStudentDialogComponent {
  blockForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<BlockStudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student: string; studentId: string; loanId?: number }
  ) {
    this.blockForm = this.fb.group({
      durationType: ['24h', Validators.required],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]]
    });
  }

  onSubmit(): void {
    if (this.blockForm.invalid) return;

    const durationType = this.blockForm.value.durationType;
    const description = this.blockForm.value.description;
    
    // Calcular la fecha de finalización según la duración seleccionada
    const now = new Date();
    let finishDate: Date;
    
    switch (durationType) {
      case '24h':
        finishDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
        break;
      case '2w':
        finishDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 semanas
        break;
      case 'semester':
        // Un semestre aproximadamente son 4 meses (120 días)
        finishDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
        break;
      default:
        finishDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Por defecto 24 horas
    }

    this.dialogRef.close({
      description,
      finishDate,
      loanId: this.data.loanId
    });
  }
}