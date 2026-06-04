export interface ItemPedido {
  tipoId: string;
  tipoNome: string;
  tipoPreco: number | null;
  saboresIds: string[];
  saboresNomes: string[];
  adicionaisIds: string[];
  adicionaisNomes: string[];
  quantidade: number;
  entregue?: boolean;
  quantidadeEntregue?: number;
}

export interface NovoPedido {
  nomeCliente: string;
  itens: ItemPedido[];
  total: number;
  criadoPorEmail?: string;
  barracaId?: string;
}

export interface NovaDoacaoAvulsa {
  total: number;
  descricao?: string;
}

export interface Pedido {
  id: string;
  numero: number;
  nomeCliente: string;
  itens: ItemPedido[];
  total: number;
  valorPago?: number;
  doacao?: number;
  data: Date;
  entregue: boolean;
  pago: boolean;
  cancelado?: boolean;
  naoRetirado?: boolean;
  criadoPorEmail?: string;
  barracaId?: string;
}

export type StatusPedido = 'a-pagar' | 'em-preparacao' | 'concluido' | 'cancelado' | 'nao-retirado';

export function getStatusPedido(pedido: Pedido): StatusPedido {
  if (pedido.naoRetirado) return 'nao-retirado';
  if (pedido.cancelado)   return 'cancelado';
  if (pedido.pago && pedido.entregue) return 'concluido';
  if (pedido.pago) return 'em-preparacao';
  return 'a-pagar';
}

export const STATUS_LABEL: Record<StatusPedido, string> = {
  'a-pagar':      'A pagar',
  'em-preparacao':   'Em preparação',
  'concluido':    'Concluído',
  'cancelado':    'Cancelado',
  'nao-retirado': 'Não retirado',
};

export const STATUS_ICON: Record<StatusPedido, string> = {
  'a-pagar':      'payments',
  'em-preparacao':   'hourglass_top',
  'concluido':    'check_circle',
  'cancelado':    'cancel',
  'nao-retirado': 'inventory_2',
};

export function resumoItemPedido(item: ItemPedido): string {
  const partes: string[] = [item.tipoNome];
  if (item.saboresNomes.length) partes.push(item.saboresNomes.join(', '));
  if (item.adicionaisNomes.length) partes.push(`+ ${item.adicionaisNomes.join(', ')}`);
  return partes.join(' — ');
}
