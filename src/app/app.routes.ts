import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { MenuComponent } from './menu/menu.component';
import { authGuard } from './core/guards/auth.guard';
import { NovoPedidoComponent } from './pedidos/novo-pedido/novo-pedido.component';
import { ConsultarPedidosComponent } from './pedidos/consultar-pedidos/consultar-pedidos.component';
import { IncluirDoacaoComponent } from './doacoes/incluir-doacao/incluir-doacao.component';
import { AlterarItensComponent } from './itens/alterar-itens/alterar-itens.component';
import { ControlePerfilComponent } from './perfil/controle-perfil/controle-perfil.component';
import { RelatoriosComponent } from './relatorios/relatorios.component';
import { ImpressaoComponent } from './pedidos/impressao/impressao.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent, canActivate: [authGuard] },
  { path: 'pedidos/novo', component: NovoPedidoComponent, canActivate: [authGuard] },
  { path: 'pedidos/impressao', component: ImpressaoComponent, canActivate: [authGuard] },
  { path: 'pedidos/consultar', component: ConsultarPedidosComponent, canActivate: [authGuard] },
  { path: 'doacoes/incluir', component: IncluirDoacaoComponent, canActivate: [authGuard] },
  { path: 'itens/alterar', component: AlterarItensComponent, canActivate: [authGuard] },
  { path: 'perfil/controle', component: ControlePerfilComponent, canActivate: [authGuard] },
  { path: 'relatorios', component: RelatoriosComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
