// src/services/performanceService.ts

import { api } from '../lib/api';

export interface PerformanceData {
  nome: string;
  avatarUrl: string | null;
  geniusCoins: number;
  posicaoGlobal: number;
  desempenho: {
    taxaAcertos: number; // 0-100
    totalQuestoes: number;
    totalAcertos: number;
    totalErros: number;
    acimaDaMedia: boolean;
    deltaPct: number;
    mediaPlataforma: number; // 0-100
  };
  streak: {
    diasSeguidosAtual: number;
    maiorSequencia: number;
  };
  porMateria: Array<{
    materiaId: string;
    materiaNome: string;
    taxaAcertos: number;
    totalQuestoes: number;
    acertos: number;
    erros: number;
  }>;
}

export interface PerformanceParams {
  materiaId?: string;
  dias?: '7' | '14' | '30' | 'all';
}

/**
 * Busca dados de performance do aluno
 */
export async function obterPerformance(
  params: PerformanceParams = {}
): Promise<PerformanceData> {
  const queryParams = new URLSearchParams();
  
  if (params.materiaId) {
    queryParams.set('materiaId', params.materiaId);
  }
  
  if (params.dias) {
    queryParams.set('dias', params.dias);
  }

  const url = `/mobile/v1/performance${queryParams.toString() ? `?${queryParams}` : ''}`;
  
  const response = await api.get<PerformanceData>(url);
  return response.data;
}

/**
 * Invalida o cache de performance (forçando reload)
 */
export async function invalidarCachePerformance(): Promise<void> {
  // Aqui você pode implementar lógica de invalidação de cache se necessário
  // Por enquanto, apenas retorna void
}