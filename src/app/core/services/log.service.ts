import { Injectable } from '@angular/core';
import { db, auth } from '../config/firebase.config';
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, where, Timestamp
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { LogEvento } from '../models/log.model';

@Injectable({ providedIn: 'root' })
export class LogService {

  /** Fire-and-forget: não bloqueia a operação principal em caso de falha. */
  registrar(acao: string, detalhe: string): void {
    const quem = auth.currentUser?.email ?? 'desconhecido';
    addDoc(collection(db, 'logs'), {
      quando: serverTimestamp(),
      quem,
      acao,
      detalhe,
    }).catch(() => {});
  }

  getLogs(inicio: Date, fim: Date): Observable<LogEvento[]> {
    const fimAjustado = new Date(fim);
    fimAjustado.setSeconds(59, 999);

    return new Observable(subscriber => {
      const q = query(
        collection(db, 'logs'),
        where('quando', '>=', Timestamp.fromDate(inicio)),
        where('quando', '<=', Timestamp.fromDate(fimAjustado)),
        orderBy('quando', 'desc'),
        limit(500)
      );
      const unsub = onSnapshot(q, snap => {
        subscriber.next(snap.docs.map(d => {
          const data = d.data();
          const ts = data['quando'] as Timestamp | null;
          return {
            id: d.id,
            quando: ts?.toDate() ?? new Date(),
            quem: data['quem'] as string,
            acao: data['acao'] as string,
            detalhe: data['detalhe'] as string,
          };
        }));
      }, err => subscriber.error(err));
      return unsub;
    });
  }
}
