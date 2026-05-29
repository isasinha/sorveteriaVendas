# SorveteriaVendas 🍦

Sistema de vendas da Sorveteria Perseverança desenvolvido em Angular 19 com Firebase.

## 📋 Funcionalidades

- ✅ Sistema de login com autenticação Firebase
- ✅ Menu principal com 5 cards de navegação:
  - 🛒 Nova Venda
  - 📅 Vendas do Dia
  - 📦 Estoque
  - 🍨 Produtos
  - 📊 Relatórios
- ✅ Integração com Firebase (mesmo banco da SorveteriaGerencia)
- ✅ Interface responsiva com Angular Material
- ✅ Proteção de rotas com Auth Guard

## 🚀 Instalação

1. Navegue até a pasta do projeto:
```bash
cd sorveteriaVendas
```

2. Instale as dependências:
```bash
npm install
```

## 💻 Desenvolvimento

Execute o servidor de desenvolvimento:
```bash
npm start
```

O aplicativo será aberto em `http://localhost:4201/`

## 🔨 Build

Execute o build de produção:
```bash
npm run build
```

Os arquivos serão gerados no diretório `dist/sorveteriaVendas/`.

## 📦 Deploy

Para fazer deploy no Firebase Hosting:
```bash
npm run build
firebase deploy
```

## 🔐 Configuração Firebase

O projeto utiliza o mesmo banco de dados Firebase da SorveteriaGerencia. As credenciais estão configuradas em:
- `src/app/core/config/firebase.config.ts`

## 🎨 Estrutura do Projeto

```
src/
├── app/
│   ├── auth/
│   │   └── login/              # Componente de login
│   ├── core/
│   │   ├── config/             # Configurações (Firebase)
│   │   ├── guards/             # Guards de autenticação
│   │   └── services/           # Serviços (Auth, etc)
│   ├── menu/                   # Menu principal com cards
│   ├── app.component.*         # Componente raiz
│   ├── app.config.ts           # Configuração da aplicação
│   └── app.routes.ts           # Rotas da aplicação
├── styles.scss                 # Estilos globais
├── _variables.scss             # Variáveis SCSS
└── _mixins.scss                # Mixins SCSS
```

## 🎯 Próximos Passos

As funcionalidades dos cards podem ser implementadas criando novos componentes e rotas para:
- `/vendas/nova` - Tela de nova venda
- `/vendas/dia` - Relatório de vendas do dia
- `/estoque` - Gestão de estoque
- `/produtos` - Catálogo de produtos
- `/relatorios` - Relatórios e estatísticas

## 📱 Tecnologias

- Angular 19
- Angular Material
- Firebase (Authentication & Firestore)
- TypeScript
- SCSS
- RxJS
