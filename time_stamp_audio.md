# Evolução Futura: Cursor de acompanhamento de texto sincronizado com áudio

## Contexto

Nas atividades de leitura (`PaginaLeitura`), o aluno pode ouvir um áudio narrado enquanto lê o texto. Atualmente, áudio e texto são independentes — não há indicação visual de qual trecho está sendo narrado.

A proposta é destacar o trecho do texto correspondente à posição atual do áudio, criando uma experiência de "karaokê" que facilita o acompanhamento da leitura.

## Como funciona

### 1. Gerar timestamps por trecho

O arquivo de áudio é enviado a um serviço de Speech-to-Text que retorna a transcrição com timestamps por segmento (frase ou grupo de palavras):

```json
{
  "segments": [
    { "start": 0.0, "end": 3.2, "text": "O sistema solar é composto por oito planetas." },
    { "start": 3.4, "end": 7.1, "text": "O maior deles é Júpiter." }
  ]
}
```

### 2. Serviços de transcrição com word-level timestamps

| Serviço | Modelo | Custo | Observação |
|---------|--------|-------|------------|
| OpenAI Whisper | Open-source | Gratuito (self-hosted) | Pode rodar no servidor da aplicação |
| OpenAI Whisper API | Cloud | ~$0.006/min | Mais simples, sem infra própria |
| Google Cloud Speech-to-Text | Cloud | ~$0.006-0.009/min | Boa precisão em português |
| AWS Transcribe | Cloud | ~$0.024/min | Integração com ecossistema AWS |
| Deepgram | Cloud | ~$0.005/min | API rápida, boa para batch |

### 3. Alinhamento transcrição ↔ texto original

O texto narrado pode ter pequenas diferenças em relação ao HTML da atividade (pontuação, palavras omitidas, variações). É necessário um passo de **alinhamento fuzzy** para mapear cada segmento da transcrição ao trecho correspondente no texto original.

Abordagens possíveis:
- **Distância de Levenshtein** por frase — comparar cada segmento transcrito com as frases do HTML e associar ao match mais próximo
- **Alinhamento por sequência (diff)** — algoritmos como Smith-Waterman adaptados para texto
- **Revisão manual** — para acervo pequeno, validar/ajustar os timestamps manualmente

### 4. Armazenamento

Novo campo no modelo de dados da atividade de leitura:

```json
{
  "audioUrl": "https://...",
  "audioTimestamps": [
    { "start": 0.0, "end": 3.2, "fragmentoIndex": 0 },
    { "start": 3.4, "end": 7.1, "fragmentoIndex": 1 }
  ]
}
```

### 5. Frontend

- `AudioPlayerMobile` já expõe `position` (posição atual do áudio em ms)
- Elevar `position` para `PaginaLeitura` via callback ou state lifting
- Com base em `position` e `audioTimestamps`, determinar qual trecho está ativo
- Aplicar estilo de highlight (ex: background amarelo) no trecho ativo
- Auto-scroll com `ScrollView.scrollTo` para manter o trecho ativo visível na tela

## Pipeline resumido

```
Áudio (.mp3/.wav)
    │
    ▼
Speech-to-Text (Whisper / Google STT)
    │
    ▼
Transcrição com timestamps por segmento
    │
    ▼
Alinhamento fuzzy com texto original (HTML)
    │
    ▼
audioTimestamps salvo no banco (campo da atividade)
    │
    ▼
Frontend: highlight + auto-scroll sincronizado com posição do áudio
```

## Estimativa de esforço

| Etapa | Esforço |
|-------|---------|
| Pipeline de transcrição (backend) | 2-3 dias |
| Alinhamento fuzzy + revisão | 1-2 dias |
| Novo campo no modelo de dados + API | 0.5 dia |
| Frontend (highlight + scroll) | 1-2 dias |
| **Total** | **~5-7 dias** |

## Decisão pendente

Antes de iniciar, definir:
1. **Qual serviço de transcrição usar** — Whisper self-hosted (gratuito, mais infra) vs API paga (simples, custo por minuto)
2. **Granularidade** — highlight por frase (mais simples) ou por palavra (mais preciso, mais complexo)
3. **Escopo inicial** — aplicar em todas as atividades de leitura com áudio ou começar por um subset
