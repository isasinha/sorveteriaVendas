export type Funcionalidade =
  | 'pedidos.novo'
  | 'pedidos.consultar'
  | 'doacoes.incluir'
  | 'itens.alterar'
  | 'perfil.controle'
  | 'relatorios';

export const FUNCIONALIDADES: { chave: Funcionalidade; label: string }[] = [
  { chave: 'pedidos.novo',      label: 'Novo Pedido' },
  { chave: 'pedidos.consultar', label: 'Consultar Pedidos' },
  { chave: 'doacoes.incluir',   label: 'Incluir Doação' },
  { chave: 'itens.alterar',     label: 'Alterar Itens' },
  { chave: 'perfil.controle',   label: 'Controle de Perfil' },
  { chave: 'relatorios',        label: 'Relatórios' },
];

export interface PerfilCompleto {
  id: string;
  nome: string;
  permissoes?: Funcionalidade[];
}

export function isGerencia(nome: string): boolean {
  return ['gerência', 'gerencia'].includes(nome.trim().toLowerCase());
}
