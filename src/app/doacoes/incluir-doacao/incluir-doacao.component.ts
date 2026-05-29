import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VendasService } from '../../core/services/vendas.service';

@Component({
  selector: 'app-incluir-doacao',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule
  ],
  templateUrl: './incluir-doacao.component.html',
  styleUrl: './incluir-doacao.component.scss'
})
export class IncluirDoacaoComponent {
  private router = inject(Router);
  private vendasService = inject(VendasService);

  valor: number | null = null;
  saving = false;
  sucesso = false;
  erro = '';

  async registrar(): Promise<void> {
    if (!this.valor || this.valor <= 0 || this.saving) return;
    this.saving = true;
    this.sucesso = false;
    this.erro = '';
    try {
      await this.vendasService.addVenda({ valor: this.valor, tipo: 'doacao' });
      this.valor = null;
      this.sucesso = true;
      setTimeout(() => (this.sucesso = false), 3000);
    } catch {
      this.erro = 'Erro ao registrar doação. Tente novamente.';
    } finally {
      this.saving = false;
    }
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }
}
