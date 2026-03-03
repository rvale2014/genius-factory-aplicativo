# Análise de Performance — Genius Factory App

Data: 03/03/2026

---

## 1. Problemas de performance encontrados

---

### P0-01 — `useMemo` chamado dentro de bloco condicional (violação das Rules of Hooks) ✅ Concluído

**Arquivo:** `components/qbank/QuestaoPlayer.tsx:342`

**O que acontece:**
Dentro da função `renderConteudo()`, existe um `useMemo` que só é alcançado quando `tipo === "ligar_colunas"`:

```tsx
if (tipo === "ligar_colunas") {
  const colB = useMemo(() => { ... }, [respLigar._colunaB, colunaA]);
```

**Por que é um problema:**
O React exige que hooks sejam chamados sempre na mesma ordem e quantidade a cada render. Quando um hook está dentro de um `if`, ele pode ser chamado em um render e não no próximo. Isso quebra o mecanismo interno do React que rastreia hooks por posição — o resultado é um crash em runtime com a mensagem "Rendered more hooks than during the previous render". Qualquer aluno que abrir uma questão de ligar colunas depois de ter aberto outro tipo de questão pode experimentar esse crash.

**Severidade:** Crash em runtime.

---

### P1-01 — Polling de 100ms no AudioPlayer (10 re-renders por segundo) ✅ Concluído

**Arquivo:** `components/leitura/AudioPlayerMobile.tsx:42-65`

**O que acontece:**
Um `setInterval` de 100ms atualiza dois estados (`position` e `duration`) enquanto o componente estiver montado:

```tsx
const interval = setInterval(() => {
  setDuration(durationMs);
  setPosition(positionMs); // setState a cada 100ms
}, 100);
```

**Por que é um problema:**
Cada `setState` agenda um re-render do componente. Com dois `setState` por tick e um tick a cada 100ms, o componente re-renderiza 10 vezes por segundo — mesmo quando o áudio está pausado e nada mudou na tela. Isso consome CPU e bateria desnecessariamente e pode causar jank (travadas visuais) em dispositivos mais fracos, especialmente se o componente estiver dentro de uma tela com outros elementos pesados como listas ou vídeos.

**Correção sugerida:** Só rodar o interval enquanto o áudio estiver tocando. Aumentar o intervalo para 250-500ms (a percepção humana de progresso não exige 10fps). Usar um único `setState` com objeto ao invés de dois separados.

---

### P1-02 — Leituras sequenciais no AsyncStorage dentro de loops ✅ Concluído

**Arquivos:**
- `app/(app)/trilhas/[id]/caminhos/[caminhoId].tsx:162-184`
- `components/blocos/BlocoContainer.tsx:103-133`

**O que acontece:**
Para verificar o estado de cada bloco/questão, o código faz `AsyncStorage.getItem()` dentro de um `for` loop:

```tsx
for (const bloco of data.blocos) {
  const emRefazer = await AsyncStorage.getItem(refazerKey); // 1 leitura por iteração
}
```

No `BlocoContainer`, para um bloco com 10 questões, são 20 leituras sequenciais (2 por questão).

**Por que é um problema:**
Cada chamada ao `AsyncStorage.getItem()` é uma operação assíncrona que cruza a "bridge" entre JavaScript e código nativo. Quando feitas em sequência (uma esperando a outra terminar), o tempo total é a soma de todas as leituras. Se cada leitura leva 5-10ms, 20 leituras levam 100-200ms — um atraso perceptível ao abrir um bloco. O `AsyncStorage` oferece `multiGet()` que faz todas as leituras em uma única travessia da bridge, reduzindo para ~10-15ms total.

**Correção sugerida:** Coletar todas as chaves necessárias em um array e usar `AsyncStorage.multiGet(chaves)` uma única vez.

---

### P1-03 — Scan completo do AsyncStorage com `getAllKeys()` ✅ Concluído

**Arquivo:** `app/(app)/trilhas/[id]/caminhos/[caminhoId].tsx:246`

**O que acontece:**
Quando o aluno clica em "Refazer", o código busca todas as chaves do AsyncStorage para encontrar as relacionadas ao bloco:

```tsx
const todasChaves = await AsyncStorage.getAllKeys();
const chavesParaRemover = todasChaves.filter(k => k.startsWith(`bloco_${blocoId}`));
```

**Por que é um problema:**
O `getAllKeys()` retorna todas as chaves salvas no app — não apenas as do bloco. Conforme o app acumula dados (progresso de cursos, cache de simulados, preferências), essa lista cresce. Em um dispositivo com centenas de chaves, o scan se torna lento. Além disso, o filtro com `.startsWith()` itera sobre todas as chaves no JS thread. É o equivalente a fazer `SELECT * FROM tabela` para depois filtrar no código ao invés de usar `WHERE`.

**Correção sugerida:** Ao salvar dados de um bloco, manter um índice (uma chave que contém a lista de sub-chaves do bloco). Na hora de limpar, ler apenas o índice.

---

### P1-04 — Loop de polling bloqueante de até 14.4 segundos ✅ Concluído

**Arquivo:** `app/(app)/simulados/[id]/resolver.tsx:347-351`

**O que acontece:**
Ao concluir um simulado, o código faz polling síncrono em loop para verificar se a correção foi processada:

```tsx
for (let i = 0; i < 12; i++) {
  await new Promise(resolve => setTimeout(resolve, 1200));
  // verifica status...
}
```

São 12 tentativas × 1.2 segundos = até 14.4 segundos de espera sequencial.

**Por que é um problema:**
Embora o `setTimeout` não bloqueie a thread literalmente, o `await` dentro do `for` mantém a função ocupada e impede que o componente responda a interações do usuário de forma previsível. Se o componente desmontar durante o loop (ex: o aluno volta para a tela anterior), os `setState` subsequentes causam warnings. Além disso, o intervalo fixo de 1.2s não é ideal — nas primeiras tentativas o servidor provavelmente ainda não terminou, e nas últimas a resposta provavelmente já está pronta.

**Correção sugerida:** Usar exponential backoff (ex: 500ms, 1s, 2s, 4s...) com `AbortController` para cancelar no unmount. Ou usar um `setInterval` com cleanup no `useEffect`.

---

### P1-05 — Complexidade O(n²) no resultado do simulado ✅ Concluído

**Arquivo:** `app/(app)/simulados/[id]/resultado.tsx:562`

**O que acontece:**
Para renderizar os comentários de cada questão, o código usa `find()` dentro de `map()`:

```tsx
{idsOrdenados.map((qid) => {
  const questao = questoes.find((q) => q.id === qid); // O(n) para cada iteração
  ...
})}
```

**Por que é um problema:**
Para cada item em `idsOrdenados`, o `.find()` percorre o array `questoes` até encontrar o match. Se o simulado tem 60 questões, são 60 × 60 = 3.600 comparações. Isso acontece em toda re-renderização do componente — e como os sub-componentes não são memoizados (ver P2-04), qualquer mudança de estado (ex: abrir um bottom sheet) dispara essas 3.600 comparações novamente.

A complexidade O(n²) raramente causa problemas com n=10, mas com n=60 (simulado completo) já é perceptível, e escalaria mal se houvesse simulados maiores.

**Correção sugerida:** Criar um `Map` com `useMemo`:
```tsx
const questoesMap = useMemo(() => new Map(questoes.map(q => [q.id, q])), [questoes]);
// Depois: questoesMap.get(qid) → O(1)
```

---

### P1-06 — FlatList sem props de otimização no banco de questões ✅ Concluído

**Arquivo:** `app/(app)/questoes.tsx:580-604`

**O que acontece:**
A FlatList que renderiza as questões não possui as props de otimização:

```tsx
<FlatList
  data={items}
  keyExtractor={(q) => q.id}
  renderItem={({ item }) => <QuestaoCard questao={item} />}
  contentContainerStyle={{ paddingVertical: 12 }}
/>
```

Faltam: `getItemLayout`, `removeClippedSubviews`, `maxToRenderPerBatch`, `windowSize`.

**Por que é um problema:**
Sem `removeClippedSubviews`, todos os itens da lista permanecem na árvore de views nativas mesmo quando estão fora da tela — consumindo memória. Sem `getItemLayout`, o React Native precisa medir cada item antes de renderizá-lo, causando jumps ao fazer scroll. Sem `maxToRenderPerBatch` e `windowSize`, o framework tenta renderizar todos os itens visíveis de uma vez, causando frame drops durante scroll rápido. O `QuestaoCard` é um componente pesado (com HTML rendering via `RenderHTML`), o que amplifica o impacto.

**Correção sugerida:** Adicionar `removeClippedSubviews={true}`, `maxToRenderPerBatch={5}`, `windowSize={5}`, e `initialNumToRender={5}`. Se os cards tiverem altura fixa, adicionar `getItemLayout`. Envolver `QuestaoCard` em `React.memo`.

**Reavaliação:** Não é um problema real no contexto da tela de questões. A lista usa paginação manual com lotes de apenas 5 itens e o `QuestaoCard` é um componente interativo onde o aluno responde questões inline. A prop `removeClippedSubviews` tem histórico de bugs no Android com itens que desaparecem ou perdem interatividade — exatamente o tipo de componente que temos. As props `maxToRenderPerBatch` e `windowSize` trariam ganho negligível com lotes tão pequenos. Scroll infinito também não é viável porque o React Native desmonta componentes fora da viewport, o que faria o aluno perder o estado da resposta ao rolar de volta para uma questão anterior. A arquitetura atual — paginação controlada pelo usuário com lotes pequenos — é a abordagem correta para uma lista de itens interativos com estado local.

---

### P1-07 — Requests em cascata (waterfall) nos filtros de questões ✅ Concluído

**Arquivo:** `app/(app)/questoes.tsx:801-832`

**O que acontece:**
As opções dos filtros são carregadas em sequência — cada uma depende da anterior:

```
Matérias selecionadas → fetch Assuntos
Instituições selecionadas → fetch Classes
Instituições + Classes → fetch Fases
```

Cada fetch espera o anterior terminar antes de iniciar.

**Por que é um problema:**
Se cada request leva ~200ms, três requests sequenciais levam ~600ms. O usuário vê os filtros carregando um a um com delay visível entre eles. Em redes mais lentas (3G), o efeito cascata é multiplicado — 500ms por request = 1.5 segundo de espera. Isso prejudica a percepção de responsividade na tela de questões, que é uma das mais utilizadas do app.

**Correção sugerida:** Usar `Promise.all()` para requests que não dependem entre si (ex: Assuntos e Classes podem ser carregados em paralelo). Apenas Fases precisa esperar Classes terminar.

**Reavaliação:** Não é um problema real. Os fetches de Assuntos e Classes já rodam em paralelo por serem `useEffect`s independentes — não há cascata sequencial como descrito. A cadeia Matérias → Assuntos, Instituições → Classes → Fases é regra de negócio legítima. Impacto negligível.

---

### P1-08 — `console.log/error/warn` em código de produção ✅ Concluído

**Arquivos principais:**

| Arquivo | Quantidade | Contexto |
|---------|-----------|----------|
| `components/questoes/ColorirFiguraAluno.tsx` | 11 | WebView `onMessage` — cruza bridge |
| `app/(app)/simulados/[id]/resultado.tsx` | 8 | Carregamento de dados |
| `src/services/blocoService.ts` | 5 | Toda navegação de bloco |
| `app/(app)/cursos/[id].tsx` | 7 | Error handlers |
| `app/(app)/minha-conta.tsx` | 5 | Error handlers |
| `components/simuladoTrilha/PaginaSimulado.tsx` | 4 | Logs de debug |
| `app/(app)/questoes.tsx` | 6 | `.catch(console.error)` |
| `app/_layout.tsx` | 1 | Root layout |

**Por que é um problema:**
No React Native, `console.log` não é gratuito. Cada chamada serializa os argumentos, envia pela bridge JS↔Nativo, e é processada pelo mecanismo de logging do dispositivo. Em hot paths como `onMessage` de WebView (ColorirFigura) ou navegação de blocos (blocoService), dezenas de logs por segundo degradam a performance do JS thread. O caso mais grave é `ColorirFiguraAluno.tsx` com 11 logs que disparam a cada interação do aluno com o WebView — cada log cruza a bridge duas vezes (JS→Nativo para o log, Nativo→JS para o retorno do onMessage).

**Correção sugerida:** Remover todos os logs ou proteger com `if (__DEV__)`. Não usar `.catch(console.error)` — tratar ou ignorar silenciosamente.

---

### P2-01 — ProgressHeader re-renderiza a cada digitação de resposta ✅ Concluído

**Arquivo:** `app/(app)/simulados/[id]/resolver.tsx:110-156`

**O que acontece:**
`ProgressHeader` recebe `respostas` como prop. Cada vez que o aluno digita algo em qualquer questão, `respostas` é atualizado via `setRespostas`, e `ProgressHeader` re-renderiza. Dentro dele, um `.reduce()` percorre todas as questões e um `.map()` renderiza 60 dots:

```tsx
const respondidas = questoes.reduce((acc, q) =>
  acc + (isRespondida(q.tipo, respostas[q.id]) ? 1 : 0), 0
);
// ...
{questoes.map((q, i) => (
  <TouchableOpacity ... /> // 60 elementos recriados a cada keystroke
))}
```

**Por que é um problema:**
Em um simulado de 60 questões, cada keystroke causa: 60 iterações no reduce + 60 reconciliações de elementos React no map + 60 comparações de style condicional. Isso acontece no JS thread, que também precisa processar a digitação e atualizar o TextInput. O resultado é input lag — o aluno digita e o texto aparece com atraso perceptível.

**Correção sugerida:** Envolver `ProgressHeader` em `React.memo` com comparação customizada que só re-renderize quando a contagem de respondidas muda (não a cada keystroke). Extrair os dots para um componente memoizado separado.

---

### P2-02 — ScrollView com `.map()` nas conquistas (sem virtualização) ✅ Concluído

**Arquivo:** `app/(app)/conquistas.tsx:149-157`

**O que acontece:**
Cada categoria de conquistas renderiza seus itens com `ScrollView` horizontal + `.map()`:

```tsx
<ScrollView horizontal>
  {conquistas.map((conquista) => (
    <ConquistaCard key={conquista.id} conquista={conquista} />
  ))}
</ScrollView>
```

`ConquistaCard` não usa `React.memo`.

**Por que é um problema:**
O `ScrollView` renderiza todos os seus filhos imediatamente, mesmo os que estão fora da tela. Com `.map()`, o React cria novas instâncias de elementos a cada render do pai — mesmo que os dados não tenham mudado. Se há 4 categorias com 15 conquistas cada, são 60 cards renderizados de uma vez, sem nenhuma virtualização. Cada card inclui uma imagem e um `Modal` próprio (ver P2-03), amplificando o custo.

**Correção sugerida:** Trocar `ScrollView` por `FlatList` com `horizontal={true}`. Envolver `ConquistaCard` em `React.memo`.

---

### P2-03 — 50+ modais simultâneos na memória (conquistas) ✅ Concluído

**Arquivo:** `app/(app)/conquistas.tsx:40-49` e `125-148`

**O que acontece:**
Cada `ConquistaCard` gerencia seu próprio `Modal` com estado local `tooltipVisible`:

```tsx
function ConquistaCard({ conquista }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  // ...
  return (
    <>
      <Pressable ... />
      <Modal visible={tooltipVisible} ... /> {/* Modal montado por card */}
    </>
  );
}
```

**Por que é um problema:**
Com 50 conquistas, são 50 componentes `Modal` do React Native montados na árvore — cada um com seu overlay, animação, e container. Mesmo invisíveis (`visible={false}`), eles ocupam memória no lado nativo. No Android, cada `Modal` cria uma nova `Window`, e muitas windows simultâneas podem causar lentidão na renderização da tela inteira.

**Correção sugerida:** Usar um único `Modal` no nível da tela `ConquistasScreen`. Ao tocar em um card, setar o estado da conquista selecionada e abrir o modal compartilhado.

---

### P2-04 — Sub-componentes de resultado de simulado não memoizados ✅ Concluído

**Arquivo:** `app/(app)/simulados/[id]/resultado.tsx`

**O que acontece:**
Os componentes `ResumoCard`, `DesempenhoCard`, `ComentariosCard`, `BarRow` e `LegendDot` são funções simples sem `React.memo`. Qualquer mudança de estado no componente pai (ex: `setOpenSheet(true)` ao abrir um bottom sheet) causa re-render de todos eles.

**Por que é um problema:**
A tela de resultado é pesada — contém gráficos SVG (arc paths calculados inline), listas de questões, e blocos de comentários. Quando o aluno abre o bottom sheet para ver detalhes de uma questão, todos esses componentes são reconciliados desnecessariamente. O `DesempenhoCard` em particular calcula paths SVG em cada render (linhas 498-526), que é computação string-heavy no JS thread.

**Correção sugerida:** Envolver cada sub-componente em `React.memo`. Mover o cálculo de `arcPath` para dentro de um `useMemo`.

---

### P2-05 — Tab bar recriada a cada render ✅ Concluído

**Arquivo:** `app/(app)/_layout.tsx:10-23`

**O que acontece:**
O objeto `screenOptions` é um literal inline no JSX, e dentro dele `tabBarStyle` também é um objeto inline:

```tsx
<Tabs
  screenOptions={{
    tabBarStyle: {
      height: TAB_BAR_HEIGHT + insets.bottom,
      paddingBottom: insets.bottom,
      // ...
    },
    // ...
  }}
>
```

Todas as funções `tabBarIcon` também são arrow functions inline.

**Por que é um problema:**
A cada render do `AppLayout` (que acontece em toda navegação entre tabs), o React cria novos objetos para `screenOptions` e `tabBarStyle`. Como a referência do objeto muda, o React Native precisa comparar as props e potencialmente re-renderizar a tab bar inteira — incluindo re-invocar todas as funções `tabBarIcon`. É um custo pequeno por ocorrência, mas acontece em toda navegação.

**Correção sugerida:** Extrair `screenOptions` para um `useMemo` que dependa apenas de `insets.bottom`.

---

### P2-06 — Callbacks inline em tela de curso ✅ Concluído

**Arquivo:** `app/(app)/cursos/[id].tsx`

**O que acontece:**
Múltiplos handlers são definidos inline no JSX:

```tsx
// linha 505-508
onSelecionarAula={(aula) => {
  setAulaSelecionada(aula);
  registrarVisualizacaoAula(aula.id);
}}
```

Também em linhas 353, 441, 469, entre outros.

**Por que é um problema:**
Quando uma arrow function é definida inline, ela é recriada a cada render do pai. Componentes filhos que recebem essa função como prop (ex: `ModalAulas`) consideram que a prop mudou e se re-renderizam — mesmo que a lógica seja idêntica. Em uma tela com vídeo rodando, bottom sheet, e lista de aulas, cada re-render desnecessário compete com o decode de vídeo pelo JS thread.

Além disso, `handleVideoEnded` (linha 290) depende de `toggleConteudo`, que depende de `statusAulas`. Qualquer atualização de status recria `handleVideoEnded`, que é passado ao `VideoPlayer`, cujo `useEffect` re-executa e substitui o listener de `statusChange` — causando uma cascata de side effects.

**Correção sugerida:** Envolver handlers em `useCallback` com dependências explícitas.

---

### P2-07 — Ranking carrega 100 itens sem paginação ✅ Concluído

**Arquivo:** `app/(app)/ranking.tsx:112`

**O que acontece:**
```tsx
const dados = await obterRanking({ tipo: tipoSelecionado, limit: 100 });
```

Todos os 100 itens do ranking são carregados em uma única requisição.

**Por que é um problema:**
O payload de 100 alunos (com nome, avatar URL, pontuação) é transferido inteiro na primeira carga. Em rede 3G, um payload de 100 objetos pode levar 1-2 segundos. Além disso, o `FlatList` precisa renderizar o layout de todos os 100 itens antes de exibir o primeiro frame. O aluno vê um spinner por mais tempo que o necessário — bastaria carregar os primeiros 20 e os demais sob demanda.

**Correção sugerida:** Implementar `onEndReached` no `FlatList` com paginação de 20 itens por vez.

---

### P2-08 — Recarregamento silencioso em toda troca de tab ✅ Concluído

**Arquivos:**
- `app/(app)/trilhas.tsx:118-124`
- `app/(app)/ranking.tsx:139-145`
- `app/(app)/cursos.tsx:123-129`
- `app/(app)/conquistas.tsx:200-206`
- `app/(app)/dashboard.tsx` (com debounce de 2s)

**O que acontece:**
Cada tela usa `useFocusEffect` para recarregar dados silenciosamente quando ganha foco:

```tsx
useFocusEffect(
  useCallback(() => {
    recarregarSilencioso();
  }, [recarregarSilencioso])
);
```

**Por que é um problema:**
Ao navegar entre tabs, cada tab dispara um fetch ao backend. Se o aluno alterna rapidamente entre 4 tabs, são 4 requests simultâneos. A maioria é desnecessária — os dados raramente mudam em poucos segundos. Isso consome banda, bateria, e causa micro-stutters na UI enquanto o JSON é parseado. O dashboard tem um debounce de 2 segundos, mas as demais telas não.

**Correção sugerida:** Implementar um mecanismo de stale-while-revalidate: se os dados foram carregados há menos de 30 segundos, não refazer o fetch. Ou usar uma solução como `react-query`/`swr` com `staleTime`.

---

### P3-01 — `setTimeout` sem cleanup (risco de setState após unmount) ✅ Concluído

**Arquivos:**
- `app/(app)/cursos/[id].tsx:285-289` — 3 segundos para avançar vídeo
- `app/(app)/simulados/[id]/resolver.tsx:269-272` — scroll após navegação
- `app/(app)/trilhas/[id]/caminhos/[caminhoId].tsx:340` — delay artificial de 300ms

**O que acontece:**
```tsx
setTimeout(() => {
  if (indiceVideoAtual < totalVideos - 1) {
    avancar(); // pode chamar setState
  }
}, 3000);
```

O timer não é armazenado em ref e não tem cleanup no unmount.

**Por que é um problema:**
Se o componente desmonta antes do timer disparar (ex: o aluno volta para a tela anterior), o callback executa e tenta atualizar estado de um componente inexistente. No React 18+, isso não causa crash, mas gera warnings no console e executa lógica desnecessária. Em casos mais graves, pode causar navegação inesperada.

**Correção sugerida:** Salvar o timer em um `useRef` e limpar com `clearTimeout` no cleanup do `useEffect`.

---

### P3-02 — `Dimensions.get('window')` no nível do módulo ✅ Concluído

**Arquivos:**
- `app/(app)/cursos/[id].tsx:36`
- `app/(app)/trilhas/[id]/caminhos/[caminhoId].tsx:28`

**O que acontece:**
```tsx
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
```

Definido fora do componente, no nível do módulo.

**Por que é um problema:**
O valor é capturado uma única vez no momento do import. Se o dispositivo rotaciona ou o app entra em modo split-screen, as dimensões ficam desatualizadas. Layouts que dependem dessas constantes ficam quebrados até o app ser reiniciado.

**Correção sugerida:** Usar `useWindowDimensions()` dentro do componente.

**Reavaliação:** Não é um problema real. O `Dimensions.get('window')` no escopo do módulo roda uma única vez durante o import — leitura síncrona de valor já computado pelo React Native, sem custo mensurável. Seria problemático apenas se o app precisasse reagir dinamicamente a rotação de tela, o que não é o caso. Converter para `useWindowDimensions()` não traria ganho perceptível.

---

### P3-03 — `onSessionLoaded` inline no root layout ✅ Concluído

**Arquivo:** `app/_layout.tsx:99`

**O que acontece:**
```tsx
<Bootstrap onSessionLoaded={() => setSessionReady(true)} />
```

Arrow function inline recriada a cada render do `RootLayout`.

**Por que é um problema:**
O componente `Bootstrap` tem um `useEffect` que depende de `onSessionLoaded`. Se a referência da função muda (o que acontece a cada render do pai), o effect re-executa. Embora `hasLoaded.current` proteja contra execução duplicada, a re-execução do effect em si é desnecessária.

**Correção sugerida:** Envolver em `useCallback`: `const onSessionLoaded = useCallback(() => setSessionReady(true), [])`.

---

### P3-04 — `useEffect` vazio ✅ Concluído

**Arquivo:** `app/(app)/trilhas/[id]/caminhos/[caminhoId].tsx:379-381`

**O que acontece:**
```tsx
useEffect(() => {
  // Atualização silenciosa do estado
}, [data, blocosEmRefazer]);
```

O effect tem um comentário mas nenhum código executável.

**Por que é um problema:**
Um effect vazio ainda é registrado pelo React e executado a cada mudança de dependência. Embora o custo seja mínimo, é código morto que confunde quem lê e polui a lista de effects no React DevTools.

**Correção sugerida:** Remover o `useEffect` inteiro.

---

### P3-05 — Estado `isPlaying` dessincronizado no PaginaVideo ✅ Concluído

**Arquivo:** `components/video/PaginaVideo.tsx:23`

**O que acontece:**
O estado `isPlaying` é controlado manualmente via `setIsPlaying` nos botões de play/pause, mas nunca é atualizado pelo evento `statusChange` do player nativo.

**Por que é um problema:**
Se o vídeo é pausado por um evento externo (ex: interrupção de áudio, fim do vídeo), o estado `isPlaying` permanece `true` e o ícone mostra "pause" quando deveria mostrar "play". O aluno precisa tocar duas vezes para retomar — uma para sincronizar o estado, outra para efetivamente dar play.

**Correção sugerida:** Atualizar `isPlaying` dentro do listener de `statusChange` baseado no status real do player.

---

### P3-06 — `getInterFont()` chamada dentro de `StyleSheet.create` ✅ Concluído

**Arquivos:** `app/(app)/cursos/[id].tsx:541-735` e vários outros.

**O que acontece:**
```tsx
const styles = StyleSheet.create({
  titulo: {
    fontFamily: getInterFont('700'), // chamada de função
  },
});
```

São 12+ chamadas por arquivo em média.

**Por que é um problema:**
`StyleSheet.create` é executado uma única vez (na importação do módulo), então o custo em runtime é desprezível. No entanto, a indireção torna o código mais difícil de auditar — não é imediatamente claro qual string está sendo usada. Substituir por literals (`'Inter-Bold'`) é mais direto e elimina a chamada de função na inicialização do módulo.

**Correção sugerida:** Impacto mínimo. Pode ser substituído por literals se houver refatoração no arquivo.

**Reavaliação:** Não é um problema real. O `getInterFont()` é função pura com lógica trivial (3 comparações) chamada dentro de `StyleSheet.create()`, que executa apenas uma vez no import. O resultado fica armazenado no objeto estático de estilos — não há recálculo a cada render. Converter para constantes pré-computadas não traria ganho perceptível e adicionaria complexidade desnecessária.

---

### P3-07 — CachedImage sem limite de retries para token Firebase ✅ Concluído

**Arquivo:** `components/CachedImage.tsx:52-69`

**O que acontece:**
Quando uma imagem retorna 403, o `CachedImage` chama `renewToken()` para obter uma nova URL. Se a nova URL também retornar 403, o ciclo se repete indefinidamente.

**Por que é um problema:**
Em uma tela com 20 imagens cujo token está permanentemente expirado (ex: imagem deletada do Firebase Storage), o componente pode disparar 20+ requests ao endpoint `/image-proxy` em loop. Isso sobrecarrega o servidor e o JS thread com requests inúteis.

**Correção sugerida:** Adicionar um contador de tentativas (`retryCount` via `useRef`) e limitar a 1-2 retries por imagem.

---

### P3-08 — Callbacks não estabilizados passados para efeitos de vídeo/áudio ✅ Concluído

**Arquivos:**
- `components/video/PaginaVideo.tsx:59` — `onMarcarConcluida` no `useEffect`
- `components/curso/VideoPlayer.tsx:62` — `onEnded` e `onError` no `useEffect`
- `components/leitura/AudioPlayerMobile.tsx:70` — `onEnded` no `useEffect`

**O que acontece:**
Callbacks recebidos via props são usados como dependências de `useEffect`:

```tsx
useEffect(() => {
  const sub = player.addListener('statusChange', ...);
  return () => sub.remove();
}, [player, onMarcarConcluida, isLoading]); // callback instável
```

**Por que é um problema:**
Se o componente pai não envolver o callback em `useCallback`, a referência muda a cada render do pai. Isso causa o `useEffect` remover e re-adicionar o listener de status a cada render — interrompendo brevemente o monitoramento do player. Em cenário extremo (pai re-renderiza frequentemente), eventos de status podem ser perdidos.

**Correção sugerida:** Os componentes pais devem estabilizar callbacks com `useCallback`. Os componentes de vídeo/áudio podem adicionar uma ref intermediária para o callback, evitando incluí-lo nas dependências do effect.

---

## 2. Matriz de priorização

| ID | Problema | Esforço | Impacto | Prioridade | Status |
|----|----------|---------|---------|------------|--------|
| **P0-01** | `useMemo` condicional no QuestaoPlayer | Baixo | Crash | **Imediata** | ✅ Concluído |
| **P1-01** | AudioPlayer polling 100ms (10 re-renders/s) | Baixo | Alto | **Alta** | ✅ Concluído |
| **P1-02** | AsyncStorage sequencial em loops | Médio | Alto | **Alta** | ✅ Concluído |
| **P1-05** | O(n²) no resultado de simulado | Baixo | Alto | **Alta** | ✅ Concluído |
| **P1-07** | Waterfall de filtros em questões | Baixo | Alto | **Alta** | ✅ Concluído (não é problema real) |
| **P1-06** | FlatList sem otimização em questões | Baixo | Médio | **Alta** | ✅ Concluído (não é problema real) |
| **P1-08** | console.log/error em produção | Baixo | Médio | **Alta** | ✅ Concluído |
| **P1-03** | getAllKeys() scan no AsyncStorage | Médio | Médio | **Média** | ✅ Concluído |
| **P1-04** | Polling bloqueante de 14.4s no resolver | Médio | Médio | **Média** | ✅ Concluído |
| **P2-01** | ProgressHeader re-render a cada keystroke | Baixo | Médio | **Média** | ✅ Concluído |
| **P2-02** | ScrollView + .map() nas conquistas | Baixo | Médio | **Média** | ✅ Concluído |
| **P2-03** | 50+ modais simultâneos nas conquistas | Médio | Médio | **Média** | ✅ Concluído |
| **P2-07** | Ranking sem paginação (100 itens) | Baixo | Médio | **Média** | ✅ Concluído |
| **P2-08** | Recarregamento silencioso em toda troca de tab | Médio | Médio | **Média** | ✅ Concluído |
| **P2-04** | Sub-componentes de resultado não memoizados | Baixo | Baixo | **Média** | ✅ Concluído |
| **P2-05** | Tab bar recriada a cada render | Baixo | Baixo | **Baixa** | ✅ Concluído |
| **P2-06** | Callbacks inline em cursos/[id] | Baixo | Baixo | **Baixa** | ✅ Concluído |
| **P3-01** | setTimeout sem cleanup | Baixo | Baixo | **Baixa** | ✅ Concluído |
| **P3-02** | Dimensions.get no nível do módulo | Baixo | Baixo | **Baixa** | ✅ Concluído (não é problema real) |
| **P3-03** | onSessionLoaded inline no root layout | Baixo | Baixo | **Baixa** | ✅ Concluído |
| **P3-04** | useEffect vazio | Baixo | Nenhum | **Baixa** | ✅ Concluído |
| **P3-05** | isPlaying dessincronizado no PaginaVideo | Baixo | Baixo | **Baixa** | ✅ Concluído |
| **P3-06** | getInterFont() em StyleSheet.create | Baixo | Nenhum | **Baixa** | ✅ Concluído (não é problema real) |
| **P3-07** | CachedImage sem limite de retries | Baixo | Baixo | **Baixa** | ✅ Concluído |
| **P3-08** | Callbacks não estabilizados em vídeo/áudio | Baixo | Baixo | **Baixa** | ✅ Concluído |

### Legenda

- **Esforço Baixo:** Alteração localizada em 1-2 arquivos, menos de 30 minutos
- **Esforço Médio:** Alteração em múltiplos arquivos ou refatoração de lógica, 1-3 horas
- **Impacto Alto:** Perceptível pelo usuário em uso normal (lag, travamento, delay)
- **Impacto Médio:** Perceptível em cenários específicos (listas grandes, rede lenta, dispositivo fraco)
- **Impacto Baixo:** Melhoria técnica sem efeito perceptível imediato
