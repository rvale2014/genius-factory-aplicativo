// src/services/conquistasService.ts
import { api } from "@/src/lib/api";
import type { AlunoConquistasResponse } from "@/src/schemas/conquistas";

/**
 * Busca todas as conquistas do aluno (desbloqueadas e bloqueadas)
 */
export async function obterConquistas(signal?: AbortSignal): Promise<AlunoConquistasResponse> {
  try {
    const { data } = await api.get<AlunoConquistasResponse>(
      "/mobile/v1/conquistas",
      { signal }
    );
    return data;
  } catch (err: any) {
    const msg = err?.response?.data?.error ?? err?.message ?? "Erro ao buscar conquistas";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}