import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmacaoDialogData {
  titulo: string;
  mensagem: string;
  labelSim: string;
  labelNao: string;
  labelVoltar?: string;
}

@Component({
  selector: 'app-confirmacao-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>{{ data.mensagem }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close(false)">{{ data.labelNao }}</button>
      <button mat-flat-button color="primary" (click)="dialogRef.close(true)">{{ data.labelSim }}</button>
    </mat-dialog-actions>
    @if (data.labelVoltar) {
      <div class="voltar-linha">
        <button mat-button (click)="dialogRef.close(undefined)">{{ data.labelVoltar }}</button>
      </div>
    }
  `,
  styles: [`
    h2 { font-size: 18px; }
    mat-dialog-content { font-size: 14px; color: #555; padding: 8px 0 16px; }
    mat-dialog-actions { gap: 8px; padding-bottom: 8px; }
    .voltar-linha { display: flex; justify-content: center; padding-bottom: 12px; }
  `]
})
export class ConfirmacaoDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmacaoDialogComponent>);
  readonly data = inject<ConfirmacaoDialogData>(MAT_DIALOG_DATA);
}
