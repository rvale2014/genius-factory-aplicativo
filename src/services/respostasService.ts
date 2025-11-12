// src/services/respostasService.ts
import { api } from "@/src/lib/api";
import { isAxiosError } from "axios";

// Todas retornam { acertou?: boolean, ... } (varia por tipo)
export async function corrigirSelecaoMultipla(questaoId: string, selecionadas: string[]) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/selecao-multipla", {
    questaoId,
    resposta: { selecionadas },
  });
  return data as { acertou: boolean; resultadoCorrecao: { porItem: Record<string, string>, corretas: string[] } };
}

export async function corrigirMultiplaEscolhaOuCertaErrada(questaoId: string, letra: string) {
  // ✅ CORREÇÃO: Enviar apenas a letra como string, não como objeto
  const payload = {
    questaoId,
    resposta: letra, // ← Mudou aqui: de { letra } para letra
  };

  try {
    const { data } = await api.post("/mobile/v1/qbank/respostas/multipla-escolha", payload);
    return data as { acertou: boolean; alternativaCorreta?: string };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      const { data } = await api.post("/mobile/v1/qbank/respostas/objetiva-curta", {
        questaoId,
        resposta: letra,
      });
      return data as { acertou: boolean; alternativaCorreta?: string };
    }
    throw error;
  }
}

export async function corrigirObjetivaCurta(questaoId: string, resposta: string) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/objetiva-curta", {
    questaoId,
    resposta,
  });
  return data as { acertou: boolean };
}

export async function corrigirDissertativa(questaoId: string, respostaAluno: string) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/dissertativa", {
    questaoId,
    respostaAluno,
  });
  return data as { nota: number; justificativa: string; sugestao?: string | null; acertou: boolean };
}

export async function corrigirBlocoRapido(questaoId: string, respostas: string[]) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/bloco-rapido", {
    questaoId, respostas
  });
  return data as { acertou: boolean; feedbacks: boolean[] };
}

export async function corrigirLigarColunas(questaoId: string, respostasAluno: Record<string, any>) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/ligar-colunas", {
    questaoId, respostasAluno
  });
  return data as { acertou: boolean; feedbacks: Record<string, boolean>; corretas: Record<string, number> };
}

export async function corrigirCompletar(questaoId: string, respostas: string[]) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/completar", {
    questaoId, respostas
  });
  return data as { acertou: boolean; resultadoCorrecao: { porLacuna: Record<string, boolean>, itens: ('correta'|'incorreta')[] } };
}

export async function corrigirCompletarTopo(
  questaoId: string,
  respostasAluno: Array<{ lacunaId: string; valor: string }>
) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/completar-topo", {
    questaoId, respostasAluno
  });
  return data as { acertou: boolean; resultadoCorrecao: { porLacuna: Record<string, boolean> } };
}

export async function corrigirTabela(questaoId: string, resposta: any) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/tabela", { questaoId, resposta });
  return data as { acertou: boolean };
}

export async function corrigirColorirFigura(questaoId: string, partesMarcadas: string[]) {
  const { data } = await api.post("/mobile/v1/qbank/respostas/colorir-figura", {
    questaoId, resposta: { partesMarcadas }
  });
  return data as { acertou: boolean };
}