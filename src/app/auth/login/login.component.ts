import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  hidePassword = true;
  modoEsqueciSenha = false;
  enviandoReset = false;
  mensagemReset = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  async onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.email, this.password);
      const perfil = await this.authService.aguardarPerfil();

      if (!perfil) {
        await this.authService.logout();
        this.errorMessage = 'Usuário sem perfil atribuído. Contacte o administrador.';
        return;
      }

      if (perfil.escopo !== 'todas' && !perfil.idBarraca) {
        await this.authService.logout();
        this.errorMessage = 'Usuário sem barraca atribuída. Contacte o administrador.';
        return;
      }

      this.router.navigate(['/menu']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Erro ao fazer login';
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  entrarModoReset(): void {
    this.modoEsqueciSenha = true;
    this.errorMessage = '';
    this.mensagemReset = '';
  }

  voltarParaLogin(): void {
    this.modoEsqueciSenha = false;
    this.mensagemReset = '';
    this.errorMessage = '';
  }

  async enviarReset(): Promise<void> {
    if (!this.email) {
      this.errorMessage = 'Informe o email para redefinir a senha.';
      return;
    }
    this.enviandoReset = true;
    this.errorMessage = '';
    this.mensagemReset = '';
    try {
      await this.authService.resetPassword(this.email);
      this.mensagemReset = 'Email de redefinição enviado. Verifique sua caixa de entrada.';
    } catch {
      this.errorMessage = 'Não foi possível enviar o email. Verifique se o endereço está correto.';
    } finally {
      this.enviandoReset = false;
    }
  }
}
