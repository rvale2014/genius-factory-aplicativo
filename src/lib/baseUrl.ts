// src/lib/baseUrl.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getExtra(): any {
  const c: any = Constants as any;
  return c?.expoConfig?.extra ?? c?.manifest2?.extra ?? c?.manifest?.extra ?? {};
}

const extra = getExtra();

const PORT: number = (() => {
  // Prioridade: extra.apiPort -> env -> 3000
  const fromExtra = extra?.apiPort;
  if (fromExtra !== undefined && fromExtra !== null && fromExtra !== '') {
    return Number(fromExtra);
  }
  const fromEnv = process.env.EXPO_PUBLIC_API_PORT;
  if (fromEnv !== undefined && fromEnv !== null && fromEnv !== '') {
    return Number(fromEnv);
  }
  return 3000;
})();

function resolveLanHost(): string | null {
  const c: any = Constants as any;
  const hostUri: string =
    c?.expoConfig?.hostUri || c?.manifest2?.hostUri || c?.manifest?.hostUri || '';
  const candidate = hostUri.split(':')[0];
  return candidate && candidate.includes('.') ? candidate : null;
}

export function getBaseUrl(): string {
  // Se quiser travar uma URL fixa, defina EXPO_PUBLIC_API_URL no .env e repasse em extra.apiUrl
  const forced = extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;
  if (forced) return String(forced);

  if (Platform.OS === 'android') {
    // Emulador Android acessa o host por 10.0.2.2
    return `http://10.0.2.2:${PORT}/api`;
  }

  if (Platform.OS === 'ios') {
    // iPhone físico: usa IP descoberto via hostUri; Simulator: localhost (fallback)
    const lan = resolveLanHost();
    return `http://${lan ?? 'localhost'}:${PORT}/api`;
  }

  // Web / outros
  const lan = resolveLanHost();
  return `http://${lan ?? 'localhost'}:${PORT}/api`;
}

