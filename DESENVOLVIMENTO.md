# 🎯 Guia de Desenvolvimento - SorveteriaVendas

## 📂 Estrutura Criada

### Componentes
- **LoginComponent** (`src/app/auth/login/`) - Tela de autenticação
- **MenuComponent** (`src/app/menu/`) - Menu principal com 5 cards

### Serviços
- **AuthService** (`src/app/core/services/auth.service.ts`) - Gerenciamento de autenticação

### Guards
- **authGuard** (`src/app/core/guards/auth.guard.ts`) - Proteção de rotas autenticadas

### Configurações
- **firebase.config.ts** - Configuração do Firebase (mesmo banco da Gerencia)
- **app.routes.ts** - Sistema de rotas
- **app.config.ts** - Configuração da aplicação

## 🎨 Cards do Menu

Os 5 cards criados no menu são:

1. **Nova Venda** 🛒
   - Cor: Rosa (#e91e63)
   - Rota: `/vendas/nova`
   - Função: Registrar novas vendas

2. **Vendas do Dia** 📅
   - Cor: Rosa claro (#ff4081)
   - Rota: `/vendas/dia`
   - Função: Visualizar vendas do dia atual

3. **Estoque** 📦
   - Cor: Roxo (#673ab7)
   - Rota: `/estoque`
   - Função: Gerenciar estoque de produtos

4. **Produtos** 🍨
   - Cor: Verde (#009688)
   - Rota: `/produtos`
   - Função: Catálogo de sabores e produtos

5. **Relatórios** 📊
   - Cor: Laranja (#ff9800)
   - Rota: `/relatorios`
   - Função: Estatísticas e relatórios

## 🚀 Próximos Passos para Implementação

### 1. Implementar Componente de Nova Venda

```bash
# Criar o componente
ng generate component vendas/nova-venda --standalone
```

**Funcionalidades sugeridas:**
- Seleção de produtos/sabores
- Quantidade e tamanho
- Cálculo do valor total
- Forma de pagamento
- Registro no Firestore

### 2. Implementar Vendas do Dia

```bash
ng generate component vendas/vendas-dia --standalone
```

**Funcionalidades sugeridas:**
- Lista de vendas realizadas hoje
- Total do dia
- Filtros por vendedor/produto
- Detalhes de cada venda

### 3. Implementar Gestão de Estoque

```bash
ng generate component estoque --standalone
```

**Funcionalidades sugeridas:**
- Lista de produtos em estoque
- Entrada e saída de produtos
- Alertas de estoque baixo
- Histórico de movimentações

### 4. Implementar Catálogo de Produtos

```bash
ng generate component produtos --standalone
```

**Funcionalidades sugeridas:**
- Lista de sabores disponíveis
- Preços por tamanho
- Adicionar/editar produtos
- Status (disponível/indisponível)

### 5. Implementar Relatórios

```bash
ng generate component relatorios --standalone
```

**Funcionalidades sugeridas:**
- Gráficos de vendas
- Produtos mais vendidos
- Período de análise
- Exportação de dados

## 📊 Modelo de Dados Sugerido

### Coleção: vendas
```typescript
interface Venda {
  id: string;
  data: Timestamp;
  produtos: {
    produtoId: string;
    nome: string;
    sabor: string;
    quantidade: number;
    tamanho: string;
    valorUnitario: number;
  }[];
  valorTotal: number;
  formaPagamento: string; // 'dinheiro' | 'cartao' | 'pix'
  vendedorId: string;
  vendedorNome: string;
  status: string; // 'concluida' | 'cancelada'
}
```

### Coleção: produtos
```typescript
interface Produto {
  id: string;
  nome: string;
  tipo: string; // 'sorvete' | 'picole' | 'acai'
  sabores: string[];
  precos: {
    pequeno?: number;
    medio?: number;
    grande?: number;
  };
  estoque: number;
  ativo: boolean;
}
```

### Coleção: estoque_movimentacoes
```typescript
interface MovimentacaoEstoque {
  id: string;
  data: Timestamp;
  produtoId: string;
  produtoNome: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  usuarioId: string;
  observacao?: string;
}
```

## 🎨 Padrão de Design

O projeto segue os padrões estabelecidos:
- **Cores:** Definidas em `_variables.scss`
- **Mixins:** Reutilizáveis em `_mixins.scss`
- **Material Design:** Usando Angular Material
- **Standalone Components:** Arquitetura moderna do Angular

## 🔐 Segurança

- As rotas principais estão protegidas com `authGuard`
- Autenticação via Firebase Authentication
- Dados armazenados no Firestore (mesmo banco da Gerencia)

## 📱 Responsividade

Todos os componentes são responsivos com breakpoints:
- Mobile: até 480px
- Tablet: até 768px
- Desktop: acima de 1024px

## 🔄 Integração com SorveteriaGerencia

Ambos os sistemas compartilham:
- Mesmo projeto Firebase
- Mesmas coleções no Firestore
- Mesma autenticação
- Permitem trabalho integrado

## 💡 Dicas de Desenvolvimento

1. Use os mesmos serviços do Firestore para manter consistência
2. Implemente validações nos formulários
3. Adicione loading states nas operações assíncronas
4. Implemente tratamento de erros apropriado
5. Considere adicionar confirmações para ações importantes
6. Use Material Dialogs para formulários modais
7. Implemente paginação para listas grandes
