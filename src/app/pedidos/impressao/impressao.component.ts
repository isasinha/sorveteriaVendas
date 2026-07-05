import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemPedido } from '../../core/models/pedido.model';
import { formatPreco } from '../../core/utils/formatters';
import { AuthService } from '../../core/services/auth.service';
import { ItensService } from '../../core/services/itens.service';

interface ImpressaoState {
  numero: number;
  nomeCliente: string;
  itens: ItemPedido[];
  total: number;
  origem?: string;
  barracaId?: string;
}

@Component({
  selector: 'app-impressao',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './impressao.component.html',
  styleUrl: './impressao.component.scss'
})
export class ImpressaoComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private itensService = inject(ItensService);
  private snackBar = inject(MatSnackBar);

  numero = 0;
  nomeCliente = '';
  itens: ItemPedido[] = [];
  itensExpandidos: ItemPedido[] = [];
  total = 0;
  dataHoraPedido = '';
  mostrarViaCliente = true;
  mostrarViaProducao = true;
  private origem = '/pedidos/novo';
  private barracaIdPedido: string | undefined;

  async ngOnInit(): Promise<void> {
    const state = history.state as ImpressaoState;
    if (!state?.numero) {
      this.router.navigate([this.origem]);
      return;
    }
    this.numero = state.numero;
    this.nomeCliente = state.nomeCliente;
    this.total = state.total;
    this.origem = state.origem ?? '/pedidos/novo';
    this.barracaIdPedido = state.barracaId;

    this.itens = this.agruparItens(state.itens);
    this.itensExpandidos = this.itens.flatMap(item => Array(item.quantidade).fill(item));

    const agora = new Date();
    this.dataHoraPedido = agora.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    await this.carregarViasImpressao();
    if (!this.mostrarViaCliente && !this.mostrarViaProducao) {
      this.snackBar.open('Pedido #' + this.numero + ' registrado com sucesso!', '', { duration: 4000, panelClass: 'snack-sucesso' });
      this.router.navigate([this.origem]);
      return;
    }
    setTimeout(() => window.print(), 200);
  }

  private async carregarViasImpressao(): Promise<void> {
    const barracaId = this.barracaIdPedido ?? this.authService.getPerfil()?.idBarraca;
    if (!barracaId) return;
    const barracas = await firstValueFrom(this.itensService.getItens('barracas'));
    const barraca = barracas.find(b => b.id === barracaId);
    if (barraca?.viasImpressao === 'nenhuma') { this.mostrarViaCliente = false; this.mostrarViaProducao = false; }
    if (barraca?.viasImpressao === 'cliente') this.mostrarViaProducao = false;
    if (barraca?.viasImpressao === 'producao') this.mostrarViaCliente = false;
  }

  readonly formatPreco = formatPreco;

  private agruparItens(itens: ItemPedido[]): ItemPedido[] {
    const mapa = new Map<string, ItemPedido>();

    for (const item of itens) {
      const chave = [
        item.tipoId,
        [...item.saboresIds].sort().join(','),
        [...item.adicionaisIds].sort().join(',')
      ].join('|');

      const existente = mapa.get(chave);
      if (existente) {
        existente.quantidade += item.quantidade;
      } else {
        mapa.set(chave, { ...item });
      }
    }

    return Array.from(mapa.values()).sort((a, b) => a.tipoNome.localeCompare(b.tipoNome));
  }

  imprimir(): void {
    window.print();
  }

  voltar(): void {
    this.router.navigate([this.origem]);
  }
}
