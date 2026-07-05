export interface ItemBase {
  id: string;
  nome: string;
  preco?: number;
  qtdSabores?: number;
  saboresPermitidos?: string[];
  barracasPermitidas?: string[];
  viasImpressao?: 'ambas' | 'cliente' | 'producao' | 'nenhuma';
  ativo?: boolean;
}

export type ColecaoItens = 'produtos' | 'sabores' | 'adicionais' | 'perfis' | 'barracas';
