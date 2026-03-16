# Plano: Implementação de Notificações Push + Tela Interna

## Contexto
O app tem ícones de sininho em todas as telas mas são inúteis. Precisamos implementar:
1. **Notificações manuais** — admin envia para todos os alunos
2. **Notificações automáticas** — lembrete para alunos inativos (estilo Duolingo, X dias sem resolver questões)
3. **Notificações de conquistas** — quando aluno desbloqueia uma conquista

**Stack:** App Expo/React Native → Backend Next.js 15 (App Router, routes em `app/api/mobile/v1/`) → PostgreSQL (Neon)
**Formato:** Push notifications (celular bloqueado) + tela interna com histórico

> **Nota:** O backend reutiliza o sistema de **Avisos** existente (`Aviso` + `AlunoAviso`) em vez de criar tabelas novas. O app mobile consome uma API normalizada e não precisa saber da estrutura interna do backend.

---

## Arquitetura Geral

```
App Expo                          Backend Next.js                    Serviços
────────                          ──────────────                    ────────
1. Pede permissão push
2. getExpoPushTokenAsync() →  3. POST /notificacoes/token      → upsert PushTokenAluno
                                  (body: { token, plataforma })

                              4. Admin cria Aviso (enviarPush)   → cria AlunoAviso + push
                              5. Rotina dispara evento           → cria AlunoAviso + push
                              6. Conquista desbloqueada           → via dispararRotinasPorEvento

                              7. pushNotificationService          → Expo Push Service → FCM/APNs
                                 (expo-server-sdk, chunking)

8. Recebe push no device
9. Tap → abre app/tela
10. GET /notificacoes          ← lista AlunoAviso+Aviso normalizado
11. PATCH /notificacoes/:id    ← marca como lida (AlunoAviso.id)
```

---

## FRONTEND (este repositório)

### Etapa 1: Instalar dependências
```bash
npx expo install expo-notifications expo-device
```
**Obs:** `expo-constants` já está instalado (`~18.0.10`).

### Etapa 2: Configurar app.config.ts
- Adicionar plugin `expo-notifications` com `defaultChannel` e `color`
- Adicionar `android.googleServicesFile` apontando para `google-services.json`
- **Pré-requisito:** Criar projeto Firebase, baixar `google-services.json`, fazer upload das credenciais FCM via `eas credentials`

**Arquivo:** `app.config.ts`

### Etapa 3: Criar serviço de notificações
**Novo arquivo:** `src/services/notificacoesService.ts`

Funções:
- `registrarTokenPush(token: string, plataforma: string)` → POST `/api/mobile/v1/notificacoes/token`
- `listarNotificacoes(page, pageSize)` → GET `/api/mobile/v1/notificacoes`
- `marcarComoLida(alunoAvisoId)` → PATCH `/api/mobile/v1/notificacoes/:id`
- `marcarTodasComoLidas()` → PATCH `/api/mobile/v1/notificacoes/lidas`
- `contarNaoLidas()` → GET `/api/mobile/v1/notificacoes/nao-lidas`

### Etapa 4: Criar schema Zod
**Novo arquivo:** `src/schemas/notificacoes.ts`

```typescript
const NotificacaoSchema = z.object({
  id: z.string(),            // AlunoAviso.id (usado no PATCH para marcar lida)
  titulo: z.string(),        // Aviso.titulo
  corpo: z.string(),         // Aviso.conteudo (normalizado pelo backend)
  tipo: z.enum(['manual', 'inatividade', 'conquista']),  // normalizado pelo backend
  lida: z.boolean(),         // AlunoAviso.visualizado
  dados: z.record(z.any()).nullable(), // deep link data (ex: { route: '/trilhas/abc' })
  criadaEm: z.string(),      // Aviso.criadaEm
})

const NotificacoesResponseSchema = z.object({
  notificacoes: z.array(NotificacaoSchema),
  total: z.number(),
  page: z.number(),
})

const NaoLidasResponseSchema = z.object({
  count: z.number(),
})
```

### Etapa 5: Criar provider de notificações
**Novo arquivo:** `src/providers/NotificacoesProvider.tsx`

Responsabilidades:
- Pedir permissão de push (Android 13+ precisa de permissão explícita)
- Obter Expo Push Token via `getExpoPushTokenAsync({ projectId })`
- Enviar token ao backend (a cada abertura do app, pois token pode mudar)
- Configurar `setNotificationHandler` para comportamento em foreground (mostrar banner)
- Listener `addNotificationResponseReceivedListener` para taps → navegar para tela relevante
- Listener `addNotificationReceivedListener` para atualizar badge de não-lidas em foreground

**Integrar em:** `app/_layout.tsx` (dentro do JotaiProvider)

> **Importante:** O provider deve aguardar `sessionLoadedAtom === true` e verificar que existe `accessToken` antes de registrar o token de push. Usar um componente interno que consome esses atoms e só inicializa quando o aluno está autenticado.

### Etapa 6: Criar atom de contagem de não-lidas
**Novo arquivo:** `src/state/notificacoes.ts`

```typescript
export const notificacoesNaoLidasAtom = atom(0)
```

### Etapa 7: Criar tela de notificações
**Novo arquivo:** `app/(app)/notificacoes.tsx`

- Lista de notificações com FlatList + paginação infinita (`pageSize=20`)
- Pull-to-refresh
- Cada item: ícone por tipo, título, corpo (truncado), tempo relativo ("há 2 horas")
- Tap marca como lida + navega para destino (se `dados.route` existir, usa `router.push(dados.route)`)
- Botão "Marcar todas como lidas"

> **Importante:** Registrar a tela em `app/(app)/_layout.tsx` como hidden tab:
> ```tsx
> <Tabs.Screen
>   name="notificacoes"
>   options={{
>     tabBarButton: () => null,
>     tabBarItemStyle: { display: 'none' },
>   }}
> />
> ```

### Etapa 8: Conectar os sininhos

Existem **dois sininhos independentes** que precisam ser atualizados:

**1. `app/(app)/dashboard.tsx`** — sininho inline no header (linha ~246)
- O `dashboard.tsx` tem seu próprio sininho, **não** usa `AlunoHeaderSummary`
- Atualmente sem `onPress` — adicionar `onPress={() => router.push('/notificacoes')}`
- Substituir `notificationDot` estático por badge dinâmico do atom `notificacoesNaoLidasAtom`
- Esconder badge quando `naoLidas === 0`

**2. `components/AlunoHeaderSummary.tsx`** — sininho reutilizável
- Já tem prop `onPressNotification` — passar `router.push('/notificacoes')` de quem usa
- Substituir `notificationDot` estático (bolinha teal) por badge dinâmico do atom
- Esconder badge quando `naoLidas === 0`

### Etapa 9: Build nativo necessário
```bash
npx eas-cli build --profile development --platform android
```
`expo-notifications` é módulo nativo → precisa de novo build. Após build, mudanças JS funcionam via hot-reload.

---

## BACKEND (repositório Genius Factory Web)

> O backend reutiliza o sistema de Avisos existente. Veja o planejamento completo no repositório web.

### Modelo de Dados (extensões ao Prisma existente)

**Novo modelo: `PushTokenAluno`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | cuid PK | |
| alunoId | string FK | Referência ao aluno |
| token | string UNIQUE | Expo Push Token |
| plataforma | string | 'android' ou 'ios' |
| criadoEm | DateTime | |
| atualizadoEm | DateTime | @updatedAt |

**Campos novos no `Aviso`:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| dados | Json? | Dados para deep linking (ex: `{ route: '/trilhas/abc' }`) |
| enviarPush | Boolean | Default false. Se true, envia push ao criar |

**Campos novos no `AlunoAviso`:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| pushEnviado | Boolean | Default false |
| lidoEm | DateTime? | Data exata da leitura |

### Contrato da API Mobile

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST | `/notificacoes/token` | `{ token, plataforma }` | `{ ok: true }` |
| GET | `/notificacoes?page=1&pageSize=20` | — | `{ notificacoes: [...], total, page }` |
| PATCH | `/notificacoes/:id` | — | `{ ok: true }` |
| PATCH | `/notificacoes/lidas` | — | `{ ok: true }` |
| GET | `/notificacoes/nao-lidas` | — | `{ count: number }` |

**Formato de cada notificação no array:**
```json
{
  "id": "<AlunoAviso.id>",
  "titulo": "<Aviso.titulo>",
  "corpo": "<Aviso.conteudo>",
  "tipo": "manual | inatividade | conquista",
  "lida": false,
  "dados": { "route": "/trilhas/abc" },
  "criadaEm": "2026-03-15T22:00:00Z"
}
```

> **Normalização de `tipo`:** O backend transforma a combinação `Aviso.tipo` + `Rotina.eventoEspecifico` em um valor simples: `'manual'`, `'inatividade'` ou `'conquista'`.

### Serviço de envio de push
- Usar `expo-server-sdk` (npm) para enviar via Expo Push Service
- Chunking automático (max 100 por request)
- Tratar erro `DeviceNotRegistered` removendo tokens inválidos do banco
- Verificar receipts após ~15 minutos

### Integração com Avisos existentes
- **Criação manual:** POST `/api/avisos` → se `enviarPush === true`, chama `enviarPushParaAlunos`
- **Rotinas automáticas:** `dispararRotinasPorEvento` → se rotina tem `enviarPush`, envia push
- **Conquistas:** via `dispararRotinasPorEvento('NOVA_CONQUISTA')` (já existente)

### Cron de inatividade (estilo Duolingo)
- Rodar diariamente (Vercel Cron, 14h UTC)
- Query: alunos cuja última `RespostaAlunoQbank.respondidoEm` foi há X dias
- Criar `AlunoAviso` + enviar push
- Mensagens variadas para não repetir
- NÃO enviar duplicata se o aluno já foi notificado por inatividade hoje

---

## Deep Linking — Rotas do App Mobile

O campo `dados.route` deve usar rotas do **Expo Router** (não do Next.js):

| Destino | Rota |
|---------|------|
| Dashboard | `/dashboard` |
| Questões | `/questoes` |
| Trilhas | `/trilhas` |
| Trilha+Caminho | `/trilhas/{id}/caminhos/{caminhoId}` |
| Curso | `/cursos/{id}` |
| Simulado | `/simulados/{id}/resolver` |
| Conquistas | `/conquistas` |
| Ranking | `/ranking` |

O `NotificacoesProvider` recebe o tap na notificação e faz `router.push(dados.route)`.

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
| `app/(app)/_layout.tsx` | Modificar — registrar tela notificacoes (hidden tab) |
| `app/(app)/notificacoes.tsx` | Criar — tela de lista |
| `app/(app)/dashboard.tsx` | Modificar — sininho funcional com badge dinâmico |
| `components/AlunoHeaderSummary.tsx` | Modificar — badge dinâmico pelo atom |
| `google-services.json` | Adicionar (do Firebase Console) |

---

## Verificação
1. Instalar o novo build de desenvolvimento no dispositivo
2. Abrir o app → deve pedir permissão de notificação (Android 13+)
3. Verificar no backend que o push token foi salvo
4. Enviar notificação manual pelo admin (com `enviarPush` ativado) → deve aparecer no celular
5. Abrir o app → sininho mostra badge com contagem
6. Tap no sininho → abre tela de notificações com a mensagem
7. Marcar como lida → badge atualiza
8. Testar deep linking: notificação com `dados.route` → tap abre tela correta

---

## Prompt para o Backend (repositório Genius Factory Web)

O prompt abaixo deve ser copiado e colado em outra instância rodando no repositório do backend/web.

```
Estamos implementando um sistema de notificações push para o app mobile da Genius Factory (Expo/React Native). A estratégia é REUTILIZAR o sistema de Avisos existente (Aviso + AlunoAviso + Rotinas), adicionando suporte a push notifications.

O projeto é Next.js 15 com App Router. As rotas da API mobile ficam em `app/api/mobile/v1/` como Route Handlers. O banco é PostgreSQL (Neon) com Prisma. A autenticação mobile usa Bearer token JWT via `getAlunoIdFromReq`. O painel admin usa autenticação por cookies/session.

Quero que você analise os padrões existentes do projeto e faça um PLANEJAMENTO completo. NÃO implemente ainda — apenas planeje.

---

### O QUE JÁ FOI IMPLEMENTADO NO APP MOBILE

O frontend mobile (repositório separado, Expo SDK 54) já está 100% implementado e aguarda o backend. Segue o resumo do que foi feito:

**Arquivos criados:**
- `src/schemas/notificacoes.ts` — 3 schemas Zod que validam as respostas da API:
  - `NotificacaoSchema` (id, titulo, corpo, tipo, lida, dados, criadaEm)
  - `NotificacoesResponseSchema` ({ notificacoes[], total, page })
  - `NaoLidasResponseSchema` ({ count })
- `src/state/notificacoes.ts` — Atom Jotai `notificacoesNaoLidasAtom` (número de não-lidas, usado como badge nos sininhos)
- `src/services/notificacoesService.ts` — 5 funções de API que consomem os endpoints abaixo:
  - `registrarTokenPush(token, plataforma)` → POST `/mobile/v1/notificacoes/token`
  - `listarNotificacoes(page, pageSize)` → GET `/mobile/v1/notificacoes`
  - `marcarComoLida(id)` → PATCH `/mobile/v1/notificacoes/${id}`
  - `marcarTodasComoLidas()` → PATCH `/mobile/v1/notificacoes/lidas`
  - `contarNaoLidas()` → GET `/mobile/v1/notificacoes/nao-lidas`
- `src/providers/NotificacoesProvider.tsx` — Provider que:
  - Aguarda sessão autenticada (sessionAtom + sessionLoadedAtom) antes de inicializar
  - Pede permissão de push (Android 13+)
  - Obtém Expo Push Token via `getExpoPushTokenAsync({ projectId })`
  - Envia token ao backend a cada abertura do app
  - Configura `setNotificationHandler` para mostrar banner em foreground
  - Listener de tap: extrai `dados.route` e faz `router.push(route)` (deep linking)
  - Listener de recebimento: recarrega contagem de não-lidas via API
- `app/(app)/notificacoes.tsx` — Tela de notificações com:
  - FlatList com paginação infinita (pageSize=20)
  - Pull-to-refresh
  - Ícone diferente por tipo (megafone=manual, relógio=inatividade, troféu=conquista)
  - Tempo relativo ("há 2h", "há 3d")
  - Tap marca como lida (atualização otimista) + navega para `dados.route`
  - Botão "Marcar todas como lidas"
  - Empty state quando não há notificações

**Arquivos modificados:**
- `app.config.ts` — Plugin expo-notifications + android.googleServicesFile
- `app/_layout.tsx` — `<NotificacoesProvider />` adicionado dentro do JotaiProvider
- `app/(app)/_layout.tsx` — Tela `notificacoes` registrada como hidden tab
- `app/(app)/dashboard.tsx` — Sininho com `onPress` → `/notificacoes` + badge numérico dinâmico
- `components/AlunoHeaderSummary.tsx` — Badge dinâmico interno (as telas trilhas, cursos e questões ganharam badge automaticamente sem precisar ser alteradas)

**Firebase:**
- Projeto Firebase "Genius Factory" (Plano Blaze) com app Android registrado
- `google-services.json` na raiz do projeto com package_name: `com.geniusfactory.app`
- Build de desenvolvimento com os módulos nativos em andamento

**O que o app espera do backend — CONTRATO IMUTÁVEL:**

O app valida todas as respostas com Zod. Se o backend retornar campos com nomes diferentes ou formatos diferentes do especificado abaixo, o app vai dar erro de parsing. Os nomes dos campos e seus tipos são IMUTÁVEIS.

---

### PARTE 1: BANCO DE DADOS (Prisma)

Extensões ao schema existente:

**Novo modelo `PushTokenAluno`:**
- id cuid PK
- alunoId string FK → Aluno (onDelete: Cascade)
- token string @unique — Expo Push Token (formato: ExponentPushToken[xxx])
- plataforma string — 'android' ou 'ios'
- criadoEm DateTime @default(now())
- atualizadoEm DateTime @updatedAt
- @@index([alunoId])

**Campos novos no `Aviso`:**
- dados Json? — dados para deep linking no app (ex: { route: '/trilhas/abc' })
- enviarPush Boolean @default(false) — se deve enviar push notification

**Campos novos no `AlunoAviso`:**
- pushEnviado Boolean @default(false)
- lidoEm DateTime? — data exata da leitura

**Relação no `Aluno`:**
- pushTokens PushTokenAluno[]

---

### PARTE 2: SERVIÇO DE ENVIO PUSH

Instalar `expo-server-sdk` (npm install expo-server-sdk).

Criar serviço `lib/pushNotificationService.ts`:
- Função `enviarPushParaAlunos(alunoIds: string[], titulo: string, corpo: string, dados?: object)`
- Busca tokens dos alunos no banco (tabela PushTokenAluno)
- Usa expo-server-sdk para enviar via Expo Push Service (chunking automático, max 100/request)
- Trata erro `DeviceNotRegistered` removendo tokens inválidos do banco
- Verifica receipts após envio (pode ser assíncrono)
- Marca `pushEnviado = true` em AlunoAviso após envio bem-sucedido

Formato do push que o app espera receber (expo-server-sdk `ExpoPushMessage`):
```json
{
  "to": "ExponentPushToken[xxx]",
  "title": "Título da notificação",
  "body": "Corpo da notificação",
  "data": { "route": "/conquistas" }
}
```
O campo `data.route` é usado pelo app para deep linking (tap na notificação → navega para a tela).

---

### PARTE 3: ENDPOINTS DA API MOBILE

Route Handlers para o app mobile consumir. Todos em `app/api/mobile/v1/notificacoes/`.

**Contrato da API (o app mobile JÁ ESTÁ implementado consumindo exatamente este formato, não altere nomes de campos):**

1. **POST `/notificacoes/token`**
   - Body: `{ token: string, plataforma: "android" | "ios" }`
   - Faz upsert de PushTokenAluno vinculado ao aluno autenticado
   - Se o token já existe para outro aluno, atualiza o alunoId
   - Response: `{ ok: true }`

2. **GET `/notificacoes?page=1&pageSize=20`**
   - Lista AlunoAviso do aluno autenticado com join no Aviso
   - Ordenada por criadaEm DESC
   - **Normaliza os campos para o contrato do app (ATENÇÃO: o app valida com Zod, use exatamente estes nomes):**
     - `id` → `AlunoAviso.id` (NÃO Aviso.id — este é o ID usado no PATCH para marcar lida)
     - `titulo` → `Aviso.titulo`
     - `corpo` → `Aviso.conteudo` (campo renomeado de "conteudo" para "corpo")
     - `tipo` → normaliza Aviso.tipo/Rotina.eventoEspecifico em: `'manual'`, `'inatividade'` ou `'conquista'`
     - `lida` → `AlunoAviso.visualizado`
     - `dados` → `Aviso.dados` (Json nullable, ex: { route: '/trilhas/abc' })
     - `criadaEm` → `Aviso.criadaEm` (ISO string)
   - Response: `{ notificacoes: [...], total: number, page: number }`

3. **PATCH `/notificacoes/[id]`**
   - O `id` é `AlunoAviso.id`
   - Marca como lida (visualizado: true, lidoEm: new Date())
   - Verifica que o AlunoAviso pertence ao aluno autenticado
   - Response: `{ ok: true }`

4. **PATCH `/notificacoes/lidas`**
   - Marca TODAS as notificações como lidas para o aluno autenticado
   - Response: `{ ok: true }`

5. **GET `/notificacoes/nao-lidas`**
   - Response: `{ count: number }`

---

### PARTE 4: INTEGRAÇÃO COM AVISOS EXISTENTES

**Criação manual (POST /api/avisos):**
- Após criar os AlunoAviso, se `aviso.enviarPush === true`:
  - Coletar os alunoIds que receberam o aviso
  - Chamar `enviarPushParaAlunos(alunoIds, aviso.titulo, aviso.conteudo, aviso.dados)`

**Rotinas automáticas (dispararRotinasPorEvento):**
- Após criar AlunoAviso para rotinas com evento, se a rotina tem `enviarPush === true`:
  - Chamar `enviarPushParaAlunos([alunoId], rotina.titulo, rotina.conteudo, rotina.dados)`

**Conquistas:**
- Integração automática via `dispararRotinasPorEvento('NOVA_CONQUISTA')` (já existente)
- Admin precisa cadastrar rotina do tipo NOVA_CONQUISTA com `enviarPush = true`
- Para push garantido sem rotina: adicionar função `enviarPushConquista(alunoId, conquistaNome)` que cria Aviso ad-hoc e envia push

---

### PARTE 5: CRON DE INATIVIDADE

Criar endpoint: `app/api/cron/notificacoes-inatividade/route.ts`
- Protegido por `CRON_SECRET` (Bearer token)
- Query: alunos cuja última RespostaAlunoQbank.respondidoEm foi há X dias (sugestão: 3)
- Para cada aluno inativo: verificar se já foi notificado por inatividade hoje (evitar duplicata)
- Criar Aviso tipo rotina com eventoEspecifico INATIVIDADE + AlunoAviso + enviar push
- Mensagens variadas:
  - "Faz {X} dias que você não resolve questões! Volte e continue aprendendo!"
  - "Sentimos sua falta! Que tal resolver algumas questões hoje?"
  - "Seu cérebro precisa de exercício! Volte e mantenha seu progresso!"

Configurar em vercel.json:
```json
{ "path": "/api/cron/notificacoes-inatividade", "schedule": "0 14 * * *" }
```

---

### PARTE 6: FRONTEND ADMINISTRATIVO (Painel Admin)

Adaptar a tela de Avisos existente (`app/admin/avisos/`):

1. **ModalCriarAviso — Aviso manual:**
   - Toggle "Enviar push notification" (Switch) → campo `enviarPush`
   - Campo "Dados de deep link" (opcional) → dropdown com rotas do app mobile:
     - `/dashboard`, `/questoes`, `/trilhas`, `/cursos`, `/conquistas`, `/ranking`
   - Preview da notificação push (mini card com título + corpo truncado)
   - Confirmação antes de enviar: "Enviar push para X alunos? Esta ação não pode ser desfeita."

2. **ModalCriarAviso — Rotinas automáticas:**
   - Toggle "Enviar push quando disparada" → campo `enviarPush`
   - Campo "Dados de deep link" → campo `dados`

3. **ModalVerAviso — Estatísticas de push:**
   - Total de destinatários
   - Total de push enviados (pushEnviado: true)
   - Total de lidos (visualizado: true)
   - % de leitura
   - Dados de deep link (se houver)

4. **Listagem de avisos:**
   - Ícone de push (Smartphone/Bell) se enviarPush === true
   - Badge com contagem de envios e leituras

---

### INSTRUÇÕES

- Analise primeiro os padrões existentes do projeto (autenticação mobile, validação Zod, componentes admin, sistema de Avisos/Rotinas)
- Faça um PLANEJAMENTO completo antes de implementar
- Identifique quais arquivos precisam ser criados e modificados
- Considere a ordem de implementação (schema → migration → serviço → endpoints → integração → admin)
- Use transações do banco quando criar AlunoAviso em batch
- O campo `dados.route` deve conter rotas do Expo Router do app mobile (NÃO rotas do Next.js)
- RESPEITE o contrato da API exatamente como descrito — o app mobile já valida com Zod e qualquer divergência causará erro de parsing
```
