// src/schemas/trilhas.caminho-completo.ts
import { z } from 'zod';

/** Enums vindos do Prisma */
export const TipoAtividadeEnum = z.enum(['leitura', 'video', 'questoes', 'simulado']);

/** Sub-schemas */
export const ProgressoSchema = z.object({
  concluido: z.boolean(),
});

export const AtividadeSchema = z.object({
  id: z.string().cuid(),
  tipo: TipoAtividadeEnum,
  ativo: z.boolean(),
  progresso: z.array(ProgressoSchema),
  concluido: z.boolean(),
});

export const BlocoSchema = z.object({
  id: z.string().cuid(),
  titulo: z.string(),
  ordem: z.number().int(),
  atividades: z.array(AtividadeSchema),
});
export type Atividade = z.infer<typeof AtividadeSchema>;
export type Bloco = z.infer<typeof BlocoSchema>;

export const CaminhoAtualSchema = z.object({
  id: z.string().cuid(),
  nome: z.string(),
  ordem: z.number().int(),
  imagemFundoUrl: z.string().url().nullable().optional(),
});

export const CaminhoResumoSchema = z.object({
  id: z.string().cuid(),
  nome: z.string(),
  ordem: z.number().int(),
  totalAtividades: z.number().int().nonnegative(),
  concluidas: z.number().int().min(0),
  percentual: z.number().int().min(0).max(100),
});

export const TrilhaHeaderSchema = z.object({
  id: z.string().cuid(),
  titulo: z.string(),
  materiaNome: z.string(), // ← ADICIONAR ESTA LINHA
  caminhos: z.array(CaminhoResumoSchema),
});

/** Resposta final (igual à web) */
export const TrilhasCaminhoResponseSchema = z.object({
  caminho: CaminhoAtualSchema,
  blocos: z.array(BlocoSchema),
  trilha: TrilhaHeaderSchema,
});

export type TrilhasCaminhoResponse = z.infer<typeof TrilhasCaminhoResponseSchema>;

/** (Opcional) Params da rota */
export const TrilhasCaminhoParamsSchema = z.object({
  id: z.string().cuid(),
  caminhoId: z.string().cuid(),
});
export type TrilhasCaminhoParams = z.infer<typeof TrilhasCaminhoParamsSchema>;
