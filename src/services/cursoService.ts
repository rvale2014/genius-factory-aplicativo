// src/services/cursoService.ts

import type {
  ConcluirConteudoResponse,
  CursoDetalhesResponse,
  StatusAula,
} from '../../types/curso';
import { api } from '../lib/api';

/**
 * Busca detalhes completos do curso (aulas, status, avaliações)
 * Usa rota otimizada para mobile
 */
export async function obterDetalhesCurso(
  cursoId: string
): Promise<CursoDetalhesResponse> {
  const response = await api.get(`/mobile/v1/cursos/${cursoId}/detalhes`);
  return response.data;
}

/**
 * Marca conteúdo como concluído
 * Usa rota otimizada para mobile
 */
export async function concluirConteudo(
  conteudoId: string,
  aulaId: string
): Promise<ConcluirConteudoResponse> {
  const response = await api.post(`/mobile/v1/cursos/conteudos/${conteudoId}/concluir`, {
    aulaId,
  });
  return response.data;
}

/**
 * Desmarca conteúdo como concluído
 * Usa rota otimizada para mobile
 */
export async function desconcluirConteudo(
  conteudoId: string,
  aulaId: string
): Promise<{ ok: boolean; statusAula: StatusAula }> {
  const response = await api.delete(
    `/mobile/v1/cursos/conteudos/${conteudoId}/concluir?aulaId=${encodeURIComponent(aulaId)}`
  );
  return response.data;
}

/**
 * Avalia uma aula (rating de 1-5)
 * Usa rota otimizada para mobile
 */
export async function avaliarAula(
  aulaId: string,
  rating: number
): Promise<{ success: boolean }> {
  const response = await api.put('/mobile/v1/cursos/aulas/rating', {
    aulaId,
    rating,
  });
  return response.data;
}

/**
 * Busca a avaliação do aluno para uma aula
 * Usa rota otimizada para mobile
 */
export async function obterAvaliacaoAula(
  aulaId: string
): Promise<{ rating: number }> {
  const response = await api.get(`/mobile/v1/cursos/aulas/rating?aulaId=${aulaId}`);
  return response.data;
}

/**
 * Registra visualização da aula (analytics)
 * Usa rota otimizada para mobile
 */
export async function registrarVisualizacaoAula(
  aulaId: string
): Promise<void> {
  try {
    await api.post('/mobile/v1/cursos/aulas/visualizar', { aulaId });
  } catch (error) {
    console.warn('Erro ao registrar visualização:', error);
  }
}














