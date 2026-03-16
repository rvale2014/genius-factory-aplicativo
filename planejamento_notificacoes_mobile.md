# Plano: Implementação de Notificações Push + Tela Interna

## Contexto
O app tem ícones de sininho em todas as telas mas são inúteis. Precisamos implementar:
1. **Notificações manuais** — admin envia para todos os alunos
2. **Notificações automáticas** — lembrete para alunos inativos (estilo Duolingo, X dias sem resolver questões)
3. **Notificações de conquistas** — quando aluno desbloqueia uma conquista

**Stack:** App Expo/React Native → Backend Next.js 15 (App Router, routes em `app/api/mobile/v1/`) → PostgreSQL (Neon)
**Formato:** Push notifications (celular bloqueado) + tela interna com histórico

---

## Arquitetura Geral

```
App Expo                          Backend Next.js                    Serviços
────────                          ──────────────                    ────────
1. Pede permissão push
2. getExpoPushTokenAsync() →  3. POST /notificacoes/token      → salva no banco

                              4. Admin cria notificação          → salva no banco
                              5. Cron detecta inativos           → salva no banco
                              6. Conquista desbloqueada          → salva no banco

                              7. expo-server-sdk envia push      → Expo Push Service → FCM/APNs

8. Recebe push no device
9. Tap → abre app/tela
10. GET /notificacoes         ← lista notificações do aluno
11. PATCH /notificacoes/:id   ← marca como lida
```

---

## FRONTEND (este repositório)

### Etapa 1: Instalar dependências
```bash
npx expo install expo-notifications expo-device expo-constants
```
**Obs:** `expo-constants` pode já estar instalado. Verificar package.json.

### Etapa 2: Configurar app.config.ts
- Adicionar plugin `expo-notifications` com `defaultChannel` e `color`
- Adicionar `android.googleServicesFile` apontando para `google-services.json`
- **Pré-requisito:** Criar projeto Firebase, baixar `google-services.json`, fazer upload das credenciais FCM via `eas credentials`

**Arquivo:** `app.config.ts`

### Etapa 3: Criar serviço de notificações
**Novo arquivo:** `src/services/notificacoesService.ts`

Funções:
- `registrarTokenPush(expoPushToken: string)` → POST `/api/mobile/v1/notificacoes/token`
- `listarNotificacoes(page, perPage)` → GET `/api/mobile/v1/notificacoes`
- `marcarComoLida(notificacaoId)` → PATCH `/api/mobile/v1/notificacoes/:id`
- `marcarTodasComoLidas()` → PATCH `/api/mobile/v1/notificacoes/lidas`
- `contarNaoLidas()` → GET `/api/mobile/v1/notificacoes/nao-lidas`

### Etapa 4: Criar schema Zod
**Novo arquivo:** `src/schemas/notificacoes.ts`

```typescript
const NotificacaoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  corpo: z.string(),
  tipo: z.enum(['manual', 'inatividade', 'conquista']),
  lida: z.boolean(),
  dados: z.record(z.any()).nullable(), // deep link data
  criadaEm: z.string(),
})
```

### Etapa 5: Criar provider de notificações
**Novo arquivo:** `src/providers/NotificacoesProvider.tsx`

Responsabilidades:
- Pedir permissão de push (Android 13+ precisa de permissão explícita)
- Obter Expo Push Token via `getExpoPushTokenAsync()`
- Enviar token ao backend (a cada abertura do app, pois token pode mudar)
- Configurar `setNotificationHandler` para comportamento em foreground (mostrar banner)
- Listener `addNotificationResponseReceivedListener` para taps → navegar para tela relevante
- Listener `addNotificationReceivedListener` para atualizar badge de não-lidas em foreground

**Integrar em:** `app/_layout.tsx` (dentro do Jotai Provider, após sessão carregada)

### Etapa 6: Criar atom de contagem de não-lidas
**Novo arquivo:** `src/state/notificacoes.ts`

```typescript
export const notificacoesNaoLidasAtom = atom(0)
```

### Etapa 7: Criar tela de notificações
**Novo arquivo:** `app/(app)/notificacoes.tsx`

- Lista de notificações com FlatList + paginação infinita
- Pull-to-refresh
- Cada item: ícone por tipo, título, corpo (truncado), tempo relativo ("há 2 horas")
- Tap marca como lida + navega para destino (se aplicável)
- Botão "Marcar todas como lidas"

### Etapa 8: Conectar o sininho
**Arquivos existentes:**
- `app/(app)/dashboard.tsx` — sininho no header
- `components/AlunoHeaderSummary.tsx` — sininho no header

Mudanças:
- Tap no sininho → `router.push('/notificacoes')`
- Badge (bolinha) mostra contagem de não-lidas do atom
- Esconder bolinha quando `naoLidas === 0`

### Etapa 9: Build nativo necessário
```bash
npx eas-cli build --profile development --platform android
```
`expo-notifications` é módulo nativo → precisa de novo build. Após build, mudanças JS funcionam via hot-reload.

---

## BACKEND (repositório separado — prompt abaixo)

### Tabelas no PostgreSQL (Neon)

**`push_tokens`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| aluno_id | uuid FK | Referência ao aluno |
| token | text UNIQUE | Expo Push Token |
| platform | text | 'android' ou 'ios' |
| created_at | timestamp | |
| updated_at | timestamp | |

**`notificacoes`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| titulo | text | Título da notificação |
| corpo | text | Corpo/mensagem |
| tipo | text | 'manual', 'inatividade', 'conquista' |
| dados | jsonb | Dados para deep linking (ex: { route: '/trilhas/123' }) |
| criada_em | timestamp | |

**`notificacoes_alunos`** (relação N:N — quem recebeu o quê)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| notificacao_id | uuid FK | |
| aluno_id | uuid FK | |
| lida | boolean | Default false |
| lida_em | timestamp | Nullable |
| push_enviado | boolean | Default false |
| created_at | timestamp | |

### Endpoints da API Mobile

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/mobile/v1/notificacoes/token` | Registra/atualiza push token |
| GET | `/api/mobile/v1/notificacoes` | Lista notificações do aluno (paginada) |
| PATCH | `/api/mobile/v1/notificacoes/:id` | Marca uma como lida |
| PATCH | `/api/mobile/v1/notificacoes/lidas` | Marca todas como lidas |
| GET | `/api/mobile/v1/notificacoes/nao-lidas` | Contagem de não-lidas |

### Serviço de envio de push
- Usar `expo-server-sdk` (npm) para enviar via Expo Push Service
- Chunking automático (max 100 por request)
- Tratar erro `DeviceNotRegistered` removendo tokens inválidos do banco
- Verificar receipts após ~15 minutos

### Cron para inatividade (estilo Duolingo)
- Rodar diariamente (cron job ou Vercel Cron)
- Query: alunos cuja última resolução de questão foi há X dias
- Criar notificação tipo `'inatividade'` + enviar push
- Mensagens variadas: "Faz X dias que você não estuda! Volte e mantenha seu streak!"

### Notificação de conquistas
- No endpoint que desbloqueia conquistas (provavelmente `concluirBloco` ou similar), após criar a conquista, criar notificação tipo `'conquista'` + enviar push

---

## Arquivos do frontend a criar/modificar

| Arquivo | Ação |
|---------|------|
| `app.config.ts` | Modificar — plugin expo-notifications + google services |
| `src/services/notificacoesService.ts` | Criar |
| `src/schemas/notificacoes.ts` | Criar |
| `src/providers/NotificacoesProvider.tsx` | Criar |
| `src/state/notificacoes.ts` | Criar |
| `app/_layout.tsx` | Modificar — adicionar NotificacoesProvider |
| `app/(app)/notificacoes.tsx` | Criar — tela de lista |
| `app/(app)/dashboard.tsx` | Modificar — sininho funcional |
| `components/AlunoHeaderSummary.tsx` | Modificar — sininho funcional |
| `google-services.json` | Adicionar (do Firebase Console) |

---

## Verificação
1. Instalar o novo build de desenvolvimento no dispositivo
2. Abrir o app → deve pedir permissão de notificação (Android 13+)
3. Verificar no backend que o push token foi salvo
4. Enviar notificação manual pelo admin → deve aparecer no celular
5. Abrir o app → sininho mostra badge com contagem
6. Tap no sininho → abre tela de notificações com a mensagem
7. Marcar como lida → badge atualiza
8. Testar deep linking: notificação com dados de rota → tap abre tela correta

---

## Prompt para o Backend + Frontend Admin (outra instância do Claude Code)

O prompt abaixo deve ser copiado e colado em outra instância do Claude Code rodando no repositório do backend/web.

```
Estamos implementando um sistema completo de notificações push para o aplicativo mobile da Genius Factory (Expo/React Native). O app mobile já terá a parte do cliente implementada. Agora precisamos de DOIS blocos de trabalho neste repositório:

1. **Backend (API)** — endpoints para o app mobile consumir + serviço de envio de push + cron de inatividade
2. **Frontend administrativo** — tela no painel admin para criar e gerenciar notificações manuais

O projeto é Next.js 15 com App Router. As rotas da API mobile ficam em `app/api/mobile/v1/` como Route Handlers (arquivos `route.ts` que exportam GET, POST, etc.). O banco é PostgreSQL (Neon). A autenticação mobile usa Bearer token JWT. O painel admin usa autenticação por cookies/session.

Quero que você analise os padrões existentes do projeto (autenticação, validação, estrutura de Route Handlers, componentes do admin, etc.) e depois faça um PLANEJAMENTO completo. NÃO implemente ainda — apenas planeje.

---

### PARTE 1: BANCO DE DADOS

Tabelas necessárias:

**`push_tokens`** — tokens de push dos dispositivos
- id uuid PK
- aluno_id uuid FK → referência ao aluno
- token text UNIQUE — Expo Push Token (formato: ExponentPushToken[xxx])
- platform text — 'android' ou 'ios'
- created_at timestamp
- updated_at timestamp

**`notificacoes`** — cada notificação criada (uma entrada por notificação, independente de quantos alunos recebem)
- id uuid PK
- titulo text
- corpo text
- tipo text CHECK ('manual', 'inatividade', 'conquista')
- dados jsonb nullable — dados para deep linking no app (ex: { route: '/trilhas/123' })
- criada_em timestamp

**`notificacoes_alunos`** — relação N:N: quem recebeu qual notificação
- id uuid PK
- notificacao_id uuid FK
- aluno_id uuid FK
- lida boolean default false
- lida_em timestamp nullable
- push_enviado boolean default false
- created_at timestamp

Índices: notificacoes_alunos(aluno_id, lida), push_tokens(aluno_id)

---

### PARTE 2: SERVIÇO DE ENVIO PUSH

Instalar `expo-server-sdk` (npm install expo-server-sdk).

Criar serviço `lib/pushNotificationService.ts`:
- Função `enviarPushParaAlunos(alunoIds: string[], titulo: string, corpo: string, dados?: object)`
- Busca tokens dos alunos no banco (tabela push_tokens)
- Usa expo-server-sdk para enviar via Expo Push Service (chunking automático, max 100/request)
- Trata erro `DeviceNotRegistered` removendo tokens inválidos do banco
- Verifica receipts após envio (pode ser assíncrono)
- Marca `push_enviado = true` em notificacoes_alunos após envio bem-sucedido

---

### PARTE 3: ENDPOINTS DA API MOBILE

Route Handlers para o app mobile consumir:

1. **`app/api/mobile/v1/notificacoes/token/route.ts`**
   - POST: recebe `{ token, platform }`, faz upsert do push_token vinculado ao aluno autenticado (JWT)

2. **`app/api/mobile/v1/notificacoes/route.ts`**
   - GET: lista notificações do aluno autenticado (paginada com `page` e `perPage`, ordenada por criada_em DESC)
   - Retorna: `{ notificacoes: [{ id, titulo, corpo, tipo, lida, dados, criadaEm }], total, page }`

3. **`app/api/mobile/v1/notificacoes/[id]/route.ts`**
   - PATCH: marca notificação como lida (lida=true, lida_em=now) para o aluno autenticado

4. **`app/api/mobile/v1/notificacoes/lidas/route.ts`**
   - PATCH: marca TODAS as notificações como lidas para o aluno autenticado

5. **`app/api/mobile/v1/notificacoes/nao-lidas/route.ts`**
   - GET: retorna `{ count: number }` de notificações não lidas do aluno autenticado

---

### PARTE 4: NOTIFICAÇÕES AUTOMÁTICAS

**Conquistas:**
- No endpoint/função que desbloqueia conquistas (quando `concluirBloco` retorna `novasConquistas`), após criar a conquista, criar entrada em `notificacoes` + `notificacoes_alunos` e chamar `enviarPushParaAlunos` com tipo 'conquista'
- Título: nome da conquista. Corpo: "Parabéns! Você desbloqueou a conquista {nome}!"

**Inatividade (estilo Duolingo):**
- Criar endpoint de cron: `app/api/cron/notificacoes-inatividade/route.ts` (configurar com Vercel Cron para rodar 1x/dia)
- Query: alunos cuja última resposta de questão foi há X dias (configurável, sugestão: 3 dias)
- Para cada aluno inativo: criar notificação tipo 'inatividade' + enviar push
- Mensagens variadas para não ficar repetitivo, ex:
  - "Faz {X} dias que você não resolve questões! Volte e continue aprendendo!"
  - "Sentimos sua falta! Que tal resolver algumas questões hoje?"
  - "Seu cérebro precisa de exercício! Volte e mantenha seu progresso!"
- NÃO enviar duplicata se o aluno já foi notificado por inatividade hoje

---

### PARTE 5: FRONTEND ADMINISTRATIVO (Painel Admin)

Criar uma tela no painel admin para gerenciar notificações. Preciso de:

1. **Página de listagem de notificações enviadas:**
   - Tabela com: título, tipo, data de criação, quantidade de destinatários, % de lidas
   - Filtros por tipo (manual, inatividade, conquista)
   - Ordenação por data (mais recentes primeiro)

2. **Página/modal de criar notificação manual:**
   - Formulário com campos:
     - Título (obrigatório, max 100 caracteres)
     - Corpo da mensagem (obrigatório, max 500 caracteres)
     - Dados de deep link (opcional) — campo JSON ou dropdown com rotas comuns do app
   - Preview de como ficará a notificação push
   - Botão "Enviar para todos os alunos" com confirmação
   - Indicador de progresso do envio

3. **Página de detalhes de uma notificação:**
   - Dados da notificação (título, corpo, tipo, data)
   - Estatísticas: total enviados, total lidos, % leitura
   - Lista dos alunos que receberam (com status: lida/não lida, data de leitura)

Siga os padrões de UI/componentes existentes no painel admin. Analise como outras seções do admin são construídas (tabelas, formulários, modais) e use os mesmos componentes.

---

### INSTRUÇÕES

- Analise primeiro os padrões existentes do projeto (autenticação, validação, componentes admin, etc.)
- Faça um PLANEJAMENTO completo antes de implementar
- Identifique quais arquivos precisam ser criados e modificados
- Considere a ordem de implementação (banco → serviço → endpoints → admin)
- Use transações do banco quando criar notificação + notificacoes_alunos em batch
```
