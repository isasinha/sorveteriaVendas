import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PessoasService } from '../../core/services/pessoas.service';
import { Pessoa } from '../../core/models/pessoa.model';
import { ItemBase } from '../../core/models/item.model';
import { PerfilCompleto, FUNCIONALIDADES, isTI } from '../../core/models/perfil.model';

@Component({
  selector: 'app-controle-perfil',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatCheckboxModule,
  ],
  templateUrl: './controle-perfil.component.html',
  styleUrl: './controle-perfil.component.scss'
})
export class ControlePerfilComponent implements OnInit {
  private router = inject(Router);
  private pessoasService = inject(PessoasService);
  private destroyRef = inject(DestroyRef);

  readonly funcionalidades = FUNCIONALIDADES;
  readonly isTI = isTI;

  pessoas: Pessoa[] = [];
  barracas: ItemBase[] = [];
  perfis: PerfilCompleto[] = [];
  loading = true;
  erroCarregar = '';

  busca = '';
  selecionada: Pessoa | null = null;

  get pessoasFiltradas(): Pessoa[] {
    const termo = this.busca.trim().toLowerCase();
    if (!termo) return [];
    return this.pessoas.filter(p =>
      p.nome.toLowerCase().includes(termo) || p.id.toLowerCase().includes(termo)
    );
  }

  formBarraca = '';
  formPerfil = '';
  formEmail = '';
  saving = false;
  sucesso = false;
  erroSalvar = '';

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

  voltar(): void {
    this.router.navigate(['/menu']);
  }
}
