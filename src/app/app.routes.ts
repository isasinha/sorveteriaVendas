import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { perfilGuard } from './core/guards/perfil.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'menu',
    loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent),
    canActivate: [authGuard],
  },
  {
    path: 'pedidos/novo',
    loadComponent: () => import('./pedidos/novo-pedido/novo-pedido.component').then(m => m.NovoPedidoComponent),
    canActivate: [authGuard, perfilGuard('pedidos.novo')],
  },
  {
    path: 'pedidos/impressao',
    loadComponent: () => import('./pedidos/impressao/impressao.component').then(m => m.ImpressaoComponent),
    canActivate: [authGuard, perfilGuard('pedidos.novo')],
  },
  {
    path: 'pedidos/consultar',
    loadComponent: () => import('./pedidos/consultar-pedidos/consultar-pedidos.component').then(m => m.ConsultarPedidosComponent),
    canActivate: [authGuard, perfilGuard('pedidos.consultar')],
  },
  {
    path: 'doacoes/incluir',
    loadComponent: () => import('./doacoes/incluir-doacao/incluir-doacao.component').then(m => m.IncluirDoacaoComponent),
    canActivate: [authGuard, perfilGuard('doacoes.incluir')],
  },
  {
    path: 'itens/alterar',
    loadComponent: () => import('./itens/alterar-itens/alterar-itens.component').then(m => m.AlterarItensComponent),
    canActivate: [authGuard, perfilGuard('itens.alterar')],
  },
  {
    path: 'perfil/controle',
    loadComponent: () => import('./perfil/controle-perfil/controle-perfil.component').then(m => m.ControlePerfilComponent),
    canActivate: [authGuard, perfilGuard('perfil.controle')],
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./relatorios/relatorios.component').then(m => m.RelatoriosComponent),
    canActivate: [authGuard, perfilGuard('relatorios')],
  },
  {
    path: 'logs',
    loadComponent: () => import('./logs/logs.component').then(m => m.LogsComponent),
    canActivate: [authGuard, perfilGuard('logs')],
  },
  { path: '**', redirectTo: '/login' },
];
