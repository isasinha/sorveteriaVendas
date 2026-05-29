import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { combineLatest, Subscription } from 'rxjs';
import { PessoasService } from '../../core/services/pessoas.service';
import { Pessoa } from '../../core/models/pessoa.model';
import { ItemBase } from '../../core/models/item.model';

@Component({
  selector: 'app-controle-perfil',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule
  ],
  templateUrl: './controle-perfil.component.html',
  styleUrl: './controle-perfil.component.scss'
})
export class ControlePerfilComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private pessoasService = inject(PessoasService);
  private sub: Subscription | null = null;

  pessoas: Pessoa[] = [];
  barracas: ItemBase[] = [];
  perfis: ItemBase[] = [];
  loading = true;
  erroCarregar = '';

  selecionada: Pessoa | null = null;
  formBarraca = '';
  formPerfil = '';
  saving = false;
  sucesso = false;
  erroSalvar = '';

  ngOnInit(): void {
    this.sub = combineLatest([
      this.pessoasService.getPessoas(),
      this.pessoasService.getBarracas(),
      this.pessoasService.getPerfis()
    ]).subscribe({
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  selecionar(pessoa: Pessoa): void {
    this.selecionada = pessoa;
    this.formBarraca = pessoa.idBarraca ?? '';
    this.formPerfil = pessoa.idPerfil ?? '';
    this.sucesso = false;
    this.erroSalvar = '';
  }

  nomeDe(lista: ItemBase[], id: string): string {
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
      await this.pessoasService.updateAtribuicao(
        this.selecionada.id,
        this.formBarraca,
        this.formPerfil
      );
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
