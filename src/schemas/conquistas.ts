// src/schemas/conquistas.ts
import { z } from "zod";

/**
 * Schema para uma conquista individual retornada pela API mobile
 */
export const ConquistaItemSchema = z.object({
  id: z.string(),
  nome: z.string(),
  titulo: z.string(),
  categoria: z.string(), // "Progresso", "Consistência", "Desempenho", "Exploração"
  nivel: z.number().int().min(1),
  descricao: z.string(),
  criterio: z.string(),
  imagemUrl: z.string().url(),
  especial: z.boolean(),
  desbloqueada: z.boolean(),
});

export type ConquistaItem = z.infer<typeof ConquistaItemSchema>;

/**
 * Schema para a resposta completa de conquistas do aluno
 */
export const AlunoConquistasResponseSchema = z.object({
  conquistas: z.array(ConquistaItemSchema),
});

export type AlunoConquistasResponse = z.infer<typeof AlunoConquistasResponseSchema>;