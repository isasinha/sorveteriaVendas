export function formatPreco(valor: number | null | undefined): string {
  if (valor == null) return '';
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

export function formatData(data: Date): string {
  return data.toLocaleDateString('pt-BR');
}

export function formatHora(data: Date): string {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDataHora(data: Date): string {
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
