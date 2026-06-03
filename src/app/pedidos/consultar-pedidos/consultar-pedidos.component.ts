import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { interval, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PedidosService } from '../../core/services/pedidos.service';
import { Pedido, STATUS_ICON, STATUS_LABEL, getStatusPedido, resumoItemPedido } from '../../core/models/pedido.model';
import { DetalhePedidoComponent } from '../detalhe-pedido/detalhe-pedido.component';
import { PagamentoComponent } from '../pagamento/pagamento.component';
import { AlterarPedidoComponent } from '../alterar-pedido/alterar-pedido.component';
import { ConfirmacaoDialogComponent } from '../../shared/confirmacao-dialog/confirmacao-dialog.component';
import { formatData, formatHora } from '../../core/utils/formatters';

type Status = 'normal' | 'alerta' | 'critico';
type Filtro = 'todos' | 'atrasados' | 'nao-entregues' | 'concluidos' | 'nao-pagos' | 'cancelados';

@Component({
  selector: 'app-consultar-pedidos',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './consultar-pedidos.component.html',
  styleUrl: './consultar-pedidos.component.scss'
})
export class ConsultarPedidosComponent implements OnInit {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private pedidosService = inject(PedidosService);
  private destroyRef = inject(DestroyRef);

  readonly STATUS_LABEL = STATUS_LABEL;
  readonly STATUS_ICON = STATUS_ICON;
  readonly formatData = formatData;
  readonly formatHora = formatHora;
  readonly getStatusPedido = getStatusPedido;
  readonly resumoItemPedido = resumoItemPedido;

  pedidos: Pedido[] = [];
  agora = Date.now();
  filtro: Filtro = 'todos';
  entregandoId: string | null = null;

  get pedidosFiltrados(): Pedido[] {
    switch (this.filtro) {
      case 'cancelados':    return this.pedidos.filter(p => this.isEncerrado(p));
      case 'atrasados':     return this.pedidos.filter(p => !this.isEncerrado(p) && !p.entregue && this.getStatus(p) !== 'normal');
      case 'nao-entregues': return this.pedidos.filter(p => !this.isEncerrado(p) && !p.entregue);
      case 'concluidos':    return this.pedidos.filter(p => !this.isEncerrado(p) && p.pago && p.entregue);
      case 'nao-pagos':     return this.pedidos.filter(p => !this.isEncerrado(p) && !p.pago);
      default:              return this.pedidos;
    }
  }

  ngOnInit(): void {
    this.pedidosService.getPedidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.pedidos = p);

    interval(30_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.pedidos.some(p => !p.entregue)) this.agora = Date.now();
    });
  }

  getStatus(pedido: Pedido): Status {
    if (pedido.entregue) return 'normal';
    const minutos = (this.agora - pedido.data.getTime()) / 60_000;
    if (minutos >= 30) return 'critico';
    if (minutos >= 15) return 'alerta';
    return 'normal';
  }

  private isEncerrado(pedido: Pedido): boolean {
    return !!pedido.cancelado || !!pedido.naoRetirado;
  }

  podeEntregar(pedido: Pedido): boolean {
    return pedido.pago && !pedido.entregue && !this.isEncerrado(pedido);
  }

  podeCancelar(pedido: Pedido): boolean {
    return !pedido.entregue && !this.isEncerrado(pedido);
  }

  podeAlterar(pedido: Pedido): boolean {
    return !pedido.entregue && !this.isEncerrado(pedido);
  }

  async entregar(pedido: Pedido): Promise<void> {
    if (this.entregandoId) return;
    this.entregandoId = pedido.id;
    try {
      await this.pedidosService.marcarEntregue(pedido.id);
    } finally {
      this.entregandoId = null;
    }
  }

  async cancelar(pedido: Pedido): Promise<void> {
    if (pedido.valorPago) {
      const ref = this.dialog.open(ConfirmacaoDialogComponent, {
        data: {
          titulo: 'Cancelar pedido',
          mensagem: 'Este pedido contém valores já pagos.O valor será devolvido ao cliente?',
          labelSim: 'Sim, marcar como Cancelado',
          labelNao: 'Não, marcar como Não Retirado',
          labelVoltar: 'Voltar',
        },
        width: '380px',
      });
      const devolver = await firstValueFrom(ref.afterClosed());
      if (devolver === undefined) return;
      if (devolver) {
        await this.pedidosService.cancelarPedido(pedido.id);
      } else {
        await this.pedidosService.marcarNaoRetirado(pedido.id);
      }
    } else {
      await this.pedidosService.cancelarPedido(pedido.id);
    }
  }

  editarPedido(pedido: Pedido): void {
    this.dialog.open(AlterarPedidoComponent, {
      data: pedido,
      width: '580px',
      maxHeight: '90vh',
    });
  }

  async abrirDetalhe(pedido: Pedido): Promise<void> {

    if (getStatusPedido(pedido) === 'a-pagar') {
      this.dialog.open(PagamentoComponent, {
        data: { pedidoId: pedido.id, numero: pedido.numero, nomeCliente: pedido.nomeCliente, itens: pedido.itens, total: pedido.total, origem: '/pedidos/consultar' },
        width: '500px',
        maxHeight: '90vh',
        disableClose: true,
      });
      return;
    }
    this.dialog.open(DetalhePedidoComponent, {
      data: pedido,
      width: '480px',
      maxHeight: '90vh',
    });
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }
}
