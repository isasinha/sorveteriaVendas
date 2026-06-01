export interface ItemBase {
  id: string;
  nome: string;
  preco?: number;
  qtdSabores?: number;
}

export type ColecaoItens = 'produtos' | 'sabores' | 'adicionais' | 'perfis' | 'barracas';
