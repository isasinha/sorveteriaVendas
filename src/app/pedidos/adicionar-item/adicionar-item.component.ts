import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ItensService } from '../../core/services/itens.service';
import { ItemBase } from '../../core/models/item.model';
import { ItemPedido } from '../../core/models/pedido.model';
import { formatPreco } from '../../core/utils/formatters';

@Component({
  selector: 'app-adicionar-item',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './adicionar-item.component.html',
  styleUrl: './adicionar-item.component.scss',
})
export class AdicionarItemComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AdicionarItemComponent>);
  private itensService = inject(ItensService);
  private destroyRef = inject(DestroyRef);
  private data = inject<{ barracaId?: string }>(MAT_DIALOG_DATA, { optional: true });

  readonly formatPreco = formatPreco;

  tipoId = '';
  saboresIds: (string | null)[] = [];
  adicionaisIds: string[] = [];
  quantidade = 1;

  tipos: ItemBase[] = [];
  sabores: ItemBase[] = [];
  adicionais: ItemBase[] = [];

  private tiposMap = new Map<string, ItemBase>();
  private saboresMap = new Map<string, ItemBase>();
  private adicionaisMap = new Map<string, ItemBase>();

  loading = true;

  get canConfirmar(): boolean {
    return !!this.tipoId &&
      (this.saboresIds.length === 0 || this.saboresIds.every(s => s !== null)) &&
      this.quantidade > 0;
  }

  get tiposFiltrados(): ItemBase[] {
    const barracaId = this.data?.barracaId;
    if (!barracaId) return this.tipos;
    return this.tipos.filter(tipo => {
      if (!tipo.barracasPermitidas || tipo.barracasPermitidas.length === 0) return true;
      return tipo.barracasPermitidas.includes(barracaId);
    });
  }

  ngOnInit(): void {
    combineLatest([
      this.itensService.getItens('produtos'),
      this.itensService.getItens('sabores'),
      this.itensService.getItens('adicionais'),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([tipos, sabores, adicionais]) => {
      this.tipos = tipos.filter(t => t.ativo !== false);
      this.sabores = sabores.filter(s => s.ativo !== false);
      this.adicionais = adicionais.filter(a => a.ativo !== false);
      this.tiposMap = new Map(tipos.map(t => [t.id, t]));
      this.saboresMap = new Map(sabores.map(s => [s.id, s]));
      this.adicionaisMap = new Map(adicionais.map(a => [a.id, a]));
      this.loading = false;
    });
  }

  onTipoChange(): void {
    const tipo = this.tiposMap.get(this.tipoId);
    this.saboresIds = Array(tipo?.qtdSabores ?? 0).fill(null);
  }

  saboresDoTipoAtual(): ItemBase[] {
    const tipo = this.tiposMap.get(this.tipoId);
    if (tipo?.saboresPermitidos === undefined) return this.sabores; // todos
    if (tipo.saboresPermitidos.length === 0) return [];             // nenhum
    return this.sabores.filter(s => tipo.saboresPermitidos!.includes(s.id));
  }

  setSaborSlot(si: number, value: string | undefined): void {
    this.saboresIds[si] = value ?? null;
  }

  confirmar(): void {
    if (!this.canConfirmar) return;
    const tipo = this.tiposMap.get(this.tipoId)!;
    const item: ItemPedido = {
      tipoId: this.tipoId,
      tipoNome: tipo.nome,
      tipoPreco: tipo.preco ?? null,
      saboresIds: this.saboresIds.filter((id): id is string => id !== null),
      saboresNomes: this.saboresIds
        .filter((id): id is string => id !== null)
        .map(id => this.saboresMap.get(id)?.nome ?? '')
        .filter(Boolean),
      adicionaisIds: this.adicionaisIds,
      adicionaisNomes: this.adicionaisIds
        .map(id => this.adicionaisMap.get(id)?.nome ?? '')
        .filter(Boolean),
      quantidade: this.quantidade,
    };
    this.dialogRef.close(item);
  }

  fechar(): void {
    this.dialogRef.close(undefined);
  }
}
