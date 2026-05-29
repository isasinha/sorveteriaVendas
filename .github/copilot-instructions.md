# Angular Development Guidelines - SorveteriaVendas

## 🎯 Princípio Fundamental: SIMPLICIDADE

**SEMPRE priorize código simples, limpo e legível:**
- ✅ Código simples > Código "inteligente"
- ✅ Clareza > Concisão excessiva
- ✅ Explícito > Implícito
- ✅ Após criar novas linhas, SEMPRE revisite o código
- ✅ Pergunte: "Posso tornar isso mais simples?"
- ✅ Pergunte: "Outra pessoa entenderá isso facilmente?"
- ✅ Remova complexidade desnecessária
- ✅ Evite abstrações prematuras
- ✅ Prefira duplicação a abstração errada
- ✅ Comente apenas o "porquê", não o "como"

## Arquitetura
- Use Standalone Components (Angular 17+)
- Evite NgModules quando possível
- Organize por features, não por tipo de arquivo
- Mantenha componentes pequenos e focados em uma única responsabilidade

## State Management
- Prefira Signals para estado reativo
- Use RxJS apenas para operações assíncronas complexas
- Evite subscribe() desnecessários, use async pipe
- Implemente unsubscribe adequado quando necessário

## Performance
- Use OnPush change detection
- Implemente lazy loading para rotas
- Use trackBy em *ngFor
- Otimize imagens e assets
- Minimize chamadas ao Firestore

## Estilo de Código
- Use TypeScript strict mode
- Siga naming conventions: 
  - Componentes: kebab-case.component.ts
  - Serviços: kebab-case.service.ts
  - Guards: kebab-case.guard.ts
- Sempre tipifique retornos de funções
- Use interfaces para modelos de dados
- **Nomes de variáveis devem ser auto-explicativos**
- **Funções devem fazer UMA coisa apenas**
- **Se uma função tem mais de 20 linhas, considere quebrar em funções menores**
- **Evite aninhamento profundo (máximo 3 níveis)**

## Firebase & Firestore
- Use AngularFire quando possível
- Implemente tratamento de erros robusto
- Use batch operations para múltiplas escritas
- Implemente paginação em listas grandes
- Valide dados antes de enviar ao Firestore
- Use Security Rules apropriadas

## Componentes
- Prefira templates inline para componentes pequenos
- Use ViewChild/ViewChildren com cuidado
- Implemente lifecycle hooks adequadamente
- Use @Input() e @Output() para comunicação entre componentes
- **Mantenha a lógica no componente simples, mova complexidade para serviços**
- **Template deve ser legível, evite lógica complexa no HTML**

## Material Design
- Use Angular Material de forma consistente
- Mantenha o tema definido (azure-blue)
- Customize cores seguindo as variáveis CSS definidas
- Use Material Icons

## Testes
- Escreva testes unitários para serviços críticos
- Teste componentes com funcionalidades complexas
- Mock dependências externas (Firebase, etc)

## Segurança
- Nunca exponha credenciais no código
- Use AuthGuard para proteger rotas
- Valide dados no frontend E backend
- Implemente rate limiting quando necessário
- Use HTTPS em produção

## 🔄 Processo de Revisão

**Após escrever qualquer código:**
1. Leia o código em voz alta mentalmente
2. Se parece confuso, simplifique
3. Remova código comentado/não utilizado
4. Extraia números mágicos para constantes nomeadas
5. Renomeie variáveis ambíguas (a, b, temp, data) para nomes descritivos
6. Quebre funções longas em funções menores e nomeadas
7. Remova duplicação óbvia
8. Verifique se alguém sem contexto entenderia o código
