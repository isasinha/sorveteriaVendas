import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../core/services/auth.service';

interface MenuItem {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  userName: string = '';
  
  menuItems: MenuItem[] = [
    {
      title: 'Novo Pedido',
      description: 'Registrar um novo pedido',
      icon: 'add_shopping_cart',
      route: '/pedidos/novo',
      color: '#e91e63'
    },
    {
      title: 'Consultar Pedidos',
      description: 'Visualizar e gerenciar pedidos',
      icon: 'list_alt',
      route: '/pedidos/consultar',
      color: '#ff4081'
    },
    {
      title: 'Incluir Doação',
      description: 'Registrar doações avulsas recebidas',
      icon: 'volunteer_activism',
      route: '/doacoes/incluir',
      color: '#673ab7'
    },
    {
      title: 'Alterar Itens Disponíveis',
      description: 'Gerenciar disponibilidade de produtos e outros itens',
      icon: 'inventory_2',
      route: '/itens/alterar',
      color: '#009688'
    },
    {
      title: 'Controle de Perfil',
      description: 'Gerenciar perfis de voluntários',
      icon: 'account_circle',
      route: '/perfil/controle',
      color: '#ff9800'
    },
    {
      title: 'Relatórios',
      description: 'Relatórios e estatísticas',
      icon: 'assessment',
      route: '/relatorios',
      color: '#2196f3'
    }
  ];

  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.userName = user?.email?.split('@')[0] || 'Usuário';
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  async onLogout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}
