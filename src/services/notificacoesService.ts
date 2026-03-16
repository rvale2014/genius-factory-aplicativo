// src/services/notificacoesService.ts
import { api } from '../lib/api';
import {
  NotificacoesResponseSchema,
  NaoLidasResponseSchema,
  type NotificacoesResponse,
} from '../schemas/notificacoes';

/**
 * Registra ou atualiza o push token do dispositivo no backend
 */
export async function registrarTokenPush(
  token: string,
  plataforma: string
): Promise<void> {
  await api.post('/mobile/v1/notificacoes/token', { token, plataforma });
}

/**
 * Lista notificações do aluno autenticado (paginada)
 */
export async function listarNotificacoes(
  page: number = 1,
  pageSize: number = 20
): Promise<NotificacoesResponse> {
  const res = await api.get('/mobile/v1/notificacoes', {
    params: { page, pageSize },
  });
  return NotificacoesResponseSchema.parse(res.data);
}

/**
 * Marca uma notificação como lida
 * @param id - AlunoAviso.id
 */
export async function marcarComoLida(id: string): Promise<void> {
  await api.patch(`/mobile/v1/notificacoes/${id}`);
}

/**
 * Marca todas as notificações como lidas para o aluno autenticado
 */
export async function marcarTodasComoLidas(): Promise<void> {
  await api.patch('/mobile/v1/notificacoes/lidas');
}

/**
 * Retorna a contagem de notificações não lidas
 */
export async function contarNaoLidas(): Promise<number> {
  const res = await api.get('/mobile/v1/notificacoes/nao-lidas');
  const parsed = NaoLidasResponseSchema.parse(res.data);
  return parsed.count;
}
