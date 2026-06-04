import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItensService } from '../../core/services/itens.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { AuthService } from '../../core/services/auth.service';
import { ItemBase } from '../../core/models/item.model';
import { ItemPedido } from '../../core/models/pedido.model';
import { PagamentoComponent } from '../pagamento/pagamento.component';
import { formatPreco } from '../../core/utils/formatters';

interface ItemForm {
  tipoId: string;
  saboresIds: (string | null)[];
  adicionaisIds: string[];
  quantidade: number;
}

@Component({
  selector: 'app-novo-pedido',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './novo-pedido.component.html',
  styleUrl: './novo-pedido.component.scss'
})
export class NovoPedidoComponent implements OnInit {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private itensService = inject(ItensService);
  private pedidosService = inject(PedidosService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly formatPreco = formatPreco;

  numeroPedido = 0;
  nomeCliente = '';

  pedidoItens: ItemForm[] = [];
  itemAtual: ItemForm = { tipoId: '', saboresIds: [], adicionaisIds: [], quantidade: 1 };

  tipos: ItemBase[] = [];
  sabores: ItemBase[] = [];
  adicionais: ItemBase[] = [];

  private tiposMap = new Map<string, ItemBase>();
  private saboresMap = new Map<string, ItemBase>();
  private adicionaisMap = new Map<string, ItemBase>();

  loading = true;
  saving = false;
  erro = '';

  get total(): number {
    return this.pedidoItens.reduce((sum, item) => {
      const tipo = this.tiposMap.get(item.tipoId);
      return sum + (tipo?.preco ?? 0) * item.quantidade;
    }, 0);
  }

  get canAdicionarItem(): boolean {
    return !!this.itemAtual.tipoId &&
      (this.itemAtual.saboresIds.length === 0 || this.itemAtual.saboresIds.every(s => s !== null));
  }

  get canSalvar(): boolean {
    return !!this.nomeCliente.trim() && this.pedidoItens.length > 0;
  }

  ngOnInit(): void {
    this.pedidosService.getProximoNumero().then(n => this.numeroPedido = n);

    combineLatest([
      this.itensService.getItens('produtos'),
      this.itensService.getItens('sabores'),
      this.itensService.getItens('adicionais'),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([tipos, sabores, adicionais]) => {
        this.tipos = tipos;
        this.sabores = sabores;
        this.adicionais = adicionais;
        this.tiposMap = new Map(tipos.map(t => [t.id, t]));
        this.saboresMap = new Map(sabores.map(s => [s.id, s]));
        this.adicionaisMap = new Map(adicionais.map(a => [a.id, a]));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.erro = 'Erro ao carregar dados.';
      }
    });
  }

  onTipoChange(): void {
    const tipo = this.tiposMap.get(this.itemAtual.tipoId);
    const qtd = tipo?.qtdSabores ?? 0;
    this.itemAtual.saboresIds = Array(qtd).fill(null);
  }

  saboresDoTipoAtual(): ItemBase[] {
    const tipo = this.tiposMap.get(this.itemAtual.tipoId);
    if (tipo?.saboresPermitidos === undefined) return this.sabores; // todos
    if (tipo.saboresPermitidos.length === 0) return [];             // nenhum
    return this.sabores.filter(s => tipo.saboresPermitidos!.includes(s.id));
  }

  setSaborSlot(si: number, value: string | undefined): void {
    this.itemAtual.saboresIds[si] = value ?? null;
  }

  adicionarItemNaLista(): void {
    if (!this.canAdicionarItem) return;
    this.pedidoItens.push({
      tipoId: this.itemAtual.tipoId,
      saboresIds: [...this.itemAtual.saboresIds],
      adicionaisIds: [...this.itemAtual.adicionaisIds],
      quantidade: this.itemAtual.quantidade > 0 ? this.itemAtual.quantidade : 1,
    });
    this.itemAtual = { tipoId: '', saboresIds: [], adicionaisIds: [], quantidade: 1 };
  }

  removerItemDaLista(i: number): void {
    this.pedidoItens.splice(i, 1);
  }

  getResumoItem(item: ItemForm): string {
    const tipo = this.tiposMap.get(item.tipoId);
    const saborNomes = item.saboresIds
      .filter((id): id is string => id !== null)
      .map(id => this.saboresMap.get(id)?.nome)
      .filter(Boolean).join(', ');
    const adicionalNomes = item.adicionaisIds
      .map(id => this.adicionaisMap.get(id)?.nome)
      .filter(Boolean).join(', ');
    const parts: string[] = [tipo?.nome ?? ''];
    if (saborNomes) parts.push(saborNomes);
    if (adicionalNomes) parts.push(adicionalNomes);
    return parts.join(' — ');
  }

  getPrecoItem(item: ItemForm): number | null {
    return this.tiposMap.get(item.tipoId)?.preco ?? null;
  }

  async salvar(): Promise<void> {
    if (!this.canSalvar || this.saving) return;
    this.saving = true;
    this.erro = '';
    try {
      const nomeCliente = this.nomeCliente.trim();
      const itens: ItemPedido[] = this.pedidoItens.map(f => {
        const tipo = this.tiposMap.get(f.tipoId)!;
        return {
          tipoId: f.tipoId,
          tipoNome: tipo.nome,
          tipoPreco: tipo.preco ?? null,
          saboresIds: f.saboresIds.filter((id): id is string => id !== null),
          saboresNomes: f.saboresIds
            .filter((id): id is string => id !== null)
            .map(id => this.saboresMap.get(id)?.nome ?? '')
            .filter(Boolean),
          adicionaisIds: f.adicionaisIds,
          adicionaisNomes: f.adicionaisIds
            .map(id => this.adicionaisMap.get(id)?.nome ?? '')
            .filter(Boolean),
          quantidade: f.quantidade,
        };
      });
      const totalPedido = this.total;
      const criadoPorEmail = this.authService.getCurrentUser()?.email ?? undefined;

      const { id: pedidoId, numero } = await this.pedidosService.addPedido({ nomeCliente, itens, total: totalPedido, criadoPorEmail });

      this.nomeCliente = '';
      this.pedidoItens = [];
      this.itemAtual = { tipoId: '', saboresIds: [], adicionaisIds: [], quantidade: 1 };
      this.numeroPedido = await this.pedidosService.getProximoNumero();

      const isAtendimento = this.authService.getPerfil()?.nome.trim().toLowerCase() === 'atendimento';
      if (!isAtendimento) {
        this.dialog.open(PagamentoComponent, {
          data: { pedidoId, numero, nomeCliente, itens, total: totalPedido, origem: '/pedidos/novo' },
          width: '500px',
          maxHeight: '90vh',
          disableClose: true,
        });
      }
    } catch {
      this.erro = 'Erro ao salvar pedido.';
    } finally {
      this.saving = false;
    }
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }
}
