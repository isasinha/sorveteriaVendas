export interface ItemBase {
  id: string;
  nome: string;
  preco?: number;
  qtdSabores?: number;
}

export type ColecaoItens = 'tipos' | 'sabores' | 'adicionais' | 'perfis' | 'barracas';
