import { Injectable } from '@angular/core';
import { db } from '../config/firebase.config';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, deleteField,
  UpdateData
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { ItemBase, ColecaoItens } from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class ItensService {

  getItens(colecao: ColecaoItens): Observable<ItemBase[]> {
    return new Observable(subscriber => {
      const q = query(collection(db, colecao), orderBy('nome'));
      const unsubscribe = onSnapshot(
        q,
        snapshot => subscriber.next(
          snapshot.docs.map(d => {
            const data = d.data();
            const item: import('../models/item.model').ItemBase = { id: d.id, nome: data['nome'] as string };
            if (data['preco'] != null) item.preco = data['preco'] as number;
            if (data['qtdSabores'] != null) item.qtdSabores = data['qtdSabores'] as number;
            if (data['saboresPermitidos'] != null) item.saboresPermitidos = data['saboresPermitidos'] as string[];
            if (data['barracasPermitidas'] != null) item.barracasPermitidas = data['barracasPermitidas'] as string[];
            return item;
          })
        ),
        err => subscriber.error(err)
      );
      return unsubscribe;
    });
  }

  async addItem(colecao: ColecaoItens, nome: string, extra?: Record<string, unknown>): Promise<void> {
    await addDoc(collection(db, colecao), { nome: nome.trim(), ...extra });
  }

  async updateItem(colecao: ColecaoItens, id: string, nome: string, extra?: Record<string, unknown>): Promise<void> {
    const data: Record<string, unknown> = { nome: nome.trim() };
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        data[k] = v === undefined ? deleteField() : v;
      }
    }
    await updateDoc(doc(db, colecao, id), data as UpdateData<object>);
  }

  async deleteItem(colecao: ColecaoItens, id: string): Promise<void> {
    await deleteDoc(doc(db, colecao, id));
  }
}
