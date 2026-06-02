import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidosService } from '../../core/services/pedidos.service';
import { ItemPedido, resumoItemPedido } from '../../core/models/pedido.model';
import { formatPreco } from '../../core/utils/formatters';

export interface PagamentoData {
  pedidoId: string;
  numero: number;
  nomeCliente: string;
  itens: ItemPedido[];
  total: number;
  origem: string;
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

  valorPago: number | null = null;
  doacao: number | null = null;
  saving = false;
  erro = '';

  get troco(): number | null {
    if (this.valorPago == null) return null;
    return this.valorPago - this.data.total - (this.doacao ?? 0);
  }

  get canConfirmar(): boolean {
    return this.valorPago != null && (this.troco ?? -1) >= 0;
  }

  readonly getResumoItem = resumoItemPedido;
  readonly formatPreco = formatPreco;

  async confirmar(): Promise<void> {
    if (!this.canConfirmar || this.saving) return;
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
