// src/services/cursosService.ts
import { api } from '../lib/api';
import { CursosResponseSchema, type CursosResponse } from '../schemas/cursos';

export type ListarCursosParams = {
  ano?: 'todos' | '4' | '5' | '6';
  materiaId?: string;      // cuid()
  page?: number;           // default 1
  perPage?: number;        // default 15 (mapeado para pageSize na API)
};

export async function listarCursos(params: ListarCursosParams = {}): Promise<CursosResponse> {
  const {
    ano = 'todos',
    materiaId,
    page = 1,
    perPage = 15,
  } = params;

  const res = await api.get('/mobile/v1/cursos', {
    params: {
      ano,
      page,
      pageSize: perPage, // API espera pageSize; por fora mantemos perPage pra ficar igual Trilhas
      ...(materiaId ? { materiaId } : {}),
    },
  });

  return CursosResponseSchema.parse(res.data);
}
