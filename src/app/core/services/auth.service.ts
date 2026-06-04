import { Injectable } from '@angular/core';
import { auth, db } from '../config/firebase.config';
import { signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { BehaviorSubject, Observable, filter, firstValueFrom } from 'rxjs';
import { PerfilCompleto, Funcionalidade, EscopoBarraca, FiltroConsultar, isTI, FUNCIONALIDADES } from '../models/perfil.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // undefined = aguardando auth state, null = sem perfil, PerfilCompleto = carregado
  private perfilSubject = new BehaviorSubject<PerfilCompleto | null | undefined>(undefined);
  public perfil$: Observable<PerfilCompleto | null | undefined> = this.perfilSubject.asObservable();

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUserSubject.next(user);
      if (user) {
        await this.carregarPerfil(user.email ?? '');
      } else {
        this.perfilSubject.next(undefined);
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged dispara em seguida e chama carregarPerfil automaticamente
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.perfilSubject.next(undefined);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getPerfil(): PerfilCompleto | null | undefined {
    return this.perfilSubject.value;
  }

  temPermissao(funcionalidade: Funcionalidade): boolean {
    const perfil = this.perfilSubject.value;
    if (!perfil) return false;
    if (isTI(perfil.nome)) return true;
    return (perfil.permissoes ?? []).includes(funcionalidade);
  }

  aguardarPerfil(): Promise<PerfilCompleto | null> {
    return firstValueFrom(
      this.perfil$.pipe(filter((p): p is PerfilCompleto | null => p !== undefined))
    );
  }

  private async carregarPerfil(email: string): Promise<void> {
    try {
      const snap = await getDocs(query(collection(db, 'pessoas'), where('email', '==', email)));
      if (snap.empty) { this.perfilSubject.next(null); return; }

      const pessoa = snap.docs[0].data();
      const idBarraca = pessoa['idBarraca'] as string | undefined;
      if (!pessoa['idPerfil']) { this.perfilSubject.next(null); return; }

      const perfilSnap = await getDoc(doc(db, 'perfis', pessoa['idPerfil']));
      if (!perfilSnap.exists()) { this.perfilSubject.next(null); return; }

      const dados = perfilSnap.data();
      const nome = dados['nome'] as string;
      const escopo = (dados['escopo'] ?? 'propria') as EscopoBarraca;
      const permissoes = isTI(nome)
        ? FUNCIONALIDADES.map(f => f.chave)
        : (dados['permissoes'] ?? []) as Funcionalidade[];
      const filtrosVisiveis = isTI(nome)
        ? undefined
        : (dados['filtrosVisiveis'] as FiltroConsultar[] | undefined) ?? undefined;

      this.perfilSubject.next({ id: perfilSnap.id, nome, permissoes, escopo, filtrosVisiveis, idBarraca });
    } catch {
      this.perfilSubject.next(null);
    }
  }

  private handleAuthError(error: any): Error {
    const mensagens: Record<string, string> = {
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuário desabilitado',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-credential': 'Credenciais inválidas',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    };
    return new Error(mensagens[error.code] ?? 'Erro ao fazer login');
  }
}
