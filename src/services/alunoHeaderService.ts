import type { DashboardResponse } from '../schemas/dashboard';
import { obterDashboard } from './dashboardService';

export type AlunoHeaderData = {
  nome: string;
  avatarUrl: string | null;
  geniusCoins: number;
};

// Cache em memória com timestamp
let cachedAluno: AlunoHeaderData | null = null;
let cacheTimestamp: number = 0;
let pendingRequest: Promise<AlunoHeaderData> | null = null;

// TTL do cache: 5 segundos (evita requests desnecessários)
const CACHE_TTL = 5000;

// Event emitter para notificar mudanças no cache
type Listener = (data: AlunoHeaderData) => void;
const listeners = new Set<Listener>();

export function subscribeToAlunoHeaderChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(data: AlunoHeaderData) {
  listeners.forEach((listener) => listener(data));
}

function extractAlunoHeader(dashboard: DashboardResponse): AlunoHeaderData {
  return {
    nome: dashboard.aluno.nome,
    avatarUrl: dashboard.aluno.avatarUrl,
    geniusCoins: dashboard.aluno.geniusCoins,
  };
}

export function primeAlunoHeaderCache(data: AlunoHeaderData) {
  cachedAluno = data;
  cacheTimestamp = Date.now();
  notifyListeners(data);
}

export function clearAlunoHeaderCache() {
  cachedAluno = null;
  cacheTimestamp = 0;
  pendingRequest = null;
}

function isCacheValid(): boolean {
  if (!cachedAluno) return false;
  const age = Date.now() - cacheTimestamp;
  return age < CACHE_TTL;
}

export async function fetchAlunoHeader(forceRefresh = false): Promise<AlunoHeaderData> {
  // Se tem cache válido e não é refresh forçado, retorna do cache
  if (!forceRefresh && isCacheValid()) {
    return cachedAluno!;
  }

  // Se já tem request pendente, retorna a mesma promise
  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = obterDashboard()
    .then((dashboard) => {
      const data = extractAlunoHeader(dashboard);
      cachedAluno = data;
      cacheTimestamp = Date.now();
      pendingRequest = null;
      notifyListeners(data); // ✅ Notifica todos os hooks
      return data;
    })
    .catch((err) => {
      pendingRequest = null;
      throw err;
    });

  return pendingRequest;
}

// ✅ Nova função para revalidação silenciosa (não lança erro)
export async function revalidateAlunoHeaderCache(): Promise<void> {
  try {
    await fetchAlunoHeader(true);
  } catch (error) {
    // Silencioso - mantém dados antigos em caso de erro
    console.warn('Falha ao revalidar cache do aluno:', error);
  }
}