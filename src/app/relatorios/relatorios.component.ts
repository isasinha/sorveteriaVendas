import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';
import { ItensService } from '../core/services/itens.service';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, FormsModule, KeyValuePipe],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.scss'
})
export class RelatoriosComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private itensService = inject(ItensService);
  private destroyRef = inject(DestroyRef);

  readonly podeVerTodasBarracas = this.authService.getPerfil()?.escopo === 'todas';

  barracasMap = new Map<string, string>();
  barracaFiltro: string = 'todas';

  ngOnInit(): void {
    if (!this.podeVerTodasBarracas) return;
    this.itensService.getItens('barracas')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(b => this.barracasMap = new Map(b.map(x => [x.id, x.nome])));
  }

  voltar() {
    this.router.navigate(['/menu']);
  }
}
