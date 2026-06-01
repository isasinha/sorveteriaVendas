export interface ItemPedido {
  tipoId: string;
  tipoNome: string;
  tipoPreco: number | null;
  saboresIds: string[];
  saboresNomes: string[];
  adicionaisIds: string[];
  adicionaisNomes: string[];
  quantidade: number;
}

export interface NovoPedido {
  nomeCliente: string;
  itens: ItemPedido[];
  total: number;
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
  doacao?: number;
  data: Date;
  entregue: boolean;
  pago: boolean;
}

export type StatusPedido = 'a-pagar' | 'em-preparo' | 'concluido';

export function getStatusPedido(pedido: Pedido): StatusPedido {
  if (pedido.pago && pedido.entregue) return 'concluido';
  if (pedido.pago) return 'em-preparo';
  return 'a-pagar';
}

export const STATUS_LABEL: Record<StatusPedido, string> = {
  'a-pagar':    'A pagar',
  'em-preparo': 'Em preparo',
  'concluido':  'Concluído',
};

export const STATUS_ICON: Record<StatusPedido, string> = {
  'a-pagar':    'payments',
  'em-preparo': 'hourglass_top',
  'concluido':  'check_circle',
};

export function resumoItemPedido(item: ItemPedido): string {
  const partes: string[] = [item.tipoNome];
  if (item.saboresNomes.length) partes.push(item.saboresNomes.join(', '));
  if (item.adicionaisNomes.length) partes.push(`+ ${item.adicionaisNomes.join(', ')}`);
  return partes.join(' — ');
}
