import { Injectable } from '@angular/core';
import { db } from '../config/firebase.config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface NovaVenda {
  valor: number;
  tipo: 'pedido' | 'doacao';
  descricao?: string;
}

@Injectable({ providedIn: 'root' })
export class VendasService {
  async addVenda(venda: NovaVenda): Promise<void> {
    await addDoc(collection(db, 'vendas'), {
      ...venda,
      data: serverTimestamp()
    });
  }
}
