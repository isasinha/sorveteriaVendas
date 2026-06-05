import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PedidosService } from '../../core/services/pedidos.service';
import { AuthService } from '../../core/services/auth.service';
import { ItensService } from '../../core/services/itens.service';
import { Pedido, STATUS_ICON, STATUS_LABEL, getStatusPedido, resumoItemPedido } from '../../core/models/pedido.model';
import { DetalhePedidoComponent } from '../detalhe-pedido/detalhe-pedido.component';
import { PagamentoComponent } from '../pagamento/pagamento.component';
import { AlterarPedidoComponent } from '../alterar-pedido/alterar-pedido.component';
import { ConfirmacaoDialogComponent } from '../../shared/confirmacao-dialog/confirmacao-dialog.component';
import { FiltroConsultar, FILTROS_CONSULTAR } from '../../core/models/perfil.model';
import { formatData, formatHora } from '../../core/utils/formatters';

type Status = 'normal' | 'alerta' | 'critico';

@Component({
  selector: 'app-consultar-pedidos',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, KeyValuePipe],
  templateUrl: './consultar-pedidos.component.html',
  styleUrl: './consultar-pedidos.component.scss'
})
export class ConsultarPedidosComponent implements OnInit {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private pedidosService = inject(PedidosService);
  private authService = inject(AuthService);
  private itensService = inject(ItensService);
  private destroyRef = inject(DestroyRef);

  readonly filtrosDisponiveis: FiltroConsultar[] = this.authService.getPerfil()?.filtrosVisiveis ?? FILTROS_CONSULTAR.map(f => f.chave);
  readonly FILTROS_CONSULTAR = FILTROS_CONSULTAR;
  readonly isAtendimento = this.authService.getPerfil()?.nome?.trim().toLowerCase() === 'atendimento';
  readonly currentUserEmail = this.authService.getCurrentUser()?.email ?? null;
  readonly isMontagem = this.authService.getPerfil()?.nome?.trim().toLowerCase().includes('montagem') ?? false;
  readonly perfilEscopo = this.authService.getPerfil()?.escopo ?? 'propria';
  readonly perfilBarracaId = this.authService.getPerfil()?.idBarraca ?? null;
  readonly podeVerTodasBarracas = this.perfilEscopo === 'todas';

  barracaFiltro: string = 'todas';

  readonly STATUS_LABEL = STATUS_LABEL;
  readonly STATUS_ICON = STATUS_ICON;
  readonly formatData = formatData;
  readonly formatHora = formatHora;
  readonly getStatusPedido = getStatusPedido;
  readonly resumoItemPedido = resumoItemPedido;

  pedidos: Pedido[] = [];
  barracasMap = new Map<string, string>(); // id → nome
  agora = Date.now();
  filtro: FiltroConsultar = this.filtrosDisponiveis[0] ?? 'todos';
  busca = '';
  entregandoId: string | null = null;

  private pedidosDaBarraca(): Pedido[] {
    if (this.perfilEscopo !== 'todas') return this.pedidos.filter(p => p.barracaId === this.perfilBarracaId);
    if (this.barracaFiltro === 'todas') return this.pedidos;
    return this.pedidos.filter(p => p.barracaId === this.barracaFiltro);
  }

  get pedidosFiltrados(): Pedido[] {
    const base = this.isAtendimento
      ? this.pedidosDaBarraca().filter(p => !p.pago && !this.isEncerrado(p) && p.criadoPorEmail === this.currentUserEmail)
      : this.pedidosDaBarraca();
    let lista = base;
    if (!this.isAtendimento) {
      switch (this.filtro) {
        case 'cancelados':    lista = base.filter(p => this.isEncerrado(p)); break;
        case 'em-preparacao': lista = base.filter(p => !this.isEncerrado(p) && p.pago && !p.entregue); break;
        case 'concluidos':    lista = base.filter(p => !this.isEncerrado(p) && p.pago && p.entregue); break;
        case 'nao-pagos':     lista = base.filter(p => !this.isEncerrado(p) && !p.pago); break;
        default:              lista = base;
      }
    }
    const termo = this.busca.trim().toLowerCase();
    if (!termo) return lista;
    return lista.filter(p =>
      p.nomeCliente.toLowerCase().includes(termo) ||
      p.numero.toString().includes(termo)
    );
  }

  ngOnInit(): void {
    this.pedidosService.getPedidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.pedidos = p);

    this.itensService.getItens('barracas')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(b => this.barracasMap = new Map(b.map(x => [x.id, x.nome])));

    interval(30_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.pedidos.some(p => !p.entregue)) this.agora = Date.now();
    });
  }

  nomeBarraca(pedido: Pedido): string | null {
    if (this.perfilEscopo !== 'todas') return null;
    if (!pedido.barracaId) return null;
    return this.barracasMap.get(pedido.barracaId) ?? null;
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
    const ref = this.dialog.open(ConfirmacaoDialogComponent, {
      data: {
        titulo: 'Confirmar entrega',
        mensagem: `Deseja marcar o pedido #${pedido.numero} de ${pedido.nomeCliente} como entregue?`,
        labelSim: 'Sim, entregar',
        labelNao: 'Cancelar',
      },
      width: '380px',
    });
    const confirmar = await firstValueFrom(ref.afterClosed());
    if (!confirmar) return;
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
      const ref = this.dialog.open(ConfirmacaoDialogComponent, {
        data: {
          titulo: 'Cancelar pedido',
          mensagem: `Deseja cancelar o pedido #${pedido.numero} de ${pedido.nomeCliente}?`,
          labelSim: 'Sim, cancelar',
          labelNao: 'Voltar',
        },
        width: '380px',
      });
      const confirmar = await firstValueFrom(ref.afterClosed());
      if (!confirmar) return;
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

  async abrirDetalhe(pedido: Pedido, entregaParcial = false): Promise<void> {
    if (this.isAtendimento) return;

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
      data: { pedido, entregaParcial },
      width: '480px',
      maxHeight: '90vh',
    });
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }
}
