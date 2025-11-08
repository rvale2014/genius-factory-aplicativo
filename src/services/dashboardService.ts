// src/services/dashboardService.ts
import { api } from '../lib/api';
import { DashboardResponseSchema, type DashboardResponse } from '../schemas/dashboard';

export async function obterDashboard(): Promise<DashboardResponse> {
  const res = await api.get('/mobile/v1/dashboard');
  // Validação/parse no CLIENTE
  return DashboardResponseSchema.parse(res.data);
}

