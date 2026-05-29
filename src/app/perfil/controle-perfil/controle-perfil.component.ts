import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PessoasService } from '../../core/services/pessoas.service';
import { Pessoa } from '../../core/models/pessoa.model';
import { ItemBase } from '../../core/models/item.model';
import { PerfilCompleto, Funcionalidade, FUNCIONALIDADES, isGerencia } from '../../core/models/perfil.model';

@Component({
  selector: 'app-controle-perfil',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule,
    MatCheckboxModule, MatTooltipModule,
  ],
  templateUrl: './controle-perfil.component.html',
  styleUrl: './controle-perfil.component.scss'
})
export class ControlePerfilComponent implements OnInit {
  private router = inject(Router);
  private pessoasService = inject(PessoasService);
  private destroyRef = inject(DestroyRef);

  readonly funcionalidades = FUNCIONALIDADES;
  readonly isGerencia = isGerencia;

  pessoas: Pessoa[] = [];
  barracas: ItemBase[] = [];
  perfis: PerfilCompleto[] = [];
  loading = true;
  erroCarregar = '';

  // Atribuição de pessoa
  selecionada: Pessoa | null = null;
  formBarraca = '';
  formPerfil = '';
  formEmail = '';
  saving = false;
  sucesso = false;
  erroSalvar = '';

  // Permissões por perfil
  editPermissoes = new Map<string, Set<Funcionalidade>>();
  savingPerfilId: string | null = null;
  erroPermissoes = '';
  sucessoPerfilId: string | null = null;

  ngOnInit(): void {
    combineLatest([
      this.pessoasService.getPessoas(),
      this.pessoasService.getBarracas(),
      this.pessoasService.getPerfis(),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([pessoas, barracas, perfis]) => {
        this.pessoas = pessoas;
        this.barracas = barracas;
        this.perfis = perfis;
        this.loading = false;
        perfis.forEach(p => {
          if (!this.editPermissoes.has(p.id)) {
            this.editPermissoes.set(p.id, new Set(p.permissoes ?? []));
          }
        });
        if (this.selecionada) {
          const atualizada = pessoas.find(p => p.id === this.selecionada!.id);
          if (atualizada) this.selecionada = atualizada;
        }
      },
      error: () => {
        this.loading = false;
        this.erroCarregar = 'Erro ao carregar dados.';
      }
    });
  }

  selecionar(pessoa: Pessoa): void {
    this.selecionada = pessoa;
    this.formBarraca = pessoa.idBarraca ?? '';
    this.formPerfil = pessoa.idPerfil ?? '';
    this.formEmail = pessoa.email ?? '';
    this.sucesso = false;
    this.erroSalvar = '';
  }

  nomeDe(lista: { id: string; nome: string }[], id: string): string {
    return lista.find(i => i.id === id)?.nome ?? '—';
  }

  temAtribuicao(pessoa: Pessoa): boolean {
    return !!(pessoa.idBarraca && pessoa.idPerfil);
  }

  async salvar(): Promise<void> {
    if (!this.selecionada || this.saving) return;
    this.saving = true;
    this.sucesso = false;
    this.erroSalvar = '';
    try {
      await this.pessoasService.updateAtribuicao(this.selecionada.id, {
        idBarraca: this.formBarraca,
        idPerfil:  this.formPerfil,
        email:     this.formEmail,
      });
      this.sucesso = true;
      setTimeout(() => (this.sucesso = false), 3000);
    } catch {
      this.erroSalvar = 'Erro ao salvar atribuição.';
    } finally {
      this.saving = false;
    }
  }

  temPermissaoPerfil(perfilId: string, chave: Funcionalidade): boolean {
    return this.editPermissoes.get(perfilId)?.has(chave) ?? false;
  }

  togglePermissao(perfilId: string, chave: Funcionalidade): void {
    const set = this.editPermissoes.get(perfilId);
    if (!set) return;
    if (set.has(chave)) set.delete(chave); else set.add(chave);
  }

  async salvarPermissoes(perfilId: string): Promise<void> {
    if (this.savingPerfilId) return;
    this.savingPerfilId = perfilId;
    this.erroPermissoes = '';
    this.sucessoPerfilId = null;
    try {
      const permissoes = Array.from(this.editPermissoes.get(perfilId) ?? []);
      await this.pessoasService.updatePermissoes(perfilId, permissoes);
      this.sucessoPerfilId = perfilId;
      setTimeout(() => (this.sucessoPerfilId = null), 3000);
    } catch {
      this.erroPermissoes = 'Erro ao salvar permissões.';
    } finally {
      this.savingPerfilId = null;
    }
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }
}
