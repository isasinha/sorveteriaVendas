# 📝 Instruções de Instalação e Execução

## Pré-requisitos

Certifique-se de ter instalado:
- Node.js (versão 18 ou superior)
- npm (geralmente vem com Node.js)

## Passo a Passo

### 1️⃣ Instalar Dependências

Abra o terminal na pasta `sorveteriaVendas` e execute:

```bash
npm install
```

Este comando irá instalar todas as dependências necessárias incluindo:
- Angular 19
- Angular Material
- Firebase
- E outras bibliotecas

### 2️⃣ Iniciar o Servidor de Desenvolvimento

Após a instalação, execute:

```bash
npm start
```

O aplicativo será iniciado em: **http://localhost:4201/**

> **Nota:** A porta 4201 foi configurada para não conflitar com a sorveteriaGerencia que usa a porta 4200.

### 3️⃣ Fazer Login

Use as mesmas credenciais do sistema de gerência, pois ambos compartilham o mesmo banco Firebase.

## ⚠️ Possíveis Problemas

### Erro de porta ocupada
Se a porta 4201 estiver em uso, você pode alterar no `package.json`:
```json
"start": "ng serve --port 4202"
```

### Erros de módulos não encontrados
Execute:
```bash
npm install --legacy-peer-deps
```

### Erro de TypeScript
Certifique-se de que o Node.js está atualizado:
```bash
node --version
```

## 🔧 Comandos Úteis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm test` - Executa testes
- `npm run watch` - Build em modo watch

## 📞 Suporte

Se encontrar problemas durante a instalação ou execução, verifique:
1. Se todas as dependências foram instaladas corretamente
2. Se a versão do Node.js é compatível
3. Se não há conflitos de porta
4. Se as credenciais do Firebase estão corretas
