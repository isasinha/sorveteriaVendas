import { Injectable } from '@angular/core';
import { db } from '../config/firebase.config';
import {
  collection, doc, addDoc, getDoc, query, orderBy,
  onSnapshot, serverTimestamp, runTransaction, Timestamp
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { NovoPedido, NovaDoacaoAvulsa, Pedido, ItemPedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidosService {

  getProximoNumero(): Promise<number> {
    return getDoc(doc(db, 'config', 'contadores')).then(snap =>
      snap.exists() ? (snap.data()['numeroPedido'] as number) + 1 : 1
    );
  }

  async addPedido(pedido: NovoPedido): Promise<{ id: string; numero: number }> {
    const contadorRef = doc(db, 'config', 'contadores');
    let pedidoId!: string;
    let numero!: number;
    await runTransaction(db, async tx => {
      const snap = await tx.get(contadorRef);
      numero = snap.exists() ? (snap.data()['numeroPedido'] as number) + 1 : 1;
      tx.set(contadorRef, { numeroPedido: numero }, { merge: true });
      const pedidoRef = doc(collection(db, 'pedidos'));
      tx.set(pedidoRef, { ...pedido, tipo: 'pedido', numero, data: serverTimestamp(), entregue: false, pago: false });
      pedidoId = pedidoRef.id;
    });
    return { id: pedidoId, numero };
  }

  async addDoacaoAvulsa(doacao: NovaDoacaoAvulsa): Promise<void> {
    await addDoc(collection(db, 'pedidos'), {
      ...doacao,
      tipo: 'doacao',
      data: serverTimestamp(),
      entregue: true,
      pago: true,
    });
  }

  async marcarEntregue(id: string): Promise<'ok' | 'ja-entregue'> {
    const ref = doc(db, 'pedidos', id);
    let resultado!: 'ok' | 'ja-entregue';
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (snap.data()?.['entregue']) { resultado = 'ja-entregue'; return; }
      tx.update(ref, { entregue: true });
      resultado = 'ok';
    });
    return resultado;
  }

  async marcarPago(id: string, doacao?: number): Promise<'ok' | 'ja-pago'> {
    const ref = doc(db, 'pedidos', id);
    let resultado!: 'ok' | 'ja-pago';
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (snap.data()?.['pago']) { resultado = 'ja-pago'; return; }
      const update: Record<string, unknown> = { pago: true };
      if (doacao && doacao > 0) update['doacao'] = doacao;
      tx.update(ref, update);
      resultado = 'ok';
    });
    return resultado;
  }

  getPedidos(): Observable<Pedido[]> {
    return new Observable(subscriber => {
      const q = query(collection(db, 'pedidos'), orderBy('data', 'asc'));
      const unsubscribe = onSnapshot(q, snapshot => {
        subscriber.next(
          snapshot.docs
            .filter(d => (d.data()['tipo'] ?? 'pedido') !== 'doacao')
            .map(d => {
              const data = d.data();
              const ts = data['data'] as Timestamp | null;
              return {
                id: d.id,
                numero: data['numero'] as number,
                nomeCliente: data['nomeCliente'] as string,
                itens: (data['itens'] ?? []) as ItemPedido[],
                total: (data['total'] ?? 0) as number,
                doacao: data['doacao'] as number | undefined,
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
