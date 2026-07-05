import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LogService } from '../core/services/log.service';
import { LogEvento } from '../core/models/log.model';
import { formatDataHora } from '../core/utils/formatters';

const ACAO_LABEL: Record<string, string> = {
  'auth.login':                    'Login',
  'auth.logout':                   'Logout',
  'pedido.criado':                 'Pedido criado',
  'pedido.alterado':               'Pedido alterado',
  'pedido.pago':                   'Pedido pago',
  'pedido.cancelado':              'Pedido cancelado',
  'pedido.cancelamento-desfeito':  'Cancelamento desfeito',
  'pedido.nao-retirado':           'Não retirado',
  'pedido.nao-retirado-desfeito':  'Não retirado desfeito',
  'pedido.entregue':               'Pedido entregue',
  'pedido.entrega-parcial':        'Entrega parcial',
  'doacao.avulsa':                 'Doação avulsa',
  'item.criado':                   'Item criado',
  'item.alterado':                 'Item alterado',
  'item.deletado':                 'Item deletado',
  'item.ativado':                  'Item ativado',
  'item.desativado':               'Item desativado',
};

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss',
})
export class LogsComponent implements OnInit {
  private router = inject(Router);
  private logService = inject(LogService);
  private destroyRef = inject(DestroyRef);

  dataInicio = this.hojeString();
  horaInicio = '00:00';
  dataFim = this.hojeString();
  horaFim = '23:59';

  logs: LogEvento[] = [];
  carregando = true;
  erro = '';

  readonly formatDataHora = formatDataHora;
  readonly ACAO_LABEL = ACAO_LABEL;

  private sub: Subscription | null = null;

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.carregando = true;
    this.erro = '';
    this.sub?.unsubscribe();

    const inicio = this.parseDatetime(this.dataInicio, this.horaInicio);
    const fim = this.parseDatetime(this.dataFim, this.horaFim);

    this.sub = this.logService.getLogs(inicio, fim)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: logs => {
          this.logs = logs;
          this.carregando = false;
        },
        error: () => {
          this.erro = 'Erro ao carregar logs.';
          this.carregando = false;
        }
      });
  }

  imprimir(): void {
    window.print();
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }

  acaoLabel(acao: string): string {
    return ACAO_LABEL[acao] ?? acao;
  }

  acaoClasse(acao: string): string {
    if (acao.startsWith('auth.')) return 'acao-auth';
    if (acao.startsWith('pedido.') || acao === 'doacao.avulsa') return 'acao-pedido';
    if (acao.startsWith('item.')) return 'acao-item';
    return '';
  }

  get dataGeracao(): string {
    return formatDataHora(new Date());
  }

  private parseDatetime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`);
  }

  private hojeString(): string {
    return new Date().toISOString().split('T')[0];
  }
}
