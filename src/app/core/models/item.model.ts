export interface ItemBase {
  id: string;
  nome: string;
  preco?: number;
  qtdSabores?: number;
  saboresPermitidos?: string[];
  barracasPermitidas?: string[];
}

export type ColecaoItens = 'produtos' | 'sabores' | 'adicionais' | 'perfis' | 'barracas';
