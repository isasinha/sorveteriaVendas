## 📚 Documentação Oficial

### Git
- Official Docs: https://git-scm.com/doc
- Pro Git Book: https://git-scm.com/book/en/v2
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf

### GitHub
- Docs: https://docs.github.com
- GitHub Actions: https://docs.github.com/en/actions
- GitHub CLI: https://cli.github.com/manual/
- REST API: https://docs.github.com/en/rest
- GraphQL API: https://docs.github.com/en/graphql

---

## 🌳 Git Best Practices - SorveteriaVendas

### Branch Naming Convention

```bash
# Feature branches
git checkout -b feature/nova-venda
git checkout -b feature/relatorio-vendas

# Bug fixes
git checkout -b fix/calculo-total
git checkout -b fix/listagem-produtos

# Hotfixes (production)
git checkout -b hotfix/auth-error

# Refactoring
git checkout -b refactor/vendas-service

# Documentation
git checkout -b docs/api-endpoints

# Chores (dependencies, config)
git checkout -b chore/update-angular
```

### Commit Message Convention (Conventional Commits)

**Format**: `<type>(<scope>): <subject>`

```bash
# Features
git commit -m "feat(vendas): implementar formulário de nova venda"
git commit -m "feat(menu): adicionar card de relatórios"

# Bug Fixes
git commit -m "fix(login): corrigir validação de email"
git commit -m "fix(vendas): corrigir cálculo de total"

# Documentation
git commit -m "docs(readme): adicionar instruções de instalação"
git commit -m "docs(api): documentar endpoints do Firebase"

# Style (formatting, missing semi colons, etc)
git commit -m "style(components): formatar código com prettier"

# Refactoring
git commit -m "refactor(auth): simplificar lógica de autenticação"

# Performance
git commit -m "perf(vendas): otimizar query do Firestore"

# Tests
git commit -m "test(vendas): adicionar testes unitários"

# Chores
git commit -m "chore(deps): atualizar Angular Material"
git commit -m "chore(config): atualizar configuração do Firebase"

# CI/CD
git commit -m "ci(firebase): adicionar workflow de deploy"

# Breaking Changes
git commit -m "feat(api)!: alterar estrutura de vendas

BREAKING CHANGE: Estrutura de vendas agora usa novo formato"
```

### Commit Message Template

```bash
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# Types:
# feat: Nova funcionalidade
# fix: Correção de bug
# docs: Documentação
# style: Formatação
# refactor: Refatoração
# perf: Performance
# test: Testes
# chore: Manutenção
# ci: CI/CD
```

---

## 📝 Workflow Recomendado

### 1. Criar Branch
```bash
git checkout -b feature/nova-funcionalidade
```

### 2. Fazer Alterações
```bash
# Trabalhe no código
# Teste localmente
```

### 3. Commit
```bash
git add .
git commit -m "feat(vendas): implementar nova funcionalidade"
```

### 4. Push
```bash
git push origin feature/nova-funcionalidade
```

### 5. Pull Request
- Crie PR no GitHub
- Aguarde revisão
- Faça ajustes se necessário
- Merge após aprovação

---

## 🔄 Sincronização com Main

```bash
# Atualizar sua branch local
git checkout main
git pull origin main

# Voltar para sua branch
git checkout feature/sua-branch

# Fazer rebase ou merge
git rebase main
# ou
git merge main
```

---

## 🚨 Comandos de Emergência

### Desfazer último commit (mantém alterações)
```bash
git reset --soft HEAD~1
```

### Desfazer último commit (descarta alterações)
```bash
git reset --hard HEAD~1
```

### Descartar alterações locais
```bash
git checkout -- arquivo.ts
# ou todos os arquivos
git checkout -- .
```

### Limpar arquivos não rastreados
```bash
git clean -fd
```

---

## 📊 Visualização

### Ver histórico
```bash
git log --oneline --graph --all
```

### Ver diferenças
```bash
git diff
git diff --staged
```

### Ver status
```bash
git status
```

---

## 🏷️ Tags e Releases

### Criar tag
```bash
git tag -a v1.0.0 -m "Versão 1.0.0 - Sistema de Vendas"
```

### Push de tag
```bash
git push origin v1.0.0
```

### Listar tags
```bash
git tag -l
```

---

## 🔗 Integração com SorveteriaGerencia

### Repositório Compartilhado
- Mantenha consistência nos padrões de commit
- Use prefixos claros para diferenciar módulos
- Exemplos:
  - `feat(vendas): ...` para SorveteriaVendas
  - `feat(gerencia): ...` para SorveteriaGerencia

### Branches Principais
```
main (produção)
├── develop (desenvolvimento)
├── feature/* (novas funcionalidades)
├── fix/* (correções)
└── hotfix/* (correções urgentes)
```
