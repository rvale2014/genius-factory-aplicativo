import type { DashboardResponse } from '../schemas/dashboard';
import { obterDashboard } from './dashboardService';

export type AlunoHeaderData = {
  nome: string;
  avatarUrl: string | null;
  geniusCoins: number;
};

let cachedAluno: AlunoHeaderData | null = null;
let pendingRequest: Promise<AlunoHeaderData> | null = null;

function extractAlunoHeader(dashboard: DashboardResponse): AlunoHeaderData {
  return {
    nome: dashboard.aluno.nome,
    avatarUrl: dashboard.aluno.avatarUrl,
    geniusCoins: dashboard.aluno.geniusCoins,
  };
}

export function primeAlunoHeaderCache(data: AlunoHeaderData) {
  cachedAluno = data;
}

export function clearAlunoHeaderCache() {
  cachedAluno = null;
  pendingRequest = null;
}

export async function fetchAlunoHeader(): Promise<AlunoHeaderData> {
  if (cachedAluno) {
    return cachedAluno;
  }

  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = obterDashboard()
    .then((dashboard) => {
      const data = extractAlunoHeader(dashboard);
      cachedAluno = data;
      pendingRequest = null;
      return data;
    })
    .catch((err) => {
      pendingRequest = null;
      throw err;
    });

  return pendingRequest;
}

