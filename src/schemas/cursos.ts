// src/schemas/cursos.ts
import { z } from 'zod';

export const CursoSerieSchema = z.object({
  id: z.string(),
  nome: z.string(),
});

export const CursoMateriaSchema = z.object({
  id: z.string(),
  nome: z.string(),
});

export const CursoProfessorSchema = z.object({
  id: z.string(),
  nome: z.string(),
  foto: z.string().nullable(),
});

export const CursoProgressoSchema = z.object({
  percentual: z.number().int().min(0).max(100),
  status: z.enum(['nao_iniciado', 'em_andamento', 'concluido']),
  proximaAulaId: z.string().nullable(),
  proximaAulaTitulo: z.string().nullable(),
});

export const CursoCountsSchema = z.object({
  aulas: z.number().int().min(0),
});

export const CursoItemSchema = z.object({
  id: z.string(),
  nome: z.string(),
  imagem: z.string().nullable(),
  descricao: z.string().nullable(),
  materia: CursoMateriaSchema,
  professor: CursoProfessorSchema.optional(), // não usamos na UI, mas pode vir
  series: z.array(CursoSerieSchema),
  _counts: CursoCountsSchema,
  alunoInscrito: z.boolean(),
  progresso: CursoProgressoSchema,
});

export const CursosResponseSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  items: z.array(CursoItemSchema),
});

// Tipos TS
export type CursoItem = z.infer<typeof CursoItemSchema>;
export type CursosResponse = z.infer<typeof CursosResponseSchema>;
