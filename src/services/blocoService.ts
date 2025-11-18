// src/services/blocoService.ts

import { api } from '@/src/lib/api'

export type BlocoAtividade = {
  id: string
  titulo: string
  tipo: 'leitura' | 'video' | 'questoes' | 'simulado'
  ordem: number
  conteudoTexto?: string | null
  videoUrl?: string | null
  questaoIds?: string[]
  progresso: {
    concluido: boolean
    tentativas: number
    acertos: number
    notaPercentual: number | null
  }
}

export type BlocoResponse = {
  id: string
  titulo: string
  ordem: number
  atividades: BlocoAtividade[]
  respostas: Record<string, {
    resposta: any
    acertou: boolean | null
    notaDissertativa: number | null
    tentativa: number | null
  }>
  caminho: {
    id: string
    nome: string
    ordem: number
    trilhaId: string
  }
  trilha: {
    id: string
    nome: string
    materiaNome: string | null
  }
}

/**
 * Busca dados completos do bloco (atividades + progresso + respostas)
 */
export async function obterBloco(
  trilhaId: string,
  caminhoId: string,
  blocoId: string
): Promise<BlocoResponse> {
  try {
    const response = await api.get(`/mobile/v1/blocos/${blocoId}`)
    return response.data
  } catch (error: any) {
    console.error('[obterBloco] Erro:', error)
    throw new Error(
      error?.response?.data?.error || 'Erro ao carregar dados do bloco'
    )
  }
}

/**
 * Marca o bloco como concluído e retorna conquistas desbloqueadas
 */
export async function concluirBloco(blocoId: string): Promise<{
  ok: boolean
  novasConquistas: Array<{
    nome: string
    titulo: string
    nivel: number
    categoria: string
    imagemUrl: string
  }>
}> {
  try {
    const response = await api.post(`/mobile/v1/blocos/${blocoId}/concluir`)
    return response.data
  } catch (error: any) {
    console.error('[concluirBloco] Erro:', error)
    throw new Error(
      error?.response?.data?.error || 'Erro ao concluir bloco'
    )
  }
}

/**
 * Busca todas as questões em lote (otimizado)
 */
export async function buscarQuestoesLote(questaoIds: string[]): Promise<any[]> {
  try {
    const response = await api.post('/qbank/questoes/lote', {
      questaoIds,
    })
    return response.data.questoes || []
  } catch (error: any) {
    console.error('[buscarQuestoesLote] Erro:', error)
    return []
  }
}