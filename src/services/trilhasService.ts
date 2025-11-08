// src/services/trilhasService.ts
import { api } from '../lib/api';
import { TrilhasResponseSchema, type TrilhasResponse } from '../schemas/trilhas';

export type ListarTrilhasParams = {
  ano?: 'todos' | '4' | '5' | '6';
  materia?: 'todas' | string; // cuid()
  page?: number;
  perPage?: number;
};

export async function listarTrilhas(params: ListarTrilhasParams = {}): Promise<TrilhasResponse> {
  const {
    ano = 'todos',
    materia = 'todas',
    page = 1,
    perPage = 15,
  } = params;

  const res = await api.get('/mobile/v1/trilhas', {
    params: { ano, materia, page, perPage },
  });

  // Validação/parse no CLIENTE
  return TrilhasResponseSchema.parse(res.data);
}
