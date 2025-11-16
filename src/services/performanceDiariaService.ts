// src/services/performanceDiariaService.ts

import { api } from '../lib/api';

export interface PerformanceDiariaDia {
  data: string; // formato: YYYY-MM-DD
  taxaAcertos: number; // 0-100
  totalQuestoes: number;
  acertos: number;
  erros: number;
}

export interface PerformanceDiariaData {
  desempenhoDiario: PerformanceDiariaDia[];
}

export interface PerformanceDiariaParams {
  materiaId?: string;
  dias?: '7' | '14' | '30' | 'all';
}

/**
 * Busca dados de desempenho diário do aluno
 */
export async function obterPerformanceDiaria(
  params: PerformanceDiariaParams = {}
): Promise<PerformanceDiariaData> {
  const queryParams = new URLSearchParams();
  
  if (params.materiaId) {
    queryParams.set('materiaId', params.materiaId);
  }
  
  if (params.dias) {
    queryParams.set('dias', params.dias);
  }

  const url = `/mobile/v1/performance/diario${queryParams.toString() ? `?${queryParams}` : ''}`;
  
  const response = await api.get<PerformanceDiariaData>(url);
  return response.data;
}