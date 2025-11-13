export type QuestaoBase = {
  id?: string;
  tipo: string;
  enunciado?: string;
  alternativas?: string[] | null;
  conteudo?: any;
  blocoRapido?: any;
  imagensAlternativas?: string[] | null;
};

export function parseConteudo(raw: any) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { html: raw };
    }
  }
  return raw;
}

export function sanitizeInlineHtml(raw: string): string {
  return raw
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAlternativas(
  questao: QuestaoBase
): string[] {
  if (
    Array.isArray(questao.alternativas) &&
    questao.alternativas.length > 0
  ) {
    return questao.alternativas
      .map((alt) => sanitizeInlineHtml(String(alt ?? "")))
      .filter((alt) => alt.length > 0);
  }

  if (questao.tipo === "certa_errada") {
    return ["Certo", "Errado"];
  }

  const conteudo = parseConteudo(questao.conteudo);

  if (questao.tipo === "selecao_multipla") {
    const alternativas = Array.isArray(conteudo?.alternativas)
      ? conteudo?.alternativas
      : [];
    return alternativas
      .map((alt: any) => {
        if (!alt) return null;
        const value =
          typeof alt === "string"
            ? alt
            : alt.texto ?? alt.label ?? alt.descricao ?? null;
        return typeof value === "string" ? sanitizeInlineHtml(value) : null;
      })
      .filter(
        (alt: string | null | undefined): alt is string =>
          typeof alt === "string" && alt.trim().length > 0
      );
  }

  if (questao.tipo === "completar" && Array.isArray(conteudo?.frases)) {
    return conteudo.frases
      .map((frase: any) => frase?.correta ?? "")
      .filter((alt: string) => alt);
  }

  if (
    questao.tipo === "completar_topo" &&
    Array.isArray(conteudo?.lacunas)
  ) {
    return conteudo.lacunas
      .map(
        (lacuna: any) => lacuna?.resposta ?? lacuna?.texto ?? ""
      )
      .filter((alt: string) => alt);
  }

  if (questao.tipo === "bloco_rapido") {
    const itens = Array.isArray(questao.blocoRapido)
      ? questao.blocoRapido
      : typeof questao.blocoRapido === "string"
      ? (() => {
          try {
            return JSON.parse(questao.blocoRapido);
          } catch {
            return [];
          }
        })()
      : [];
    return itens
      .map((item: any, idx: number) => {
        const pergunta = item?.pergunta ?? item?.texto ?? "";
        return pergunta ? `${idx + 1}. ${pergunta}` : null;
      })
      .filter(
        (alt: unknown): alt is string => typeof alt === "string"
      );
  }

  return [];
}

