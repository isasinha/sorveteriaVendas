## 📚 Documentação de Referência Online - Firebase

### Fontes Oficiais Obrigatórias

Sempre consulte estas fontes antes de responder sobre Firebase:

1. **Firebase Official Documentation**
   - Main Site: https://firebase.google.com/docs
   - Web (JavaScript): https://firebase.google.com/docs/web/setup
   - Angular: https://firebase.google.com/docs/web/setup#angular
   - Get Started: https://firebase.google.com/docs/guides

2. **Firebase Products - Web SDK**
   - Authentication: https://firebase.google.com/docs/auth/web/start
   - Firestore: https://firebase.google.com/docs/firestore/quickstart
   - Realtime Database: https://firebase.google.com/docs/database/web/start
   - Storage: https://firebase.google.com/docs/storage/web/start
   - Cloud Functions: https://firebase.google.com/docs/functions
   - Hosting: https://firebase.google.com/docs/hosting
   - Cloud Messaging (FCM): https://firebase.google.com/docs/cloud-messaging/js/client
   - Analytics: https://firebase.google.com/docs/analytics/get-started?platform=web

3. **AngularFire (Official Angular Library)**
   - Main Site: https://github.com/angular/angularfire
   - Documentation: https://github.com/angular/angularfire/tree/master/docs
   - Installation: https://github.com/angular/angularfire/blob/master/docs/install-and-setup.md
   - Migration Guide: https://github.com/angular/angularfire/blob/master/docs/version-7-upgrade.md

4. **Firebase Admin SDK (Backend)**
   - Overview: https://firebase.google.com/docs/admin/setup
   - Node.js: https://firebase.google.com/docs/admin/setup#node.js

---

## 🔥 Firebase no SorveteriaVendas

### Configuração Atual

O projeto usa o **mesmo banco Firebase** que o SorveteriaGerencia:
- Project ID: `sorveteria-perseveranca`
- Firestore Database: compartilhado
- Authentication: compartilhado

### Coleções Principais

```typescript
// Estrutura no Firestore

// Coleção: vendas
{
  id: string;
  data: Timestamp;
  produtos: Array<{
    produtoId: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
  }>;
  valorTotal: number;
  formaPagamento: string;
  vendedorId: string;
  vendedorNome: string;
  status: 'concluida' | 'cancelada';
}

// Coleção: produtos
{
  id: string;
  nome: string;
  tipo: string;
  sabores: string[];
  precos: {
    pequeno?: number;
    medio?: number;
    grande?: number;
  };
  estoque: number;
  ativo: boolean;
}

// Coleção: estoque_movimentacoes
{
  id: string;
  data: Timestamp;
  produtoId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  usuarioId: string;
}
```

---

## 🛠️ Como Usar Firebase no Projeto

### Importar Firebase
```typescript
import { db } from '../core/config/firebase.config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
```

### Criar Serviço
```typescript
import { Injectable } from '@angular/core';
import { db } from '../config/firebase.config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class VendasService {
  async criarVenda(venda: any) {
    const docRef = await addDoc(collection(db, 'vendas'), venda);
    return docRef.id;
  }
  
  async listarVendas() {
    const querySnapshot = await getDocs(collection(db, 'vendas'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}
```

---

## ✅ Best Practices Firebase

### 1. Tratamento de Erros
```typescript
try {
  await addDoc(collection(db, 'vendas'), venda);
} catch (error: any) {
  console.error('Erro ao criar venda:', error);
  throw new Error('Não foi possível criar a venda');
}
```

### 2. Queries Otimizadas
```typescript
// Use where para filtrar
const q = query(
  collection(db, 'vendas'),
  where('data', '>=', startDate),
  where('data', '<=', endDate)
);
```

### 3. Batch Operations
```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);
batch.set(doc(db, 'vendas', 'id1'), data1);
batch.set(doc(db, 'vendas', 'id2'), data2);
await batch.commit();
```

### 4. Real-time Updates
```typescript
import { onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(
  collection(db, 'vendas'),
  (snapshot) => {
    const vendas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Vendas atualizadas:', vendas);
  }
);

// Limpar listener
unsubscribe();
```

### 5. Paginação
```typescript
import { query, orderBy, limit, startAfter } from 'firebase/firestore';

const first = query(
  collection(db, 'vendas'),
  orderBy('data'),
  limit(25)
);

// Próxima página
const next = query(
  collection(db, 'vendas'),
  orderBy('data'),
  startAfter(lastDoc),
  limit(25)
);
```

---

## 🔐 Security Rules

### Configuração Recomendada
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Vendas - apenas usuários autenticados
    match /vendas/{vendaId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Produtos - leitura pública, escrita autenticada
    match /produtos/{produtoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Estoque - apenas autenticados
    match /estoque_movimentacoes/{movId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🚨 Erros Comuns e Soluções

### Erro: Permission Denied
**Causa**: Security Rules não permitem a operação
**Solução**: Verifique as regras no Firebase Console

### Erro: Network Error
**Causa**: Sem conexão com internet
**Solução**: Implemente modo offline com cache

### Erro: Document Already Exists
**Causa**: Tentativa de criar documento com ID existente
**Solução**: Use `setDoc` com merge ou deixe o Firebase gerar o ID

---

## 📖 Recursos Adicionais

- **Firebase Console**: https://console.firebase.google.com
- **Emulator Suite**: Para testes locais
- **Firebase Extensions**: Funcionalidades prontas
- **Community**: Stack Overflow, Reddit r/Firebase

---

## 🔗 Integração com SorveteriaGerencia

### Dados Compartilhados
- ✅ Mesmas coleções
- ✅ Mesma autenticação
- ✅ Sincronização automática
- ✅ Dados em tempo real

### Separação de Responsabilidades
- **SorveteriaGerencia**: Gestão, equipes, pessoas, confirmações
- **SorveteriaVendas**: Vendas, produtos, estoque, relatórios
