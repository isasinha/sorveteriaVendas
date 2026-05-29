import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';

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
    canActivate: [authGuard],
  },
  {
    path: 'pedidos/impressao',
    loadComponent: () => import('./pedidos/impressao/impressao.component').then(m => m.ImpressaoComponent),
    canActivate: [authGuard],
  },
  {
    path: 'pedidos/consultar',
    loadComponent: () => import('./pedidos/consultar-pedidos/consultar-pedidos.component').then(m => m.ConsultarPedidosComponent),
    canActivate: [authGuard],
  },
  {
    path: 'doacoes/incluir',
    loadComponent: () => import('./doacoes/incluir-doacao/incluir-doacao.component').then(m => m.IncluirDoacaoComponent),
    canActivate: [authGuard],
  },
  {
    path: 'itens/alterar',
    loadComponent: () => import('./itens/alterar-itens/alterar-itens.component').then(m => m.AlterarItensComponent),
    canActivate: [authGuard],
  },
  {
    path: 'perfil/controle',
    loadComponent: () => import('./perfil/controle-perfil/controle-perfil.component').then(m => m.ControlePerfilComponent),
    canActivate: [authGuard],
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./relatorios/relatorios.component').then(m => m.RelatoriosComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/login' },
];
