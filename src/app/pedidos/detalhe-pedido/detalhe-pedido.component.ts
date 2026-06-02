import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidosService } from '../../core/services/pedidos.service';
import { Pedido, ItemPedido, StatusPedido, STATUS_ICON, STATUS_LABEL, getStatusPedido } from '../../core/models/pedido.model';
import { formatDataHora } from '../../core/utils/formatters';

interface ItemEntrega {
  tipoNome: string;
  saboresNomes: string[];
  adicionaisNomes: string[];
  quantidade: number;
  jaEntregue: boolean;
  marcado: boolean;
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

  itens: ItemEntrega[] = this.pedido.itens.map((item: ItemPedido) => ({
    tipoNome: item.tipoNome,
    saboresNomes: item.saboresNomes,
    adicionaisNomes: item.adicionaisNomes,
    quantidade: item.quantidade,
    jaEntregue: item.entregue ?? this.pedido.entregue,
    marcado: item.entregue ?? this.pedido.entregue,
  }));

  get totalItens(): number { return this.itens.length; }
  get marcados(): number { return this.itens.filter(i => i.marcado).length; }
  get todosMarcados(): boolean { return this.marcados === this.totalItens; }
  get algumNovoMarcado(): boolean { return this.itens.some(i => !i.jaEntregue && i.marcado); }

  readonly statusPedido: StatusPedido = getStatusPedido(this.pedido);
  readonly statusLabel: string = STATUS_LABEL[this.statusPedido];
  readonly statusIcon: string = STATUS_ICON[this.statusPedido];
  readonly formatDataHora = formatDataHora;

  async confirmarEntrega(): Promise<void> {
    if (this.saving || !this.algumNovoMarcado) return;
    this.saving = true;
    this.erro = '';
    try {
      const itensAtualizados: ItemPedido[] = this.pedido.itens.map((item, idx) => ({
        ...item,
        entregue: this.itens[idx].marcado,
      }));
      await this.pedidosService.salvarEntregaParcial(this.pedido.id, itensAtualizados);
      this.dialogRef.close(true);
    } catch {
      this.erro = 'Erro ao salvar entrega.';
    } finally {
      this.saving = false;
    }
  }

  fechar(): void {
    this.dialogRef.close(false);
  }
}
