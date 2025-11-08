// src/schemas/trilhas.ts
import { z } from 'zod';

export const TrilhaItemSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  imagemUrl: z.string().nullable(),
  percentual: z.number().int().min(0).max(100),
  totalAtividades: z.number().int().min(0), // NOVO
  materiaNome: z.string(),                  // NOVO
  ultimaAtividade: z.string().nullable(),
  caminhoAtualId: z.string(),
});

export const TrilhasResponseSchema = z.object({
  nome: z.string(),
  trilhas: z.array(TrilhaItemSchema),

  // paginação
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

// Tipos TypeScript inferidos dos schemas:
export type TrilhaItem = z.infer<typeof TrilhaItemSchema>;
export type TrilhasResponse = z.infer<typeof TrilhasResponseSchema>;
