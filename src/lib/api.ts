// src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { clearSession, saveSession } from '../state/session';
import { getBaseUrl } from './baseUrl';

const SECURE_KEY = 'gf_session_v1';

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Função auxiliar para fazer refresh do token (sem usar api para evitar ciclo)
async function refreshAccessTokenInternal(refreshToken: string): Promise<string> {
  // Criar uma instância temporária do axios sem interceptors para evitar ciclo
  const tempApi = axios.create({
    baseURL: getBaseUrl(),
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });
  
  const res = await tempApi.post('/mobile/v1/auth/refresh', { refreshToken });
  if (!res.data?.ok || !res.data?.accessToken) {
    throw new Error('refresh_failed');
  }
  return res.data.accessToken as string;
}

// Atualiza storage com novo accessToken
async function updateAccessTokenInternal(newAccess: string) {
  const raw = await SecureStore.getItemAsync(SECURE_KEY);
  const old = raw ? JSON.parse(raw) : {};
  const next = { ...old, accessToken: newAccess };
  await saveSession(next);
  return next;
}

// ---------- REQUEST: anexa Authorization ----------
api.interceptors.request.use(async (config) => {
  const raw = await SecureStore.getItemAsync(SECURE_KEY);
  if (raw) {
    const { accessToken } = JSON.parse(raw) as { accessToken?: string };
    if (accessToken) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

// ---------- RESPONSE: refresh em 401 uma única vez por request ----------
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

function shouldSkipRefresh(config?: InternalAxiosRequestConfig) {
  // evita loop: não faz refresh para a própria rota de refresh/login/reset-password
  const url = config?.url || '';
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/reset-password');
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const originalConfig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (status === 401 && !originalConfig?._retry && !shouldSkipRefresh(originalConfig)) {
      originalConfig._retry = true;

      try {
        // lê refreshToken
        const raw = await SecureStore.getItemAsync(SECURE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const refreshToken = parsed?.refreshToken as string | undefined;
        if (!refreshToken) throw new Error('no_refresh');

        // garante UMA chamada de refresh por vez
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessTokenInternal(refreshToken)
            .finally(() => {
              isRefreshing = false;
            });
        }

        // aguarda o mesmo refresh para todos que caírem aqui
        const newAccess = await (refreshPromise as Promise<string>);

        // salva new access e atualiza header
        const nextSession = await updateAccessTokenInternal(newAccess);
        originalConfig.headers = originalConfig.headers ?? {};
        (originalConfig.headers as any).Authorization = `Bearer ${nextSession.accessToken}`;

        // repete a request original
        return api.request(originalConfig);
      } catch (e) {
        // refresh falhou → logout e propaga erro
        await clearSession();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

