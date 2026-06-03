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
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ItensService } from '../../core/services/itens.service';
import { PessoasService } from '../../core/services/pessoas.service';
import { ItemBase, ColecaoItens } from '../../core/models/item.model';
import { PerfilCompleto, Funcionalidade, FUNCIONALIDADES, FiltroConsultar, FILTROS_CONSULTAR, isTI, EscopoBarraca } from '../../core/models/perfil.model';
import { formatPreco } from '../../core/utils/formatters';

interface BlocoState {
  itens: ItemBase[];
  loading: boolean;
  novoNome: string;
  novoPreco: number | null;
  novoQtdSabores: number | null;
  novoSaboresPermitidos: string[];
  novoBarracasPermitidas: string[];
  saving: boolean;
  editingId: string | null;
  editingNome: string;
  editingPreco: number | null;
  editingQtdSabores: number | null;
  editingSaboresPermitidos: string[];
  deletingId: string | null;
  erro: string;
  expandidoId: string | null; // painel de sabores/barracas aberto
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
    MatProgressSpinnerModule, MatSelectModule, MatTooltipModule, MatCheckboxModule,
  ],
  templateUrl: './alterar-itens.component.html',
  styleUrl: './alterar-itens.component.scss'
})
export class AlterarItensComponent implements OnInit {
  private router = inject(Router);
  private itensService = inject(ItensService);
  private pessoasService = inject(PessoasService);
  private destroyRef = inject(DestroyRef);

  readonly blocosConfig: BlocoConfig[] = [
    { col: 'produtos',    titulo: 'Produtos',   icon: 'category',        labelAdicionar: 'Novo produto',   iconClass: 'icon-produtos',   temPreco: true, temQtdSabores: true, span: 2 },
    { col: 'sabores',    titulo: 'Sabores',    icon: 'icecream',        labelAdicionar: 'Novo sabor',     iconClass: 'icon-sabores'    },
    { col: 'adicionais', titulo: 'Adicionais', icon: 'add_circle',      labelAdicionar: 'Novo adicional', iconClass: 'icon-adicionais' },
    { col: 'perfis',     titulo: 'Perfis',     icon: 'manage_accounts', labelAdicionar: 'Novo perfil',    iconClass: 'icon-perfis'     },
    { col: 'barracas',   titulo: 'Barracas',   icon: 'store',           labelAdicionar: 'Nova barraca',   iconClass: 'icon-barracas'   },
  ];

  readonly blocosLinha1 = this.blocosConfig.slice(0, 2);
  readonly blocosLinha2 = this.blocosConfig.slice(2);
  readonly funcionalidades = FUNCIONALIDADES;
  readonly filtrosConsultar = FILTROS_CONSULTAR;
  readonly isTI = isTI;
  readonly formatPreco = formatPreco;

  blocos: Record<string, BlocoState> = {
    produtos:   this.novoBloco(),
    sabores:    this.novoBloco(),
    adicionais: this.novoBloco(),
    perfis:     this.novoBloco(),
    barracas:   this.novoBloco(),
  };

  // Estado dos painéis de sabores/barracas por produto
  // chave: produtoId, valor: Set de ids selecionados
  editSaboresProduto: Record<string, Set<string>> = {};
  editBarracasProduto: Record<string, Set<string>> = {};
  savingProdutoId: string | null = null;

  get sabores(): ItemBase[] { return this.blocos['sabores']?.itens ?? []; }
  get barracas(): ItemBase[] { return this.blocos['barracas']?.itens ?? []; }

  saboresNomesDoItem(item: ItemBase): string {
    if (item.saboresPermitidos === undefined) return 'Todos';
    if (item.saboresPermitidos.length === 0) return 'Nenhum';
    return item.saboresPermitidos
      .map(id => this.sabores.find(s => s.id === id)?.nome ?? id)
      .join(', ');
  }

  toggleExpandido(produtoId: string): void {
    const b = this.blocos['produtos'];
    if (b.expandidoId === produtoId) {
      b.expandidoId = null;
    } else {
      b.expandidoId = produtoId;
      const produto = b.itens.find(i => i.id === produtoId);
      if (produto) {
        if (!(produtoId in this.editSaboresProduto)) {
          this.editSaboresProduto[produtoId] = new Set(produto.saboresPermitidos ?? []);
        }
        if (!(produtoId in this.editBarracasProduto)) {
          this.editBarracasProduto[produtoId] = new Set(produto.barracasPermitidas ?? []);
        }
      }
    }
  }

  isSaborPermitido(produtoId: string, saborId: string): boolean {
    const set = this.editSaboresProduto[produtoId];
    return set ? set.has(saborId) : false;
  }

  isBarracaPermitida(produtoId: string, barracaId: string): boolean {
    const set = this.editBarracasProduto[produtoId];
    return set ? set.has(barracaId) : false;
  }

  toggleSaborProduto(produtoId: string, saborId: string): void {
    const set = this.editSaboresProduto[produtoId];
    if (!set) return;
    if (set.has(saborId)) set.delete(saborId); else set.add(saborId);
  }

  toggleBarracaProduto(produtoId: string, barracaId: string): void {
    const set = this.editBarracasProduto[produtoId];
    if (!set) return;
    if (set.has(barracaId)) set.delete(barracaId); else set.add(barracaId);
  }

  async salvarSaboresBarracas(produtoId: string): Promise<void> {
    this.savingProdutoId = produtoId;
    try {
      const saboresArr = Array.from(this.editSaboresProduto[produtoId] ?? []);
      const barracas = Array.from(this.editBarracasProduto[produtoId] ?? []);
      // todos selecionados = undefined (sem restrição); lista vazia = nenhum; parcial = só esses
      const todosOsSabores = this.sabores.map(s => s.id);
      const saboresValue = saboresArr.length === todosOsSabores.length && todosOsSabores.every(id => saboresArr.includes(id))
        ? undefined
        : saboresArr;
      const extra: Record<string, unknown> = {
        saboresPermitidos: saboresValue,
        barracasPermitidas: barracas.length > 0 ? barracas : undefined,
      };
      const produto = this.blocos['produtos'].itens.find(i => i.id === produtoId);
      if (produto) {
        await this.itensService.updateItem('produtos', produtoId, produto.nome, extra);
      }
      this.blocos['produtos'].expandidoId = null;
    } catch {
      this.blocos['produtos'].erro = 'Erro ao salvar sabores/barracas.';
    } finally {
      this.savingProdutoId = null;
    }
  }

  // Permissões por perfil
  perfis: PerfilCompleto[] = [];
  editPermissoes = new Map<string, Set<Funcionalidade>>();
  editEscopo: Record<string, EscopoBarraca> = {};

  // Filtros de consulta por perfil
  editFiltros: Record<string, Set<FiltroConsultar>> = {};

  // Estado único para salvar a tabela inteira
  savingTabela = false;
  sucessoTabela = false;
  erroTabela = '';

  private novoBloco(): BlocoState {
    return { itens: [], loading: true, novoNome: '', novoPreco: null, novoQtdSabores: null, novoSaboresPermitidos: [], novoBarracasPermitidas: [], saving: false, editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null, editingSaboresPermitidos: [], deletingId: null, erro: '', expandidoId: null };
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

    this.pessoasService.getPerfis()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(perfis => {
        this.perfis = perfis;
        perfis.forEach(p => {
          if (!this.editPermissoes.has(p.id)) {
            this.editPermissoes.set(p.id, new Set(p.permissoes ?? []));
          }
          if (!(p.id in this.editEscopo)) {
            this.editEscopo[p.id] = p.escopo ?? 'propria';
          }
          if (!(p.id in this.editFiltros)) {
            const todos = FILTROS_CONSULTAR.map(f => f.chave);
            this.editFiltros[p.id] = new Set(p.filtrosVisiveis ?? todos);
          }
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
      // todos selecionados = undefined; 
      const todosOsSabores = this.sabores.map(s => s.id);
      const saboresNovos = b.novoSaboresPermitidos;
      extra['saboresPermitidos'] = saboresNovos.length === todosOsSabores.length && todosOsSabores.every(id => saboresNovos.includes(id))
        ? undefined
        : saboresNovos;
      if (b.novoBarracasPermitidas.length > 0) extra['barracasPermitidas'] = b.novoBarracasPermitidas;
      await this.itensService.addItem(col, b.novoNome, extra);
      b.novoNome = '';
      b.novoPreco = null;
      b.novoQtdSabores = null;
      b.novoSaboresPermitidos = [];
      b.novoBarracasPermitidas = [];
    } catch {
      b.erro = 'Erro ao adicionar item.';
    } finally {
      b.saving = false;
    }
  }

  iniciarEdicao(col: ColecaoItens, item: ItemBase): void {
    Object.assign(this.blocos[col], { editingId: item.id, editingNome: item.nome, editingPreco: item.preco ?? null, editingQtdSabores: item.qtdSabores ?? null, editingSaboresPermitidos: [...(item.saboresPermitidos ?? [])], erro: '' });
  }

  cancelarEdicao(col: ColecaoItens): void {
    Object.assign(this.blocos[col], { editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null, editingSaboresPermitidos: [] });
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
      // todos selecionados = undefined; 
      const todosOsSabores = this.sabores.map(s => s.id);
      const saboresArr = b.editingSaboresPermitidos;
      const saboresValue = saboresArr.length === todosOsSabores.length && todosOsSabores.every(id => saboresArr.includes(id))
        ? undefined
        : saboresArr;
      extra['saboresPermitidos'] = saboresValue;
      await this.itensService.updateItem(col, b.editingId, b.editingNome, extra);
      Object.assign(b, { editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null, editingSaboresPermitidos: [] });
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

  isFiltroVisivelEdit(perfilId: string, filtro: FiltroConsultar): boolean {
    return this.editFiltros[perfilId]?.has(filtro) ?? true;
  }

  toggleFiltroEdit(perfilId: string, filtro: FiltroConsultar): void {
    const set = this.editFiltros[perfilId];
    if (!set) return;
    if (set.has(filtro)) set.delete(filtro); else set.add(filtro);
  }

  temPermissaoPerfil(perfilId: string, chave: Funcionalidade): boolean {
    return this.editPermissoes.get(perfilId)?.has(chave) ?? false;
  }

  togglePermissao(perfilId: string, chave: Funcionalidade): void {
    const set = this.editPermissoes.get(perfilId);
    if (!set) return;
    if (set.has(chave)) set.delete(chave); else set.add(chave);
  }

  async salvarTudo(): Promise<void> {
    if (this.savingTabela) return;
    this.savingTabela = true;
    this.sucessoTabela = false;
    this.erroTabela = '';
    try {
      const editaveis = this.perfis.filter(p => !isTI(p.nome));
      await Promise.all(editaveis.map(async p => {
        const permissoes = Array.from(this.editPermissoes.get(p.id) ?? []);
        const escopo = this.editEscopo[p.id] ?? 'propria';
        await this.pessoasService.updatePermissoes(p.id, permissoes, escopo);

        const selecionados = Array.from(this.editFiltros[p.id] ?? []) as FiltroConsultar[];
        const toSave = selecionados.length === FILTROS_CONSULTAR.length ? null : selecionados;
        await this.pessoasService.updateFiltrosVisiveis(p.id, toSave);
      }));
      this.sucessoTabela = true;
      setTimeout(() => (this.sucessoTabela = false), 3000);
    } catch {
      this.erroTabela = 'Erro ao salvar alterações.';
    } finally {
      this.savingTabela = false;
    }
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }
}
