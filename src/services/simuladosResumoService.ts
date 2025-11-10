// src/services/simuladosResumoService.ts
import { api } from "@/src/lib/api";

export type DistribuicaoMateria = { materiaId: string; nome: string; quantidade: number };
export type SimuladoResumoMobile = {
  id: string;
  titulo: string;
  tempoMinutos: number;
  totalQuestoes: number;
  distribuicao: DistribuicaoMateria[];
  status: "nao_iniciado" | "em_andamento" | "finalizado";
  podePausar: boolean;
  apenasUmaTentativa: boolean;
};

export async function obterSimuladoResumo(simuladoId: string) {
  const { data } = await api.get<SimuladoResumoMobile>(`/mobile/v1/qbank/simulados/${simuladoId}`);
  return data;
}

export async function iniciarSimulado(simuladoId: string) {
  const { data } = await api.post<{ message: string }>(
    `/mobile/v1/qbank/simulados/${simuladoId}/iniciar`,
    {}
  );
  return data;
}
