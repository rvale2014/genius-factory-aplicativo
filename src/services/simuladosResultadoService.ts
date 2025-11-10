// src/services/simuladosResultadoService.ts
import { api } from "@/src/lib/api";

export type ResultadoQuestao = {
  id: string;
  materia: string;
  tipo:
    | "multipla_escolha" | "certa_errada" | "objetiva_curta" | "dissertativa"
    | "bloco_rapido" | "ligar_colunas" | "completar" | "completar_topo"
    | "tabela" | "selecao_multipla" | "colorir_figura";
  acertou: boolean;
  avaliacaoStatus: "ok" | "pendente" | "erro";
  notaDissertativa: number | null;
  justificativaDissertativa: string | null;
  sugestaoDissertativa: string | null;
  ordem?: number;
  numero?: number;
};

export type ResultadoSimuladoMobile = {
  id: string;
  nome: string;
  tempoMinutos: number;
  questoes: ResultadoQuestao[];
};

export async function obterResultadoSimulado(id: string) {
  const { data } = await api.get<ResultadoSimuladoMobile>(`/mobile/v1/qbank/simulados/resultado/${id}`);
  return data;
}

export async function obterQuestaoCorrigida(simuladoId: string, questaoId: string) {
  const { data } = await api.get(`/mobile/v1/qbank/simulados/${simuladoId}/questoes/${questaoId}`);
  return data;
}

export async function refazerSimulado(simuladoId: string) {
  const { data } = await api.post<{ novoSimuladoId: string }>(`/mobile/v1/qbank/simulados/${simuladoId}/refazer`, {});
  return data;
}
