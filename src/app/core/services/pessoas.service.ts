import { Injectable } from '@angular/core';
import { db } from '../config/firebase.config';
import {
  collection, query, orderBy, onSnapshot, updateDoc, doc
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Pessoa } from '../models/pessoa.model';
import { ItemBase } from '../models/item.model';
import { PerfilCompleto, Funcionalidade } from '../models/perfil.model';

@Injectable({ providedIn: 'root' })
export class PessoasService {

  getPessoas(): Observable<Pessoa[]> {
    return this.getColecao<Pessoa>('pessoas');
  }

  getBarracas(): Observable<ItemBase[]> {
    return this.getColecao<ItemBase>('barracas');
  }

  getPerfis(): Observable<PerfilCompleto[]> {
    return this.getColecao<PerfilCompleto>('perfis');
  }

  async updateAtribuicao(id: string, dados: { idBarraca: string; idPerfil: string; email: string }): Promise<void> {
    await updateDoc(doc(db, 'pessoas', id), dados);
  }

  async updatePermissoes(perfilId: string, permissoes: Funcionalidade[]): Promise<void> {
    await updateDoc(doc(db, 'perfis', perfilId), { permissoes });
  }

  private getColecao<T extends { id: string }>(nome: string): Observable<T[]> {
    return new Observable(subscriber => {
      const q = query(collection(db, nome), orderBy('nome'));
      const unsubscribe = onSnapshot(
        q,
        snap => subscriber.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as T))),
        err => subscriber.error(err)
      );
      return unsubscribe;
    });
  }
}
