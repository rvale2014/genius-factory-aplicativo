// src/lib/feedbackCalculators.ts

/**
 * Utilitários para calcular feedbacks detalhados de questões corrigidas.
 * Estes calculadores comparam as respostas do aluno com os gabaritos/conteúdos
 * e retornam estruturas de feedback que os componentes de visualização esperam.
 */

// ========== NORMALIZAÇÃO DE STRINGS ==========
const normalizar = (s: string) =>
  (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const TRUE_SET = new Set(["v", "verdadeiro", "true", "t", "1"]);
const FALSE_SET = new Set(["f", "falso", "false", "0"]);

// ========== BLOCO RÁPIDO ==========
type ItemBlocoRapido = {
  pergunta: string;
  imagem?: string;
  imagemUrl?: string;
  respostasAceitas: string[];
};

export function calcularFeedbackBlocoRapido(
  blocoRapido: ItemBlocoRapido[],
  respostasAluno: string[]
): boolean[] {
  if (!Array.isArray(blocoRapido)) return [];

  return blocoRapido.map((item, index) => {
    const respostaAluno = normalizar(respostasAluno[index] || "");
    if (!respostaAluno) return false;

    const aceitas = (item.respostasAceitas ?? []).map(normalizar);
    if (aceitas.length === 0) return false;

    // Se é questão V/F
    const todosTrue = aceitas.every((v) => TRUE_SET.has(v));
    const todosFalse = aceitas.every((v) => FALSE_SET.has(v));

    if (todosTrue || todosFalse) {
      // Para V/F, aceita apenas 'v' ou 'f'
      const ehV = respostaAluno === "v";
      const ehF = respostaAluno === "f";
      if (!ehV && !ehF) return false;
      return aceitas.includes(respostaAluno);
    }

    // Para texto livre, verifica se está na lista de aceitas
    return aceitas.includes(respostaAluno);
  });
}

// ========== LIGAR COLUNAS ==========
type ItemLigarColunas = {
  ladoA: string;
  imagemA?: string | null;
  ladoB: string;
  imagemB?: string | null;
};

export function calcularFeedbackLigarColunas(
  ligarColunas: ItemLigarColunas[],
  respostasAluno: { [key: string]: string }
) {
  if (!Array.isArray(ligarColunas)) {
    return { feedbacks: {}, corretas: {} };
  }

  const feedbacks: { [key: string]: boolean } = {};
  const corretas: { [key: string]: number } = {};

  // A coluna B é embaralhada, então o índice da resposta correta
  // é o índice original do item na lista não-embaralhada
  ligarColunas.forEach((item, indexOriginal) => {
    const colunaB = respostasAluno["_colunaB"]
      ? JSON.parse(respostasAluno["_colunaB"])
      : [...ligarColunas].sort(() => Math.random() - 0.5);

    colunaB.forEach((itemB: ItemLigarColunas, indexB: number) => {
      const keyB = String(indexB);
      const respostaAluno = respostasAluno[keyB];

      // Encontra qual item da coluna A corresponde a este item B
      const indexCorretoA = ligarColunas.findIndex(
        (itemA) =>
          itemA.ladoA === itemB.ladoA &&
          itemA.ladoB === itemB.ladoB &&
          itemA.imagemA === itemB.imagemA &&
          itemA.imagemB === itemB.imagemB
      );

      corretas[keyB] = indexCorretoA + 1; // +1 porque mostra de 1 a N

      if (respostaAluno) {
        const respostaNum = parseInt(respostaAluno, 10);
        feedbacks[keyB] = respostaNum === indexCorretoA + 1;
      }
    });
  });

  return { feedbacks, corretas };
}

// ========== SELEÇÃO MÚLTIPLA ==========
export function extrairCorretasSelecaoMultipla(conteudo: any, questaoId?: string): string[] {
  if (!conteudo) return [];

  // ✅ CASO 1: Se já existe um array "corretas" no conteúdo, usa ele direto
  if (Array.isArray(conteudo.corretas)) {
    return conteudo.corretas.map(String);
  }

  // ✅ CASO 2: Extrai das alternativas que têm propriedade "correta: true"
  const alternativas = Array.isArray(conteudo?.alternativas)
    ? conteudo.alternativas
    : [];

  return alternativas
    .map((alt: any, index: number) => {
      if (!alt) return null;

      // Gerar ID da mesma forma que em ConteudoSelecaoMultipla
      let id: string;
      if (typeof alt === "string") {
        id = questaoId ? `${questaoId}-sm-${index}` : `alt-${index}`;
      } else {
        id = String(alt?.id ?? (questaoId ? `${questaoId}-sm-${index}` : `alt-${index}`));
      }

      const correta = alt?.correta ?? false;

      return correta ? id : null;
    })
    .filter((id: string | null): id is string => !!id);
}

// ========== COMPLETAR ==========
type FraseCompletar = {
  id: string;
  textoBase: string;
  opcoes: [string, string];
  explicacao?: string | null;
  correta?: string | null;
};

export function calcularFeedbackCompletar(
  frases: FraseCompletar[],
  respostasAluno: string[]
): Array<"correta" | "incorreta" | null> {
  if (!Array.isArray(frases)) return [];

  return frases.map((frase, index) => {
    const respostaAluno = respostasAluno[index];
    if (!respostaAluno) return null;

    // ✅ Usa o campo "correta" se existir, senão usa a primeira opção (fallback)
    const correta = (frase as any).correta ?? frase.opcoes[0];
    return normalizar(respostaAluno) === normalizar(correta) ? "correta" : "incorreta";
  });
}

// ========== COMPLETAR TOPO ==========
type Lacuna = { id: string };

export function calcularFeedbackCompletarTopo(
  conteudo: any,
  respostasAluno: { respostasAluno: Array<{ lacunaId: string; valor: string }> }
): Record<string, boolean> {
  if (!conteudo) return {};

  const frases = Array.isArray(conteudo?.frases) ? conteudo.frases : [];
  const lacunas = Array.isArray(conteudo?.lacunas) ? conteudo.lacunas : [];
  const palavrasTopo = Array.isArray(conteudo?.palavrasTopo) ? conteudo.palavrasTopo : [];

  // Mapa de lacunaId -> palavra correta
  const gabarito: Record<string, string> = {};

  let lacunaCursor = 0;
  frases.forEach((texto: string) => {
    const parts = texto.split(/_{3,}/g);
    const placeholders = Math.max(parts.length - 1, 0);

    for (let i = 0; i < placeholders; i += 1) {
      const lacuna = lacunas[lacunaCursor];
      if (lacuna) {
        const lacunaId = String(lacuna?.id ?? lacunaCursor);
        const palavra = palavrasTopo[lacunaCursor];

        if (palavra && !palavra.distrator) {
          gabarito[lacunaId] = normalizar(
            typeof palavra === "string" ? palavra : palavra.texto
          );
        }
      }
      lacunaCursor += 1;
    }
  });

  // Comparar respostas
  const feedbacks: Record<string, boolean> = {};
  const respostas = Array.isArray(respostasAluno?.respostasAluno)
    ? respostasAluno.respostasAluno
    : [];

  respostas.forEach((resposta) => {
    const lacunaId = String(resposta?.lacunaId ?? "");
    const valor = normalizar(resposta?.valor ?? "");

    if (lacunaId && gabarito[lacunaId]) {
      feedbacks[lacunaId] = valor === gabarito[lacunaId];
    }
  });

  return feedbacks;
}

// ========== TABELA (CRUZADINHA) ==========
export function calcularFeedbackCruzadinha(
  conteudo: any,
  respostasAluno: { celulas: (string | null)[][] }
): { corretas: (boolean | null)[][] } {
  if (!conteudo || !respostasAluno) {
    return { corretas: [] };
  }

  const dimensao = conteudo?.dimensao ?? [0, 0];
  const linhas = dimensao[0];
  const colunas = dimensao[1];

  // Monta gabarito a partir de respostasBrancas
  const gabarito: (string | null)[][] = Array.from({ length: linhas }, () =>
    Array(colunas).fill(null)
  );

  const respostasBrancas = Array.isArray(conteudo?.respostasBrancas)
    ? conteudo.respostasBrancas
    : [];

  respostasBrancas.forEach((item: any) => {
    const linha = item?.linha;
    const coluna = item?.coluna;
    const letra = normalizar(item?.letra ?? "");

    if (
      typeof linha === "number" &&
      typeof coluna === "number" &&
      letra &&
      gabarito[linha]
    ) {
      gabarito[linha][coluna] = letra;
    }
  });

  // Adicionar preenchidasFixas ao gabarito
  const preenchidasFixas = Array.isArray(conteudo?.preenchidasFixas)
    ? conteudo.preenchidasFixas
    : [];

  preenchidasFixas.forEach((item: any) => {
    const linha = item?.linha;
    const coluna = item?.coluna;
    const letra = normalizar(item?.letra ?? "");

    if (
      typeof linha === "number" &&
      typeof coluna === "number" &&
      letra &&
      gabarito[linha]
    ) {
      gabarito[linha][coluna] = letra;
    }
  });

  // Comparar com respostas do aluno
  const corretas: (boolean | null)[][] = Array.from({ length: linhas }, () =>
    Array(colunas).fill(null)
  );

  const celulasAluno = respostasAluno?.celulas ?? [];

  for (let i = 0; i < linhas; i += 1) {
    for (let j = 0; j < colunas; j += 1) {
      const mascaraAtiva = conteudo?.mascaraAtiva?.[i]?.[j];
      if (!mascaraAtiva) continue;

      const respostaAluno = normalizar(celulasAluno[i]?.[j] ?? "");
      const respostaCorreta = gabarito[i][j];

      if (!respostaAluno) {
        corretas[i][j] = null;
      } else if (respostaCorreta) {
        corretas[i][j] = respostaAluno === respostaCorreta;
      }
    }
  }

  return { corretas };
}

// ========== TABELA (MATH TABLE) ==========
export function calcularFeedbackMathTable(
  conteudo: any,
  respostasAluno: { valores: string[] }
): { corretos: boolean[] } {
  if (!conteudo || !respostasAluno) {
    return { corretos: [] };
  }

  const tabela = conteudo?.tabela ?? [];
  const valores = respostasAluno?.valores ?? [];

  // Encontrar células null e suas respostas corretas
  const nullPositions: Array<{ i: number; j: number; valor: string | number | null }> = [];

  tabela.forEach((row: any[], i: number) => {
    row.forEach((cell: any, j: number) => {
      if (cell === null) {
        // Precisa calcular qual é a resposta correta
        // Isso depende da regra da tabela (multiplicação, adição, etc.)
        nullPositions.push({ i, j, valor: null });
      }
    });
  });

  // Por enquanto, vamos assumir que não conseguimos calcular sem a regra
  // Uma implementação completa precisaria da lógica de validação da tabela
  const corretos = valores.map(() => false);

  return { corretos };
}

// ========== COLORIR FIGURA ==========
// Para colorir figura, o feedback já vem no conteudo.partes[].correta
// Não precisa calcular, mas vamos ter uma função helper para consistência
export function extrairPartesCorretasColorir(conteudo: any): string[] {
  if (!conteudo) return [];

  const partes = Array.isArray(conteudo?.partes) ? conteudo.partes : [];

  return partes
    .filter((parte: any) => parte?.correta === true)
    .map((parte: any) => String(parte?.id ?? ""))
    .filter((id: string) => !!id);
}

export function verificarColorirCorreto(
  conteudo: any,
  respostasAluno: { partesMarcadas: string[] }
): boolean {
  const partesCorretas = new Set(extrairPartesCorretasColorir(conteudo));
  const partesMarcadas = new Set(
    Array.isArray(respostasAluno?.partesMarcadas) ? respostasAluno.partesMarcadas : []
  );

  // Verifica se marcou todas as corretas e nenhuma incorreta
  if (partesCorretas.size !== partesMarcadas.size) return false;

  for (const id of partesMarcadas) {
    if (!partesCorretas.has(id)) return false;
  }

  return true;
}