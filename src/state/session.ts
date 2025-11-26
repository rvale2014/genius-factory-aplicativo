// src/state/session.ts
import * as SecureStore from 'expo-secure-store';
import { atom } from 'jotai';

export type Session = {
  accessToken?: string;
  refreshToken?: string;
} | null;

const SECURE_KEY = 'gf_session_v1';

// Atom da sessão
export const sessionAtom = atom<Session>(null);

// Atom que indica se a sessão já foi carregada do SecureStore
export const sessionLoadedAtom = atom<boolean>(false);

export async function loadSession(): Promise<Session> {
  const raw = await SecureStore.getItemAsync(SECURE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveSession(session: Session) {
  if (session) {
    await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(session));
  } else {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  }
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SECURE_KEY);
}
