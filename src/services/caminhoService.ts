import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import type { TrilhasCaminhoResponse } from '../schemas/trilhas.caminho-completo';

const CACHE_KEY_PREFIX = 'caminho:';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface CacheEntry {
  data: TrilhasCaminhoResponse;
  timestamp: number;
  etag: string | null;
}

export async function obterCaminho(
  trilhaId: string,
  caminhoId: string
): Promise<TrilhasCaminhoResponse> {
  const cacheKey = `${CACHE_KEY_PREFIX}${trilhaId}:${caminhoId}`;

  try {
    // 1) Tenta ler do cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;

      if (!isExpired) {
        // Cache ainda válido, retorna imediatamente
        return entry.data;
      }

      // Cache expirado, mas tenta revalidação com ETag
      try {
        const headers: Record<string, string> = {};
        if (entry.etag) {
          headers['If-None-Match'] = entry.etag;
        }

        const response = await api.get<TrilhasCaminhoResponse>(
          `/mobile/v1/trilhas/${trilhaId}/caminhos/${caminhoId}`,
          { headers }
        );

        // 304: dados não mudaram, atualiza só o timestamp (não é erro, é sucesso!)
        if (response.status === 304) {
          const refreshed: CacheEntry = {
            ...entry,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(cacheKey, JSON.stringify(refreshed));
          return entry.data;
        }

        // 200: dados novos, atualiza cache completo
        const newEtag = response.headers?.etag ?? null;
        const newEntry: CacheEntry = {
          data: response.data,
          timestamp: Date.now(),
          etag: newEtag,
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(newEntry));
        return response.data;
      } catch (revalidateError) {
        // Erro na revalidação, retorna cache expirado mesmo assim
        console.warn('Erro ao revalidar cache do caminho, usando dados antigos:', revalidateError);
        return entry.data;
      }
    }

    // 2) Sem cache, busca dados novos
    const response = await api.get<TrilhasCaminhoResponse>(
      `/mobile/v1/trilhas/${trilhaId}/caminhos/${caminhoId}`
    );

    const newEtag = response.headers?.etag ?? null;
    const newEntry: CacheEntry = {
      data: response.data,
      timestamp: Date.now(),
      etag: newEtag,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(newEntry));
    return response.data;
  } catch (error) {
    console.error('Erro ao obter caminho:', error);
    throw error;
  }
}

export async function invalidarCacheCaminho(trilhaId: string, caminhoId: string): Promise<void> {
  const cacheKey = `${CACHE_KEY_PREFIX}${trilhaId}:${caminhoId}`;
  await AsyncStorage.removeItem(cacheKey);
}

export async function invalidarCacheTrilha(trilhaId: string): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const trilhaKeys = keys.filter(key => key.startsWith(`${CACHE_KEY_PREFIX}${trilhaId}:`));
  await AsyncStorage.multiRemove(trilhaKeys);
}