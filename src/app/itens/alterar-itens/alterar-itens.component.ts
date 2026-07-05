import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
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
import { ConfirmacaoDialogComponent } from '../../shared/confirmacao-dialog/confirmacao-dialog.component';

interface BlocoState {
  itens: ItemBase[];
  loading: boolean;
  novoNome: string;
  novoPreco: number | null;
  novoQtdSabores: number | null;
  novoSaboresPermitidos: string[];
  novoBarracasPermitidas: string[];
  novoVias: string[];
  saving: boolean;
  editingId: string | null;
  editingNome: string;
  editingPreco: number | null;
  editingQtdSabores: number | null;
  editingSaboresPermitidos: string[];
  editingBarracasPermitidas: string[];
  editingVias: string[];
  togglingId: string | null;
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
  temViasImpressao?: boolean;
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
  private dialog = inject(MatDialog);
  private itensService = inject(ItensService);
  private pessoasService = inject(PessoasService);
  private destroyRef = inject(DestroyRef);

  readonly blocosConfig: BlocoConfig[] = [
    { col: 'produtos',   titulo: 'Produtos',   icon: 'category',        labelAdicionar: 'Novo produto',   iconClass: 'icon-produtos',   temPreco: true, temQtdSabores: true, span: 3 },
    { col: 'sabores',    titulo: 'Sabores',    icon: 'icecream',        labelAdicionar: 'Novo sabor',     iconClass: 'icon-sabores'    },
    { col: 'barracas',   titulo: 'Barracas',   icon: 'store',           labelAdicionar: 'Nova barraca',   iconClass: 'icon-barracas',   temViasImpressao: true, span: 2 },
    { col: 'perfis',     titulo: 'Perfis',     icon: 'manage_accounts', labelAdicionar: 'Novo perfil',    iconClass: 'icon-perfis'     },
    { col: 'adicionais', titulo: 'Adicionais', icon: 'add_circle',      labelAdicionar: 'Novo adicional', iconClass: 'icon-adicionais' },
  ];

  readonly blocosLinha1 = this.blocosConfig.slice(0,1);
  readonly blocosLinha2 = this.blocosConfig.slice(1,3);
  readonly blocosLinha3 = this.blocosConfig.slice(3,5);
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
  get adicionaisAtivos(): ItemBase[] { return this.blocos['adicionais']?.itens.filter(a => a.ativo !== false) ?? []; }
  get saboresAtivos(): ItemBase[] { return this.sabores.filter(s => s.ativo !== false); }
  get barracasAtivas(): ItemBase[] { return this.barracas.filter(b => b.ativo !== false); }

  saboresNomesDoItem(item: ItemBase): string {
    if (item.saboresPermitidos === undefined) return 'Todos';
    if (item.saboresPermitidos.length === 0) return 'Nenhum';
    return item.saboresPermitidos
      .map(id => this.sabores.find(s => s.id === id)?.nome ?? id)
      .join(', ');
  }

  barracasNomesDoItem(item: ItemBase): string {
    if (item.barracasPermitidas === undefined) return 'Todas';
    if (item.barracasPermitidas.length === 0) return 'Nenhuma';
    return item.barracasPermitidas
      .map(id => this.barracas.find(b => b.id === id)?.nome ?? id)
      .join(', ');
  }

  viasImpressaoLabel(item: ItemBase): string {
    if (item.viasImpressao === 'nenhuma') return 'Nenhuma';
    if (!item.viasImpressao || item.viasImpressao === 'ambas') return 'Ambas';
    if (item.viasImpressao === 'cliente') return 'Só cliente';
    return 'Só produção';
  }

  private viasToArray(vias: string | undefined): string[] {
    if (vias === 'nenhuma') return [];
    if (!vias || vias === 'ambas') return ['cliente', 'producao'];
    return [vias];
  }

  private arrayToVias(arr: string[]): string {
    if (arr.includes('cliente') && arr.includes('producao')) return 'ambas';
    if (arr.includes('cliente')) return 'cliente';
    if (arr.includes('producao')) return 'producao';
    return 'nenhuma';
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
      const todosAsBarracas = this.barracas.map(b => b.id);
      const barracasValue = barracas.length === todosAsBarracas.length && todosAsBarracas.every(id => barracas.includes(id))
        ? undefined
        : barracas;
      const extra: Record<string, unknown> = {
        saboresPermitidos: saboresValue,
        barracasPermitidas: barracasValue,
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
    return { itens: [], loading: true, novoNome: '', novoPreco: null, novoQtdSabores: null, novoSaboresPermitidos: [], novoBarracasPermitidas: [], novoVias: ['cliente', 'producao'], saving: false, editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null, editingSaboresPermitidos: [], editingBarracasPermitidas: [], editingVias: ['cliente', 'producao'], togglingId: null, erro: '', expandidoId: null };
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

  onQtdSaboresChange(col: ColecaoItens, modo: 'novo' | 'edicao', valor: number | null): void {
    if ((valor ?? 0) === 0) {
      if (modo === 'novo') this.blocos[col].novoSaboresPermitidos = [];
      else this.blocos[col].editingSaboresPermitidos = [];
    }
  }

  canAdicionar(col: ColecaoItens): boolean {
    const b = this.blocos[col];
    const config = this.blocosConfig.find(c => c.col === col);
    if (!b.novoNome.trim()) return false;
    if (config?.temPreco && b.novoPreco == null) return false;
    if (config?.temQtdSabores && b.novoQtdSabores == null) return false;
    if (config?.temQtdSabores && (b.novoQtdSabores ?? 0) > 0 && b.novoSaboresPermitidos.length === 0) return false;
    if (config?.temQtdSabores && this.barracasAtivas.length > 0 && b.novoBarracasPermitidas.length === 0) return false;
    return true;
  }

  async adicionar(col: ColecaoItens): Promise<void> {
    const b = this.blocos[col];
    const config = this.blocosConfig.find(c => c.col === col);
    if (!this.canAdicionar(col) || b.saving) return;
    const nomeNormalizado = b.novoNome.trim().toLowerCase();
    const duplicado = b.itens.some(i => i.nome.trim().toLowerCase() === nomeNormalizado);
    if (duplicado) {
      b.erro = `Já existe um item com o nome "${b.novoNome.trim()}".`;
      return;
    }
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
      // todos selecionados = undefined; lista vazia = nenhuma; parcial = só essas
      const todosAsBarracas = this.barracas.map(b => b.id);
      const barracasNovas = b.novoBarracasPermitidas;
      extra['barracasPermitidas'] = barracasNovas.length === todosAsBarracas.length && todosAsBarracas.every(id => barracasNovas.includes(id))
        ? undefined
        : barracasNovas;
      if (config?.temViasImpressao) {
        extra['viasImpressao'] = this.arrayToVias(b.novoVias);
      }
      await this.itensService.addItem(col, b.novoNome, extra);
      b.novoNome = '';
      b.novoPreco = null;
      b.novoQtdSabores = null;
      b.novoSaboresPermitidos = [];
      b.novoBarracasPermitidas = [];
      if (config?.temViasImpressao) {
        b.novoVias = ['cliente', 'producao'];
      }
    } catch {
      b.erro = 'Erro ao adicionar item.';
    } finally {
      b.saving = false;
    }
  }

  iniciarEdicao(col: ColecaoItens, item: ItemBase): void {
    Object.assign(this.blocos[col], { editingId: item.id, editingNome: item.nome, editingPreco: item.preco ?? null, editingQtdSabores: item.qtdSabores ?? null, editingSaboresPermitidos: [...(item.saboresPermitidos ?? [])], editingBarracasPermitidas: [...(item.barracasPermitidas ?? [])], editingVias: this.viasToArray(item.viasImpressao), erro: '' });
  }

  cancelarEdicao(col: ColecaoItens): void {
    Object.assign(this.blocos[col], { editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null, editingSaboresPermitidos: [], editingBarracasPermitidas: [], editingVias: ['cliente', 'producao'] });
  }

  async salvarEdicao(col: ColecaoItens): Promise<void> {
    const b = this.blocos[col];
    const config = this.blocosConfig.find(c => c.col === col);
    if (!b.editingId || !b.editingNome.trim() || b.saving) return;
    if (config?.temPreco && b.editingPreco == null) return;
    if (config?.temQtdSabores && b.editingQtdSabores == null) return;
    if (config?.temQtdSabores && (b.editingQtdSabores ?? 0) > 0 && b.editingSaboresPermitidos.length === 0) return;
    if (config?.temQtdSabores && this.barracasAtivas.length > 0 && b.editingBarracasPermitidas.length === 0) return;
    const nomeNormalizado = b.editingNome.trim().toLowerCase();
    const duplicado = b.itens.some(i => i.id !== b.editingId && i.nome.trim().toLowerCase() === nomeNormalizado);
    if (duplicado) {
      b.erro = `Já existe um item com o nome "${b.editingNome.trim()}".`;
      return;
    }
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
      // barracas: todos = undefined; vazio = nenhuma; parcial = só essas
      const todosAsBarracasEdit = this.barracas.map(b => b.id);
      const barracasArr = b.editingBarracasPermitidas;
      const barracasValue = barracasArr.length === todosAsBarracasEdit.length && todosAsBarracasEdit.every(id => barracasArr.includes(id))
        ? undefined
        : barracasArr;
      extra['barracasPermitidas'] = barracasValue;
      if (config?.temViasImpressao) {
        extra['viasImpressao'] = this.arrayToVias(b.editingVias);
      }
      await this.itensService.updateItem(col, b.editingId, b.editingNome, extra);
      Object.assign(b, { editingId: null, editingNome: '', editingPreco: null, editingQtdSabores: null, editingSaboresPermitidos: [], editingBarracasPermitidas: [], editingVias: ['cliente', 'producao'] });
    } catch {
      b.erro = 'Erro ao salvar edição.';
    } finally {
      b.saving = false;
    }
  }

  async toggleAtivo(col: ColecaoItens, item: ItemBase): Promise<void> {
    const ativar = !(item.ativo ?? true);
    const acao = ativar ? 'ativar' : 'desativar';

    let produtosAfetados: ItemBase[] = [];
    let campoProduto: 'saboresPermitidos' | 'barracasPermitidas' | null = null;

    if (!ativar) {
      if (col === 'sabores') {
        campoProduto = 'saboresPermitidos';
        produtosAfetados = this.blocos['produtos'].itens.filter(p =>
          Array.isArray(p.saboresPermitidos) && p.saboresPermitidos.includes(item.id)
        );
      } else if (col === 'barracas') {
        campoProduto = 'barracasPermitidas';
        produtosAfetados = this.blocos['produtos'].itens.filter(p =>
          Array.isArray(p.barracasPermitidas) && p.barracasPermitidas.includes(item.id)
        );
      }
    }

    let mensagem = `Deseja ${acao} "${item.nome}"?`;
    if (produtosAfetados.length > 0) {
      const nomes = produtosAfetados.map(p => `"${p.nome}"`).join(', ');
      mensagem += `\n\nAtenção: este item está associado aos produtos ${nomes}. Ao desativar, será removido da configuração desses produtos.`;
    }

    const ref = this.dialog.open(ConfirmacaoDialogComponent, {
      data: {
        titulo: ativar ? 'Ativar item' : 'Desativar item',
        mensagem,
        labelSim: `Sim, ${acao}`,
        labelNao: 'Cancelar',
      },
      width: '420px',
    });
    const confirmar = await firstValueFrom(ref.afterClosed());
    if (!confirmar) return;
    const b = this.blocos[col];
    b.togglingId = item.id;
    b.erro = '';
    try {
      await this.itensService.toggleAtivo(col, item.id, ativar);
      if (campoProduto && produtosAfetados.length > 0) {
        await this.itensService.removerItemDeProdutos(campoProduto, item.id, produtosAfetados);
      }
    } catch {
      b.erro = 'Erro ao alterar status do item.';
    } finally {
      b.togglingId = null;
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
