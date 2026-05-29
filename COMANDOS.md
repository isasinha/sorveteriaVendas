# 🔧 Comandos Úteis - SorveteriaVendas

## 📦 Instalação e Configuração

### Instalar dependências
```bash
npm install
```

### Instalar dependências (caso de erro)
```bash
npm install --legacy-peer-deps
```

### Limpar cache e reinstalar
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Desenvolvimento

### Iniciar servidor de desenvolvimento
```bash
npm start
# Ou
ng serve --port 4201
```

### Iniciar com abertura automática do navegador
```bash
ng serve --open --port 4201
```

### Iniciar com configuração específica
```bash
ng serve --configuration development
```

## 🔨 Build

### Build de desenvolvimento
```bash
npm run build
# Ou
ng build
```

### Build de produção
```bash
ng build --configuration production
```

### Build com watch (auto-rebuild)
```bash
npm run watch
```

## 🧪 Testes

### Executar testes
```bash
npm test
# Ou
ng test
```

### Testes com coverage
```bash
ng test --code-coverage
```

## 🎨 Gerar Componentes

### Gerar novo componente
```bash
ng generate component nome-do-componente --standalone
# Ou forma curta:
ng g c nome-do-componente --standalone
```

### Gerar serviço
```bash
ng generate service core/services/nome-do-servico
# Ou:
ng g s core/services/nome-do-servico
```

### Gerar guard
```bash
ng generate guard core/guards/nome-do-guard
# Ou:
ng g g core/guards/nome-do-guard
```

### Gerar interface
```bash
ng generate interface core/models/nome-da-interface
# Ou:
ng g i core/models/nome-da-interface
```

## 📦 Firebase

### Deploy no Firebase Hosting
```bash
npm run build
firebase deploy
```

### Deploy apenas do hosting
```bash
firebase deploy --only hosting
```

### Inicializar Firebase (se necessário)
```bash
firebase init
```

## 🔍 Verificação e Qualidade

### Verificar erros de TypeScript
```bash
ng build --configuration development
```

### Formatar código (se ESLint/Prettier instalado)
```bash
npm run lint
```

### Verificar versões
```bash
ng version
node --version
npm --version
```

## 🧹 Limpeza

### Limpar pasta dist
```bash
# Windows PowerShell
Remove-Item -Recurse -Force dist

# Linux/Mac
rm -rf dist
```

### Limpar cache do Angular
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .angular/cache

# Linux/Mac
rm -rf .angular/cache
```

## 📊 Análise

### Analisar tamanho do bundle
```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/sorveteriaVendas/stats.json
```

### Ver árvore de dependências
```bash
npm list
```

### Ver dependências desatualizadas
```bash
npm outdated
```

## 🔄 Atualização

### Atualizar Angular CLI
```bash
npm install -g @angular/cli@latest
```

### Atualizar dependências do projeto
```bash
ng update @angular/core @angular/cli
```

### Atualizar Material
```bash
ng update @angular/material
```

## 🐛 Debug

### Rodar em modo debug
```bash
ng serve --source-map
```

### Ver configuração do Angular
```bash
ng config
```

## 💡 Exemplos de Uso

### Criar componente de vendas
```bash
ng g c vendas/nova-venda --standalone
ng g c vendas/vendas-dia --standalone
ng g c vendas/detalhes-venda --standalone
```

### Criar serviços
```bash
ng g s core/services/vendas
ng g s core/services/produtos
ng g s core/services/estoque
```

### Criar models
```bash
ng g i core/models/venda
ng g i core/models/produto
ng g i core/models/estoque
```

## 🎯 Atalhos Úteis

| Comando | Atalho | Descrição |
|---------|--------|-----------|
| `ng generate` | `ng g` | Gerar arquivo |
| `ng generate component` | `ng g c` | Gerar componente |
| `ng generate service` | `ng g s` | Gerar serviço |
| `ng generate guard` | `ng g g` | Gerar guard |
| `ng generate interface` | `ng g i` | Gerar interface |
| `ng generate module` | `ng g m` | Gerar módulo |

## 📝 Notas Importantes

- Sempre use `--standalone` ao criar novos componentes (padrão do Angular 19)
- A porta padrão é **4201** (configurada para não conflitar com sorveteriaGerencia)
- Antes de fazer commit, execute `ng build` para verificar erros
- Use `npm run build` para build de produção antes do deploy
