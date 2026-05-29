import { Injectable } from '@angular/core';
import { db } from '../config/firebase.config';
import {
  collection, addDoc, doc, updateDoc, query, orderBy, limit,
  getDocs, onSnapshot, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { NovoPedido, Pedido, ItemPedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidosService {

  getProximoNumero(): Promise<number> {
    const q = query(collection(db, 'pedidos'), orderBy('numero', 'desc'), limit(1));
    return getDocs(q).then(snap => {
      if (snap.empty) return 1;
      return (snap.docs[0].data()['numero'] as number) + 1;
    });
  }

  addPedido(pedido: NovoPedido): Promise<string> {
    return addDoc(collection(db, 'pedidos'), { ...pedido, data: serverTimestamp(), entregue: false, pago: false })
      .then(ref => ref.id);
  }

  marcarEntregue(id: string): Promise<void> {
    return updateDoc(doc(db, 'pedidos', id), { entregue: true });
  }

  marcarPago(id: string): Promise<void> {
    return updateDoc(doc(db, 'pedidos', id), { pago: true });
  }

  getPedidos(): Observable<Pedido[]> {
    return new Observable(subscriber => {
      const q = query(collection(db, 'pedidos'), orderBy('data', 'asc'));
      const unsubscribe = onSnapshot(q, snapshot => {
        subscriber.next(
          snapshot.docs.map(d => {
            const data = d.data();
            const ts = data['data'] as Timestamp | null;
            return {
              id: d.id,
              numero: data['numero'] as number,
              nomeCliente: data['nomeCliente'] as string,
              itens: (data['itens'] ?? []) as ItemPedido[],
              data: ts?.toDate() ?? new Date(),
              entregue: (data['entregue'] as boolean) ?? false,
              pago: (data['pago'] as boolean) ?? false,
            };
          })
        );
      }, err => subscriber.error(err));
      return unsubscribe;
    });
  }
}
