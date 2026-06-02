import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../core/services/auth.service';
import { Funcionalidade } from '../core/models/perfil.model';

interface MenuItem {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  chave: Funcionalidade;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly menuItems: MenuItem[] = [
    { title: 'Novo Pedido',              description: 'Registrar um novo pedido',                          icon: 'add_shopping_cart', route: '/pedidos/novo',     color: '#e91e63', chave: 'pedidos.novo'      },
    { title: 'Consultar Pedidos',        description: 'Visualizar e gerenciar pedidos',                    icon: 'list_alt',          route: '/pedidos/consultar',color: '#ff4081', chave: 'pedidos.consultar' },
    { title: 'Incluir Doação',           description: 'Registrar doações avulsas recebidas',               icon: 'volunteer_activism', route: '/doacoes/incluir',  color: '#673ab7', chave: 'doacoes.incluir'   },
    { title: 'Configurações',              description: 'Gerenciar disponibilidade de produtos e outros itens', icon: 'inventory_2',   route: '/itens/alterar',    color: '#009688', chave: 'itens.alterar'     },
    { title: 'Controle de Perfil',       description: 'Gerenciar perfis de voluntários',                   icon: 'account_circle',    route: '/perfil/controle',  color: '#ff9800', chave: 'perfil.controle'   },
    { title: 'Relatórios',               description: 'Relatórios e estatísticas',                         icon: 'assessment',        route: '/relatorios',       color: '#2196f3', chave: 'relatorios'        },
  ];

  get itensFiltrados(): MenuItem[] {
    return this.menuItems.filter(item => this.authService.temPermissao(item.chave));
  }

  get userName(): string {
    return this.authService.getCurrentUser()?.email?.split('@')[0] ?? 'Usuário';
  }

  get perfilNome(): string {
    return this.authService.getPerfil()?.nome ?? '';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
