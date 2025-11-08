// src/lib/authClient.ts
import axios from 'axios';
import { clearSession, saveSession } from '../state/session';
import { getBaseUrl } from './baseUrl';

// Pede um novo accessToken pro backend usando o refreshToken
export async function refreshAccessToken(refreshToken: string) {
  const res = await axios.post(`${getBaseUrl()}/mobile/v1/auth/refresh`, { refreshToken });
  if (!res.data?.ok || !res.data?.accessToken) {
    throw new Error('refresh_failed');
  }
  return res.data.accessToken as string;
}

// Atualiza storage com novo accessToken (mantendo refresh)
export async function updateAccessToken(newAccess: string) {
  const raw = await import('expo-secure-store').then(m => m.getItemAsync('gf_session_v1'));
  const old = raw ? JSON.parse(raw) : {};
  const next = { ...old, accessToken: newAccess };
  await saveSession(next);
  return next;
}

// Limpa sessão ao falhar refresh
export async function forceLogout() {
  await clearSession();
}
