import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ItensService } from '../../core/services/itens.service';
import { ItemBase, ColecaoItens } from '../../core/models/item.model';
import { formatPreco } from '../../core/utils/formatters';

interface BlocoState {
  itens: ItemBase[];
  loading: boolean;
  novoNome: string;
  novoPreco: number | null;
  novoQtdSabores: number | null;
  saving: boolean;
  editingId: string | null;
  editingNome: string;
  editingPreco: number | null;
  editingQtdSabores: number | null;
  deletingId: string | null;
  erro: string;
}

interface BlocoConfig {
  col: ColecaoItens;
  titulo: string;
  icon: string;
  labelAdicionar: string;
  iconClass: string;
  temPreco?: boolean;
  temQtdSabores?: boolean;
  span?: number;
}

@Component({
  selector: 'app-alterar-itens',
  standalone: true,
  imports: [
    FormsModule, NgTemplateOutlet,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './alterar-itens.component.html',
  styleUrl: './alterar-itens.component.scss'
})
export class AlterarItensComponent implements OnInit {
  private router = inject(Router);
  private itensService = inject(ItensService);
  private destroyRef = inject(DestroyRef);

  readonly blocosConfig: BlocoConfig[] = [
    { col: 'tipos',      titulo: 'Tipos',      icon: 'category',        labelAdicionar: 'Novo tipo',      iconClass: 'icon-tipos',      temPreco: true, temQtdSabores: true, span: 2 },
    { col: 'sabores',    titulo: 'Sabores',    icon: 'icecream',        labelAdicionar: 'Novo sabor',     iconClass: 'icon-sabores'    },
    { col: 'adicionais', titulo: 'Adicionais', icon: 'add_circle',      labelAdicionar: 'Novo adicional', iconClass: 'icon-adicionais' },
    { col: 'perfis',     titulo: 'Perfis',     icon: 'manage_accounts', labelAdicionar: 'Novo perfil',    iconClass: 'icon-perfis'     },
    { col: 'barracas',   titulo: 'Barracas',   icon: 'store',           labelAdicionar: 'Nova barraca',   iconClass: 'icon-barracas'   },
  ];

  readonly blocosLinha1 = this.blocosConfig.slice(0, 2);
  readonly blocosLinha2 = this.blocosConfig.slice(2);

  readonly formatPreco = formatPreco;

  blocos: Record<string, BlocoState> = {
    tipos:      this.novoBloco(),
    sabores:    this.novoBloco(),
    adicionais: this.novoBloco(),
    perfis:     this.novoBloco(),
    barracas:   this.novoBloco(),
  };

  private novoBloco(): BlocoState {
    return { itens: [], loading: true, novoNome: '', novoPreco: null, novoQtdSabores: null, saving: false, editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null, deletingId: null, erro: '' };
  }

  ngOnInit(): void {
    this.blocosConfig.forEach(({ col }) => {
      this.itensService.getItens(col)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: itens => Object.assign(this.blocos[col], { itens, loading: false }),
          error: () => Object.assign(this.blocos[col], { loading: false, erro: 'Erro ao carregar dados.' })
        });
    });
  }

  async adicionar(col: ColecaoItens): Promise<void> {
    const b = this.blocos[col];
    if (!b.novoNome.trim() || b.saving) return;
    b.saving = true;
    b.erro = '';
    try {
      const extra: Record<string, unknown> = {};
      if (b.novoPreco != null) extra['preco'] = b.novoPreco;
      if (b.novoQtdSabores != null) extra['qtdSabores'] = b.novoQtdSabores;
      await this.itensService.addItem(col, b.novoNome, extra);
      b.novoNome = '';
      b.novoPreco = null;
      b.novoQtdSabores = null;
    } catch {
      b.erro = 'Erro ao adicionar item.';
    } finally {
      b.saving = false;
    }
  }

  iniciarEdicao(col: ColecaoItens, item: ItemBase): void {
    Object.assign(this.blocos[col], { editingId: item.id, editingNome: item.nome, editingPreco: item.preco ?? null, editingQtdSabores: item.qtdSabores ?? null, erro: '' });
  }

  cancelarEdicao(col: ColecaoItens): void {
    Object.assign(this.blocos[col], { editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null });
  }

  async salvarEdicao(col: ColecaoItens): Promise<void> {
    const b = this.blocos[col];
    if (!b.editingId || !b.editingNome.trim() || b.saving) return;
    b.saving = true;
    b.erro = '';
    try {
      const extra: Record<string, unknown> = {};
      if (b.editingPreco != null) extra['preco'] = b.editingPreco;
      if (b.editingQtdSabores != null) extra['qtdSabores'] = b.editingQtdSabores;
      await this.itensService.updateItem(col, b.editingId, b.editingNome, extra);
      Object.assign(b, { editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null });
    } catch {
      b.erro = 'Erro ao salvar edição.';
    } finally {
      b.saving = false;
    }
  }

  async deletar(col: ColecaoItens, id: string): Promise<void> {
    const b = this.blocos[col];
    b.deletingId = id;
    b.erro = '';
    try {
      await this.itensService.deleteItem(col, id);
    } catch {
      b.erro = 'Erro ao excluir item.';
    } finally {
      b.deletingId = null;
    }
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }
}
