import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { combineLatest, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { ItemPedido, Pedido, resumoItemPedido } from '../../core/models/pedido.model';
import { formatPreco } from '../../core/utils/formatters';
import { AdicionarItemComponent } from '../adicionar-item/adicionar-item.component';
import { ConfirmacaoDialogComponent } from '../../shared/confirmacao-dialog/confirmacao-dialog.component';

@Component({
  selector: 'app-alterar-pedido',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './alterar-pedido.component.html',
  styleUrl: './alterar-pedido.component.scss',
})
export class AlterarPedidoComponent implements OnInit {
  readonly pedido = inject<Pedido>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AlterarPedidoComponent>);
  private dialog = inject(MatDialog);
  private itensService = inject(ItensService);
  private pedidosService = inject(PedidosService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly isAtendimento = this.authService.getPerfil()?.nome?.trim().toLowerCase() === 'atendimento';
  readonly formatPreco = formatPreco;
  readonly resumoItemPedido = resumoItemPedido;

  pedidoItens: ItemPedido[] = this.pedido.itens.map(item => ({ ...item }));
  doacao: number | null = null;
  valorPago: number | null = null;
  editandoIndex: number | null = null;

  sabores: ItemBase[] = [];
  adicionais: ItemBase[] = [];

  private saboresMap = new Map<string, ItemBase>();
  private adicionaisMap = new Map<string, ItemBase>();
  private produtosMap = new Map<string, ItemBase>();

  loading = true;
  saving = false;
  erro = '';

  get total(): number {
    return this.pedidoItens.reduce((sum, item) => sum + (item.tipoPreco ?? 0) * item.quantidade, 0);
  }

  get diferenca(): number {
    return this.total - this.pedido.total;
  }

  get totalAPagar(): number {
    return this.total + (this.doacao ?? 0) - (this.pedido.valorPago ?? 0);
  }

  get saldo(): number | null {
    if (this.valorPago == null) return null;
    // Troco = valor pago agora − total a pagar
    return this.valorPago - this.totalAPagar;
  }

  get canSalvar(): boolean {
    return this.pedidoItens.length > 0 && !this.saving;
  }

  ngOnInit(): void {
    combineLatest([
      this.itensService.getItens('sabores'),
      this.itensService.getItens('adicionais'),
      this.itensService.getItens('produtos'),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([sabores, adicionais, produtos]) => {
        this.sabores = sabores;
        this.adicionais = adicionais;
        this.saboresMap = new Map(sabores.map(s => [s.id, s]));
        this.adicionaisMap = new Map(adicionais.map(a => [a.id, a]));
        this.produtosMap = new Map(produtos.map(p => [p.id, p]));
        this.loading = false;
      },
      error: () => { this.loading = false; this.erro = 'Erro ao carregar dados.'; },
    });
  }

  saboresDoItem(i: number): ItemBase[] {
    const tipo = this.produtosMap.get(this.pedidoItens[i].tipoId);
    if (tipo?.saboresPermitidos === undefined) return this.sabores;
    if (tipo.saboresPermitidos.length === 0) return [];
    return this.sabores.filter(s => tipo.saboresPermitidos!.includes(s.id));
  }

  incrementarQtd(i: number): void {
    const item = this.pedidoItens[i];
    this.pedidoItens[i] = { ...item, quantidade: item.quantidade + 1 };
  }

  decrementarQtd(i: number): void {
    const item = this.pedidoItens[i];
    if (item.quantidade <= 1) {
      if (this.editandoIndex === i) this.editandoIndex = null;
      else if (this.editandoIndex !== null && this.editandoIndex > i) this.editandoIndex--;
      this.pedidoItens.splice(i, 1);
    } else {
      this.pedidoItens[i] = { ...item, quantidade: item.quantidade - 1 };
    }
  }

  toggleEditando(i: number): void {
    this.editandoIndex = this.editandoIndex === i ? null : i;
  }

  setSaborSlot(i: number, si: number, saborId: string | undefined): void {
    const item = this.pedidoItens[i];
    const novosIds = [...item.saboresIds];
    novosIds[si] = saborId ?? '';
    const novosNomes = novosIds.map(id => this.saboresMap.get(id)?.nome ?? '').filter(Boolean);
    this.pedidoItens[i] = { ...item, saboresIds: novosIds, saboresNomes: novosNomes };
  }

  setAdicionais(i: number, adicionaisIds: string[]): void {
    const item = this.pedidoItens[i];
    const adicionaisNomes = adicionaisIds.map(id => this.adicionaisMap.get(id)?.nome ?? '').filter(Boolean);
    this.pedidoItens[i] = { ...item, adicionaisIds, adicionaisNomes };
  }

  async abrirAdicionarItem(): Promise<void> {
    const ref = this.dialog.open(AdicionarItemComponent, {
      width: '520px',
      maxHeight: '90vh',
      data: { barracaId: this.pedido.barracaId },
    });
    const novoItem: ItemPedido | undefined = await firstValueFrom(ref.afterClosed());
    if (novoItem) this.pedidoItens.push(novoItem);
  }

  async salvar(): Promise<void> {
    if (!this.canSalvar) return;
    if (this.saldo !== null && this.saldo < 0) {
      const ref = this.dialog.open(ConfirmacaoDialogComponent, {
        data: {
          titulo: 'Valor insuficiente',
          mensagem: `O cliente ainda deve ${this.formatPreco(-this.saldo)}. Deseja salvar mesmo assim?`,
          labelSim: 'Sim, salvar',
          labelNao: 'Voltar',
        },
        width: '380px',
      });
      const confirmar = await firstValueFrom(ref.afterClosed());
      if (!confirmar) return;
    }
    this.saving = true;
    this.erro = '';
    try {
      const novoValorPagoInformado = this.valorPago != null;
      const voltarParaAPagar = this.pedido.pago && !novoValorPagoInformado;
      const valorPagoFinal = novoValorPagoInformado
        ? this.valorPago! + (this.pedido.valorPago ?? 0) - (this.doacao ?? 0)
        : this.pedido.valorPago;
      const doacaoFinal = novoValorPagoInformado
        ? (this.doacao && this.doacao > 0 ? this.doacao : undefined)
        : this.pedido.doacao;
      await this.pedidosService.updatePedido(this.pedido.id, {
        nomeCliente: this.pedido.nomeCliente,
        itens: this.pedidoItens,
        total: this.total,
        doacao: doacaoFinal,
        valorPago: valorPagoFinal,
        ...(voltarParaAPagar ? { pago: false } : {}),
      });
      this.dialogRef.close(true);
    } catch {
      this.erro = 'Erro ao salvar alterações.';
    } finally {
      this.saving = false;
    }
  }

  fechar(): void {
    this.dialogRef.close(false);
  }
}
