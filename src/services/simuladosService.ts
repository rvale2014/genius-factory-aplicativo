// src/services/simuladosService.ts
import { api } from "@/src/lib/api";

export type MateriaDisponivel = {
  id: string;
  nome: string;
  quantidadeDisponivel: number;
};

export type FiltrosSimulado = {
  materiaIds?: string[];
  assuntoIds?: string[];
  anoIds?: string[];            // string no mobile
  instituicaoIds?: string[];
  classeIds?: string[];
  grauIds?: string[];
  serieEscolarIds?: string[];
  excluirResolvidas?: boolean;
  excluirAcertadas?: boolean;
  excluirSomenteErradas?: boolean; // << NOVO: compatível com a UI do mobile
};

export type GerarSimuladoPayload = FiltrosSimulado & {
  nome: string;
  tempoMinutos: number;
  questoesPorMateria: { materiaId: string; quantidade: number }[];
};

// 👇 NOVOS TIPOS PARA A TELA "MEUS SIMULADOS"
export interface SimuladoItem {
  id: string;
  nome: string;
  data: string;
  status: 'NAO_INICIADO' | 'PAUSADO' | 'CONCLUIDO';
  progresso: {
    respondidas: number;
    total: number;
  };
  acertos: number;
  tempoDecorrido: string | null;
  statusExibicao: string | null;
}

export interface SimuladosResponse {
  simulados: SimuladoItem[];
  isEmpty: boolean;
}

function compact<T extends Record<string, any>>(obj: T): T {
  // remove chaves com array vazio / undefined / null
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export async function materiasDisponiveisSimulado(
  params: FiltrosSimulado,
  signal?: AbortSignal
): Promise<MateriaDisponivel[]> {
  try {
    const { data } = await api.post<MateriaDisponivel[]>(
      "/mobile/v1/qbank/simulados/materias-disponiveis",
      compact(params),
      { signal }
    );
    return data;
  } catch (err: any) {
    const msg = err?.response?.data ?? err?.message ?? "Erro ao listar matérias disponíveis";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}

export async function gerarSimulado(
  payload: GerarSimuladoPayload,
  signal?: AbortSignal
): Promise<{ mensagem: string; simulado: { id: string }; location?: string }> {
  try {
    const res = await api.post<{ mensagem: string; simulado: { id: string } }>(
      "/mobile/v1/qbank/simulados/gerar",
      compact(payload),
      { signal }
    );
    const location = (res.headers?.location as string | undefined) ?? undefined;
    return { ...res.data, location };
  } catch (err: any) {
    const msg = err?.response?.data?.error ?? err?.message ?? "Erro ao criar o simulado";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}

// 👇 NOVA FUNÇÃO PARA BUSCAR OS ÚLTIMOS SIMULADOS
export async function obterSimulados(signal?: AbortSignal): Promise<SimuladosResponse> {
  try {
    const { data } = await api.get<SimuladosResponse>(
      "/mobile/v1/qbank/simulados",
      { signal }
    );
    return data;
  } catch (err: any) {
    const msg = err?.response?.data?.error ?? err?.message ?? "Erro ao buscar simulados";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}

/** helper opcional: monta questoesPorMateria a partir de um map de quantidades */
export function mapQuantidadesToPayload(qtd: Record<string, number>) {
  return Object.entries(qtd)
    .filter(([, q]) => (q || 0) > 0)
    .map(([materiaId, quantidade]) => ({ materiaId, quantidade }));
}
