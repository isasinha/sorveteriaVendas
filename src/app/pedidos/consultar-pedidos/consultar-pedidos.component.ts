import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PedidosService } from '../../core/services/pedidos.service';
import { Pedido, StatusPedido, STATUS_ICON, STATUS_LABEL, getStatusPedido, resumoItemPedido } from '../../core/models/pedido.model';
import { DetalhePedidoComponent } from '../detalhe-pedido/detalhe-pedido.component';

type Status = 'normal' | 'alerta' | 'critico';
type Filtro = 'todos' | 'atrasados' | 'nao-entregues' | 'concluidos' | 'nao-pagos';

@Component({
  selector: 'app-consultar-pedidos',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
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

  pedidos: Pedido[] = [];
  agora = Date.now();
  filtro: Filtro = 'todos';

  get pedidosFiltrados(): Pedido[] {
    switch (this.filtro) {
      case 'atrasados':
        return this.pedidos.filter(p => !p.entregue && this.getStatus(p) !== 'normal');
      case 'nao-entregues':
        return this.pedidos.filter(p => !p.entregue);
      case 'concluidos':
        return this.pedidos.filter(p => p.pago && p.entregue);
      case 'nao-pagos':
        return this.pedidos.filter(p => !p.pago);
      default:
        return this.pedidos;
    }
  }

  ngOnInit(): void {
    this.pedidosService.getPedidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.pedidos = p);

    const timer = setInterval(() => {
      if (this.pedidos.some(p => !p.entregue)) this.agora = Date.now();
    }, 30_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  getStatus(pedido: Pedido): Status {
    if (pedido.entregue) return 'normal';
    const minutos = (this.agora - pedido.data.getTime()) / 60_000;
    if (minutos >= 30) return 'critico';
    if (minutos >= 15) return 'alerta';
    return 'normal';
  }

  formatData(data: Date): string {
    return data.toLocaleDateString('pt-BR');
  }

  formatHora(data: Date): string {
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  linhasItens(pedido: Pedido): string[] {
    return pedido.itens.map(item => {
      const prefixo = item.quantidade > 1 ? `${item.quantidade}x ` : '';
      return `${prefixo}${resumoItemPedido(item)}`;
    });
  }

  statusPedido(pedido: Pedido): StatusPedido { return getStatusPedido(pedido); }

  abrirDetalhe(pedido: Pedido): void {
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
