import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidosService } from '../../core/services/pedidos.service';
import { Pedido, ItemPedido, StatusPedido, STATUS_ICON, STATUS_LABEL, getStatusPedido } from '../../core/models/pedido.model';

interface ItemExpandido {
  tipoNome: string;
  saboresNomes: string[];
  adicionaisNomes: string[];
  entregue: boolean;
}

@Component({
  selector: 'app-detalhe-pedido',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatProgressSpinnerModule,
  ],
  templateUrl: './detalhe-pedido.component.html',
  styleUrl: './detalhe-pedido.component.scss',
})
export class DetalhePedidoComponent {
  readonly pedido = inject<Pedido>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<DetalhePedidoComponent>);
  private pedidosService = inject(PedidosService);

  saving = false;
  erro = '';

  itens: ItemExpandido[] = this.pedido.itens.flatMap((item: ItemPedido) =>
    Array.from({ length: item.quantidade }, () => ({
      tipoNome: item.tipoNome,
      saboresNomes: item.saboresNomes,
      adicionaisNomes: item.adicionaisNomes,
      entregue: this.pedido.entregue,
    }))
  );

  get totalItens(): number { return this.itens.length; }
  get marcados(): number { return this.itens.filter(i => i.entregue).length; }
  get todosMarcados(): boolean { return this.marcados === this.totalItens; }

  readonly statusPedido: StatusPedido = getStatusPedido(this.pedido);
  readonly statusLabel: string = STATUS_LABEL[this.statusPedido];
  readonly statusIcon: string = STATUS_ICON[this.statusPedido];

  formatDataHora(data: Date): string {
    return data.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  async concluirEntrega(): Promise<void> {
    if (this.saving || this.pedido.entregue) return;
    this.saving = true;
    this.erro = '';
    try {
      await this.pedidosService.marcarEntregue(this.pedido.id);
      this.dialogRef.close(true);
    } catch {
      this.erro = 'Erro ao concluir entrega.';
    } finally {
      this.saving = false;
    }
  }

  fechar(): void {
    this.dialogRef.close(false);
  }
}
