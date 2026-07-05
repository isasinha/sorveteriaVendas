export type Funcionalidade =
  | 'pedidos.novo'
  | 'pedidos.consultar'
  | 'doacoes.incluir'
  | 'itens.alterar'
  | 'perfil.controle'
  | 'relatorios'
  | 'logs';

export const FUNCIONALIDADES: { chave: Funcionalidade; label: string }[] = [
  { chave: 'pedidos.novo',      label: 'Novo Pedido' },
  { chave: 'pedidos.consultar', label: 'Consultar Pedidos' },
  { chave: 'doacoes.incluir',                     label: 'Incluir Doação' },
  { chave: 'itens.alterar',     label: 'Configurações' },
  { chave: 'perfil.controle',   label: 'Controle de Perfil' },
  { chave: 'relatorios',        label: 'Relatórios' },
  { chave: 'logs',              label: 'Logs' },
];

export type FiltroConsultar = 'todos' | 'em-preparacao' | 'concluidos' | 'nao-pagos' | 'cancelados';

export const FILTROS_CONSULTAR: { chave: FiltroConsultar; label: string }[] = [
  { chave: 'todos',         label: 'Todos' },
  { chave: 'em-preparacao', label: 'Em preparação' },
  { chave: 'concluidos',    label: 'Concluídos' },
  { chave: 'nao-pagos',     label: 'Não pagos' },
  { chave: 'cancelados',    label: 'Cancelados / Não retirados' },
];

export type EscopoBarraca = 'todas' | 'propria';

export interface PerfilCompleto {
  id: string;
  nome: string;
  permissoes?: Funcionalidade[];
  escopo?: EscopoBarraca;
  filtrosVisiveis?: FiltroConsultar[];
  idBarraca?: string;
}

export function isTI(nome: string): boolean {
  return nome.trim().toLowerCase() === 'ti';
}
