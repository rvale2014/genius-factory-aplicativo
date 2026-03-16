// src/schemas/notificacoes.ts
import { z } from 'zod';

/**
 * Schema para uma notificação individual retornada pela API mobile
 */
export const NotificacaoSchema = z.object({
  id: z.string(),            // AlunoAviso.id (usado no PATCH para marcar lida)
  titulo: z.string(),        // Aviso.titulo
  corpo: z.string(),         // Aviso.conteudo (normalizado pelo backend)
  tipo: z.enum(['manual', 'inatividade', 'conquista']),
  lida: z.boolean(),         // AlunoAviso.visualizado
  dados: z.record(z.any()).nullable(), // deep link data (ex: { route: '/trilhas/abc' })
  criadaEm: z.string(),      // Aviso.criadaEm (ISO string)
});

export type Notificacao = z.infer<typeof NotificacaoSchema>;

/**
 * Schema para a resposta paginada de notificações
 */
export const NotificacoesResponseSchema = z.object({
  notificacoes: z.array(NotificacaoSchema),
  total: z.number(),
  page: z.number(),
});

export type NotificacoesResponse = z.infer<typeof NotificacoesResponseSchema>;

/**
 * Schema para a contagem de notificações não lidas
 */
export const NaoLidasResponseSchema = z.object({
  count: z.number(),
});

export type NaoLidasResponse = z.infer<typeof NaoLidasResponseSchema>;
