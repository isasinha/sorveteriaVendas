export function formatPreco(valor: number | null | undefined): string {
  if (valor == null) return '';
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}
