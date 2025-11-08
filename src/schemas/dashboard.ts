// src/schemas/dashboard.ts
import { z } from 'zod';

export const DashboardAlunoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  posicaoGlobal: z.number().int(), // 1-based, -1 se não ranqueado
  geniusCoins: z.number().int().min(0),
  avatarUrl: z.union([z.string().url(), z.null()]),
});

export const DashboardDesempenhoGeralSchema = z.object({
  alunoPct: z.number(),
  plataformaPct: z.number(),
  deltaPct: z.number(),
  acimaDaMedia: z.boolean(),
});

export const DashboardUltimoCursoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  imagemUrl: z.union([z.string().url(), z.null(), z.literal('')]),
  progressoPercentual: z.number().int().min(0).max(100),
  ultimaAulaNome: z.string(),
  materiaNome: z.string().nullable(),
});

export const DashboardUltimaTrilhaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  imagemUrl: z.union([z.string().url(), z.null(), z.literal('')]),
  progressoPercentual: z.number().int().min(0).max(100),
  ultimaAulaNome: z.string(),
  caminhoAtualId: z.string().optional(),
  materiaNome: z.string().nullable(),
});

export const DashboardSimuladoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  materias: z.array(z.string()),
  status: z.enum(['finalizado', 'pausado', 'nao-iniciado', 'em-andamento']),
  desempenho: z.number().int().min(0).max(100).nullable(),
});

export const DashboardResponseSchema = z.object({
  aluno: DashboardAlunoSchema,
  desempenhoGeral: DashboardDesempenhoGeralSchema,
  ultimoCurso: DashboardUltimoCursoSchema.nullable(),
  ultimaTrilha: DashboardUltimaTrilhaSchema.nullable(),
  ultimoSimulado: DashboardSimuladoSchema.nullable(),
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type DashboardAluno = z.infer<typeof DashboardAlunoSchema>;
export type DashboardDesempenhoGeral = z.infer<typeof DashboardDesempenhoGeralSchema>;
export type DashboardUltimoCurso = z.infer<typeof DashboardUltimoCursoSchema>;
export type DashboardUltimaTrilha = z.infer<typeof DashboardUltimaTrilhaSchema>;
export type DashboardSimulado = z.infer<typeof DashboardSimuladoSchema>;

