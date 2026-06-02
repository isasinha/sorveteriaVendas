import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import QRCode from 'qrcode';
import { ItemPedido } from '../../core/models/pedido.model';
import { formatPreco } from '../../core/utils/formatters';

interface ImpressaoState {
  numero: number;
  nomeCliente: string;
  itens: ItemPedido[];
  total: number;
  origem?: string;
}

@Component({
  selector: 'app-impressao',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './impressao.component.html',
  styleUrl: './impressao.component.scss'
})
export class ImpressaoComponent implements OnInit {
  private router = inject(Router);

  numero = 0;
  nomeCliente = '';
  itens: ItemPedido[] = [];
  itensExpandidos: ItemPedido[] = [];
  total = 0;
  qrDataUrl = '';
  private origem = '/pedidos/novo';

  ngOnInit(): void {
    const state = history.state as ImpressaoState;
    if (!state?.numero) {
      this.router.navigate([this.origem]);
      return;
    }
    this.numero = state.numero;
    this.nomeCliente = state.nomeCliente;
    this.itens = state.itens;
    this.total = state.total;
    this.origem = state.origem ?? '/pedidos/novo';
    this.itensExpandidos = state.itens.flatMap(item => Array(item.quantidade).fill(item));

    const qrText = `Pedido #${this.numero}\n${this.nomeCliente}`;
    QRCode.toDataURL(qrText, { width: 180, margin: 1, color: { dark: '#000', light: '#fff' } })
      .then(url => {
        this.qrDataUrl = url;
        setTimeout(() => window.print(), 400);
      });
  }

  readonly formatPreco = formatPreco;

  imprimir(): void {
    window.print();
  }

  voltar(): void {
    this.router.navigate([this.origem]);
  }
}
