import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidosService } from '../../core/services/pedidos.service';
import { Pedido, ItemPedido, StatusPedido, STATUS_ICON, STATUS_LABEL, getStatusPedido } from '../../core/models/pedido.model';
import { formatDataHora } from '../../core/utils/formatters';
import { ConfirmacaoDialogComponent } from '../../shared/confirmacao-dialog/confirmacao-dialog.component';

interface ItemEntrega {
  tipoNome: string;
  saboresNomes: string[];
  adicionaisNomes: string[];
  quantidade: number;
  quantidadeJaEntregue: number;
  quantidadeParaEntregar: number;
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
  private dialog = inject(MatDialog);
  private pedidosService = inject(PedidosService);

  saving = false;
  erro = '';

  itens: ItemEntrega[] = this.pedido.itens.map((item: ItemPedido) => ({
    tipoNome: item.tipoNome,
    saboresNomes: item.saboresNomes,
    adicionaisNomes: item.adicionaisNomes,
    quantidade: item.quantidade,
    quantidadeJaEntregue: item.quantidadeEntregue ?? ((item.entregue ?? this.pedido.entregue) ? item.quantidade : 0),
    quantidadeParaEntregar: 0,
  }));

  get totalItens(): number { return this.itens.length; }
  get marcados(): number { return this.itens.filter(i => this.estaCompleto(i)).length; }
  get todosMarcados(): boolean { return this.marcados === this.totalItens; }
  get algumNovoMarcado(): boolean { return this.itens.some(i => i.quantidadeParaEntregar > 0); }

  estaCompleto(item: ItemEntrega): boolean {
    return item.quantidadeJaEntregue + item.quantidadeParaEntregar >= item.quantidade;
  }

  maxParaEntregar(item: ItemEntrega): number {
    return item.quantidade - item.quantidadeJaEntregue;
  }

  readonly statusPedido: StatusPedido = getStatusPedido(this.pedido);
  readonly statusLabel: string = STATUS_LABEL[this.statusPedido];
  readonly statusIcon: string = STATUS_ICON[this.statusPedido];
  readonly formatDataHora = formatDataHora;
  readonly somenteLeitura = this.statusPedido !== 'a-pagar';

  async confirmarEntrega(): Promise<void> {
    if (this.saving || !this.algumNovoMarcado) return;
    this.saving = true;
    this.erro = '';
    try {
      const itensAtualizados: ItemPedido[] = this.pedido.itens.map((item, idx) => {
        const entrega = this.itens[idx];
        const novaQtdEntregue = entrega.quantidadeJaEntregue + entrega.quantidadeParaEntregar;
        return {
          ...item,
          quantidadeEntregue: novaQtdEntregue,
          entregue: novaQtdEntregue >= item.quantidade,
        };
      });
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

  async voltarParaEmPreparo(): Promise<void> {
    const ref = this.dialog.open(ConfirmacaoDialogComponent, {
      data: {
        titulo: 'Voltar para Em preparação',
        mensagem: 'Deseja restaurar este pedido para o status "Em preparação"?',
        labelSim: 'Sim, restaurar',
        labelNao: 'Não',
      },
      width: '380px',
    });
    const confirmar = await firstValueFrom(ref.afterClosed());
    if (!confirmar) return;
    if (this.pedido.cancelado) {
      await this.pedidosService.desfazerCancelado(this.pedido.id);
    } else {
      await this.pedidosService.desfazerNaoRetirado(this.pedido.id);
    }
    this.dialogRef.close(true);
  }
}
