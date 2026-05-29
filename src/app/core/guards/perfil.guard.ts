import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Funcionalidade, PerfilCompleto } from '../models/perfil.model';

export const perfilGuard = (funcionalidade: Funcionalidade) => () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.perfil$.pipe(
    filter((p): p is PerfilCompleto | null => p !== undefined),
    take(1),
    map(() => {
      if (authService.temPermissao(funcionalidade)) return true;
      router.navigate(['/menu']);
      return false;
    })
  );
};
