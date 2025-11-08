// src/services/trilhasCaminhoService.ts
import { api } from '../lib/api';
import {
    TrilhasCaminhoParamsSchema,
    TrilhasCaminhoResponseSchema,
    type TrilhasCaminhoResponse,
} from '../schemas/trilhas.caminho-completo';

export async function obterCaminhoCompleto(args: { id: string; caminhoId: string }): Promise<TrilhasCaminhoResponse> {
  // valida os params no cliente (evita chamar com ID inválido)
  const { id, caminhoId } = TrilhasCaminhoParamsSchema.parse(args);

  // chama sua rota (ajuste o path conforme seu backend)
  const res = await api.get(`/mobile/v1/trilhas/${id}/caminhos/${caminhoId}`);

  // valida/parseia resposta
  return TrilhasCaminhoResponseSchema.parse(res.data);
}
