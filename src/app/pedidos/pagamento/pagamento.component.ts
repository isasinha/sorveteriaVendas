import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidosService } from '../../core/services/pedidos.service';
import { ItemPedido, resumoItemPedido } from '../../core/models/pedido.model';
import { formatPreco } from '../../core/utils/formatters';
import { ConfirmacaoDialogComponent } from '../../shared/confirmacao-dialog/confirmacao-dialog.component';

export interface PagamentoData {
  pedidoId: string;
  numero: number;
  nomeCliente: string;
  itens: ItemPedido[];
  total: number;
  origem: string;
  barracaId?: string;
}

@Component({
  selector: 'app-pagamento',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
  ],
  templateUrl: './pagamento.component.html',
  styleUrl: './pagamento.component.scss'
})
export class PagamentoComponent {
  readonly data = inject<PagamentoData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PagamentoComponent>);
  private pedidosService = inject(PedidosService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  valorPago: number | null = null;
  doacao: number | null = null;
  saving = false;
  erro = '';

  get trocoBase(): number | null {
    if (this.valorPago == null) return null;
    return this.valorPago - this.data.total;
  }

  get troco(): number | null {
    if (this.valorPago == null) return null;
    return this.valorPago - this.data.total - (this.doacao ?? 0);
  }

  onValorPagoChange(): void {
    if (this.trocoBase == null || this.trocoBase <= 0) this.doacao = null;
  }

  get canConfirmar(): boolean {
    return this.valorPago != null;
  }

  readonly getResumoItem = resumoItemPedido;
  readonly formatPreco = formatPreco;

  async confirmar(): Promise<void> {
    if (!this.canConfirmar || this.saving) return;
    if (this.troco !== null && this.troco < 0) {
      const ref = this.dialog.open(ConfirmacaoDialogComponent, {
        data: {
          titulo: 'Valor insuficiente',
          mensagem: `O valor pago é menor que o total. Ainda faltam ${this.formatPreco(-this.troco)}. Deseja confirmar mesmo assim?`,
          labelSim: 'Sim, confirmar',
          labelNao: 'Voltar',
        },
        width: '380px',
      });
      const ok = await firstValueFrom(ref.afterClosed());
      if (!ok) return;
    }
    this.saving = true;
    this.erro = '';
    try {
      const doacao = this.doacao && this.doacao > 0 ? this.doacao : undefined;
      await this.pedidosService.marcarPago(this.data.pedidoId, this.valorPago! - (this.doacao ?? 0), doacao);
      this.dialogRef.close(true);
      this.router.navigate(['/pedidos/impressao'], {
        state: {
          numero: this.data.numero,
          nomeCliente: this.data.nomeCliente,
          itens: this.data.itens,
          total: this.data.total,
          origem: this.data.origem,
          barracaId: this.data.barracaId,
        }
      });
    } catch {
      this.erro = 'Erro ao registrar pagamento.';
    } finally {
      this.saving = false;
    }
  }

  fechar(): void {
    this.dialogRef.close(false);
  }
}
