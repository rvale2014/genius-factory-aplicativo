// src/services/rankingService.ts

import { api } from '../lib/api';

export interface RankingItem {
  alunoId: string;
  nome: string;
  nickname: string | null;
  foto: string | null;
  avatarId: string | null;
  avatarImageUrl: string | null;
  avatarNome?: string;
  avatarDescricao?: string;
  geniusCoins: number;
  posicao: number;
  moedasSemana?: number;
}

export interface RankingData {
  tipo: 'geral' | 'semanal';
  ranking: RankingItem[];
  minhaPosicao: {
    posicao: number;
    geniusCoins: number;
    moedasSemana?: number;
  } | null;
}

export interface RankingParams {
  tipo?: 'geral' | 'semanal';
  limit?: number;
}

/**
 * Busca ranking de alunos
 */
export async function obterRanking(params: RankingParams = {}): Promise<RankingData> {
  const queryParams = new URLSearchParams();
  
  if (params.tipo) {
    queryParams.set('tipo', params.tipo);
  }
  
  if (params.limit) {
    queryParams.set('limit', params.limit.toString());
  }

  const url = `/mobile/v1/ranking${queryParams.toString() ? `?${queryParams}` : ''}`;
  
  const response = await api.get<RankingData>(url);
  return response.data;
}