import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CurrencyPipe, KeyValuePipe } from '@angular/common';
import { formatPreco, formatDataHora } from '../core/utils/formatters';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';
import { ItensService } from '../core/services/itens.service';
import { PedidosService } from '../core/services/pedidos.service';
import { Pedido, StatusPedido, getStatusPedido, STATUS_LABEL } from '../core/models/pedido.model';
import { isTI } from '../core/models/perfil.model';

interface ResumoFinanceiro {
  totalArrecadado: number;
  totalDoacoes: number;
  totalPedidos: number;
  pedidosPagos: number;
  pedidosCancelados: number;
  pedidosNaoRetirados: number;
  ticketMedio: number;
}

interface ItemRanking {
  nome: string;
  quantidade: number;
}

interface PontoGrafico {
  label: string;
  pedidos: number;
  receita: number;
}

interface SerieGrafico {
  linha: string;
  area: string;
  circles: Array<{ cx: number; cy: number }>;
  yLabels: Array<{ y: number; label: string }>;
  comCirculos: boolean;
}

interface DadosGrafico {
  granularidadeLabel: string;
  xLabels: Array<{ x: number; label: string }>;
  pedidos: SerieGrafico;
  receita: SerieGrafico;
}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, FormsModule, CurrencyPipe, KeyValuePipe],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.scss'
})
export class RelatoriosComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private itensService = inject(ItensService);
  private pedidosService = inject(PedidosService);
  private destroyRef = inject(DestroyRef);

  readonly podeVerTodasBarracas: boolean;
  readonly barracaFixa: string | undefined;

  barracasMap = new Map<string, string>();
  barracaFiltro = 'todas';

  dataInicio = this.hojeString();
  horaInicio = '00:00';
  dataFim = this.hojeString();
  horaFim = '23:59';

  carregando = true;

  private todosOsPedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];

  resumo: ResumoFinanceiro = this.resumoVazio();
  produtosMaisVendidos: ItemRanking[] = [];
  saboresMaisVendidos: ItemRanking[] = [];
  statusCounts: Partial<Record<StatusPedido, number>> = {};
  dadosGrafico: DadosGrafico | null = null;

  readonly statusOrdem: StatusPedido[] = ['concluido', 'em-preparacao', 'a-pagar', 'nao-retirado', 'cancelado'];
  readonly STATUS_LABEL = STATUS_LABEL;
  readonly formatPreco = formatPreco;
  readonly formatDataHora = formatDataHora;

  constructor() {
    const perfil = this.authService.getPerfil();
    this.podeVerTodasBarracas = perfil?.escopo === 'todas';
    const isCoordenador = perfil?.escopo === 'propria' && !!perfil.idBarraca && !isTI(perfil.nome ?? '');
    this.barracaFixa = isCoordenador ? perfil!.idBarraca : undefined;
    this.barracaFiltro = this.barracaFixa ?? 'todas';
  }

  ngOnInit(): void {
    if (this.podeVerTodasBarracas) {
      this.itensService.getItens('barracas')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(b => this.barracasMap = new Map(b.map(x => [x.id, x.nome])));
    }

    this.pedidosService.getPedidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pedidos => {
        this.todosOsPedidos = pedidos;
        this.carregando = false;
        this.calcularRelatorios();
      });
  }

  aplicarFiltros(): void {
    this.calcularRelatorios();
  }

  imprimirBase(): void {
    window.print();
  }

  get dataGeracao(): string {
    return formatDataHora(new Date());
  }

  get descricaoFiltro(): string {
    const de = `${this.dataInicio.split('-').reverse().join('/')} ${this.horaInicio}`;
    const ate = `${this.dataFim.split('-').reverse().join('/')} ${this.horaFim}`;
    const barraca = this.barracaFiltro === 'todas'
      ? 'Todas as barracas'
      : (this.barracasMap.get(this.barracaFiltro) ?? this.barracaFiltro);
    return `${de} até ${ate} — ${barraca}`;
  }

  get maxRankingProdutos(): number {
    return this.produtosMaisVendidos[0]?.quantidade ?? 1;
  }

  get maxRankingSabores(): number {
    return this.saboresMaisVendidos[0]?.quantidade ?? 1;
  }

  nomeBarraca(id: string): string {
    return this.barracasMap.get(id) ?? id;
  }

  voltar(): void {
    this.router.navigate(['/menu']);
  }

  private calcularRelatorios(): void {
    const pedidos = this.filtrarPedidos();
    this.pedidosFiltrados = [...pedidos].sort((a, b) => a.data.getTime() - b.data.getTime());
    this.resumo = this.calcularResumo(pedidos);
    this.produtosMaisVendidos = this.calcularRankingProdutos(pedidos);
    this.saboresMaisVendidos = this.calcularRankingSabores(pedidos);
    this.statusCounts = this.calcularStatusCounts(pedidos);
    this.dadosGrafico = this.calcularGraficoLinhas(pedidos);
  }

  private filtrarPedidos(): Pedido[] {
    const inicio = this.parseDatetime(this.dataInicio, this.horaInicio);
    const fim = this.parseDatetime(this.dataFim, this.horaFim);
    fim.setSeconds(59, 999);

    return this.todosOsPedidos.filter(p => {
      const data = new Date(p.data);
      if (data < inicio || data > fim) return false;
      if (this.barracaFiltro !== 'todas' && p.barracaId !== this.barracaFiltro) return false;
      return true;
    });
  }

  private calcularResumo(pedidos: Pedido[]): ResumoFinanceiro {
    const pagos = pedidos.filter(p => p.pago && !p.cancelado && !p.naoRetirado);
    const cancelados = pedidos.filter(p => p.cancelado).length;
    const naoRetirados = pedidos.filter(p => p.naoRetirado).length;

    const totalArrecadado = pagos.reduce((s, p) => s + (p.total ?? 0), 0);
    const totalDoacoes = pagos.reduce((s, p) => s + (p.doacao ?? 0), 0);
    const ticketMedio = pagos.length > 0 ? totalArrecadado / pagos.length : 0;

    return {
      totalArrecadado,
      totalDoacoes,
      totalPedidos: pedidos.length,
      pedidosPagos: pagos.length,
      pedidosCancelados: cancelados,
      pedidosNaoRetirados: naoRetirados,
      ticketMedio,
    };
  }

  private calcularRankingProdutos(pedidos: Pedido[]): ItemRanking[] {
    const contagem = new Map<string, number>();
    for (const pedido of pedidos) {
      if (pedido.cancelado || pedido.naoRetirado) continue;
      for (const item of pedido.itens) {
        contagem.set(item.tipoNome, (contagem.get(item.tipoNome) ?? 0) + item.quantidade);
      }
    }
    return Array.from(contagem.entries())
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }

  private calcularRankingSabores(pedidos: Pedido[]): ItemRanking[] {
    const contagem = new Map<string, number>();
    for (const pedido of pedidos) {
      if (pedido.cancelado || pedido.naoRetirado) continue;
      for (const item of pedido.itens) {
        for (const sabor of item.saboresNomes) {
          contagem.set(sabor, (contagem.get(sabor) ?? 0) + item.quantidade);
        }
      }
    }
    return Array.from(contagem.entries())
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }

  private calcularStatusCounts(pedidos: Pedido[]): Partial<Record<StatusPedido, number>> {
    const counts: Partial<Record<StatusPedido, number>> = {};
    for (const pedido of pedidos) {
      const status = getStatusPedido(pedido);
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  private parseDatetime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`);
  }

  private hojeString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private resumoVazio(): ResumoFinanceiro {
    return {
      totalArrecadado: 0,
      totalDoacoes: 0,
      totalPedidos: 0,
      pedidosPagos: 0,
      pedidosCancelados: 0,
      pedidosNaoRetirados: 0,
      ticketMedio: 0,
    };
  }

  // ─── Gráficos de linha do tempo ─────────────────────────────────────────────

  private calcularGraficoLinhas(pedidos: Pedido[]): DadosGrafico | null {
    if (pedidos.length === 0) return null;
    const granular = this.resolverGranularidade();
    const pontos = this.gerarPontosGrafico(pedidos, granular);
    if (pontos.length === 0) return null;
    return this.computarSvg(pontos, granular);
  }

  private resolverGranularidade(): 'hora' | 'dia' | 'semana' {
    const ms = this.parseDatetime(this.dataFim, this.horaFim).getTime()
             - this.parseDatetime(this.dataInicio, this.horaInicio).getTime();
    const dias = ms / 86400000;
    if (dias <= 2) return 'hora';
    if (dias <= 60) return 'dia';
    return 'semana';
  }

  private gerarPontosGrafico(pedidos: Pedido[], granular: 'hora' | 'dia' | 'semana'): PontoGrafico[] {
    const fim = this.parseDatetime(this.dataFim, this.horaFim);
    fim.setSeconds(59, 999);

    const cur = this.parseDatetime(this.dataInicio, this.horaInicio);
    if (granular === 'hora') {
      cur.setMinutes(0, 0, 0);
    } else {
      cur.setHours(0, 0, 0, 0);
      if (granular === 'semana') {
        cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
      }
    }

    const buckets = new Map<string, PontoGrafico>();
    while (cur <= fim) {
      const key = this.bucketKey(cur, granular);
      if (!buckets.has(key)) {
        buckets.set(key, { label: this.bucketLabel(new Date(cur), granular), pedidos: 0, receita: 0 });
      }
      if (granular === 'hora') cur.setHours(cur.getHours() + 1);
      else if (granular === 'dia') cur.setDate(cur.getDate() + 1);
      else cur.setDate(cur.getDate() + 7);
    }

    for (const p of pedidos) {
      if (p.cancelado || p.naoRetirado) continue;
      const b = buckets.get(this.bucketKey(p.data, granular));
      if (b) { b.pedidos++; if (p.pago) b.receita += p.total; }
    }

    return Array.from(buckets.values());
  }

  private bucketKey(d: Date, g: 'hora' | 'dia' | 'semana'): string {
    if (g === 'hora') return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
    if (g === 'dia')  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${mon.getFullYear()}-${mon.getMonth()}-${mon.getDate()}`;
  }

  private bucketLabel(d: Date, g: 'hora' | 'dia' | 'semana'): string {
    const p2 = (n: number) => n.toString().padStart(2, '0');
    if (g === 'hora') return `${p2(d.getDate())}/${p2(d.getMonth() + 1)} ${p2(d.getHours())}h`;
    if (g === 'dia')  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}`;
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${p2(mon.getDate())}/${p2(mon.getMonth() + 1)}`;
  }

  private computarSvg(pontos: PontoGrafico[], granular: 'hora' | 'dia' | 'semana'): DadosGrafico {
    // SVG layout: viewBox="0 0 800 200", chart area x=[55,785] y=[15,155]
    const PL = 55, PT = 15, CW = 730, CH = 140, YB = 155;

    const n = pontos.length;
    const xFn = (i: number) => n <= 1 ? PL + CW / 2 : PL + (i / (n - 1)) * CW;
    const yFn = (v: number, max: number) => max === 0 ? YB : YB - (v / max) * CH;

    const buildSerie = (values: number[]): SerieGrafico => {
      const max = Math.max(...values, 1);
      const pts = values.map((v, i) => `${xFn(i).toFixed(1)},${yFn(v, max).toFixed(1)}`);
      const linha = pts.join(' ');
      const area = `${xFn(0).toFixed(1)},${YB} ${pts.join(' ')} ${xFn(n - 1).toFixed(1)},${YB}`;
      const circles = values.map((v, i) => ({ cx: xFn(i), cy: yFn(v, max) }));
      const yLabels = [1, 0.75, 0.5, 0.25, 0].map(frac => {
        const val = frac * max;
        const label = val === 0 ? '0'
          : val >= 1000 ? `${(val / 1000).toFixed(1)}k`
          : val.toFixed(0);
        return { y: yFn(val, max), label };
      });
      return { linha, area, circles, yLabels, comCirculos: n <= 40 };
    };

    const step = Math.max(1, Math.ceil(n / 8));
    const xLabels: Array<{ x: number; label: string }> = [];
    for (let i = 0; i < n; i++) {
      if (i % step === 0 || i === n - 1) {
        xLabels.push({ x: xFn(i), label: pontos[i].label });
      }
    }

    const labelMap: Record<'hora' | 'dia' | 'semana', string> = {
      hora: 'por hora', dia: 'por dia', semana: 'por semana',
    };

    return {
      granularidadeLabel: labelMap[granular],
      xLabels,
      pedidos: buildSerie(pontos.map(p => p.pedidos)),
      receita: buildSerie(pontos.map(p => p.receita)),
    };
  }
}
