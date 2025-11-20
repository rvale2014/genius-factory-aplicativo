// src/services/simuladosExecService.ts
import { api } from "@/src/lib/api";

export async function getSimuladoParaResolver(id: string) {
  // 1) inicia (idempotente)
  await api.post(`/mobile/v1/qbank/simulados/${id}/iniciar`, {});
  // 2) obtém o payload completo com as questões
  const { data } = await api.get(`/mobile/v1/qbank/simulados/${id}`);
  return data; // <- aqui volta o objeto com questoes[], tempoMinutos, etc.
}

export async function responderSimulado(id: string, respostas: Record<string, string>) {
  await api.post(`/mobile/v1/qbank/simulados/${id}/responder`, { respostas });
}

export async function avaliarPendentes(id: string) {
  const { data } = await api.post(`/mobile/v1/qbank/simulados/${id}/avaliar-pendentes`, {});
  return data as { processadas: number; restantes: number; percentualFinal?: number; conquistasDesbloqueadas?: any[] };
}

export async function pausarSimulado(
  id: string,
  tempoGastoEmSegundos: number,
  respostasPorQuestao: Record<string, string>,
  ultimaQuestaoIndex: number
) {
  await api.post(`/mobile/v1/qbank/simulados/${id}/pausar`, {
    tempoGastoEmSegundos,
    respostasPorQuestao,
    ultimaQuestaoIndex,
  });
}
