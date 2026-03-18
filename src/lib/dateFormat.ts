// src/lib/dateFormat.ts

import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

/**
 * Formata data ISO para DD/MM/YYYY.
 * Se timezone fornecido, converte para o fuso antes de formatar.
 * Ex: "2026-03-17T18:04:00Z" → "17/03/2026"
 */
export function formatarData(dataISO: string, timezone?: string): string {
  try {
    if (timezone) {
      return formatInTimeZone(dataISO, timezone, 'dd/MM/yyyy', { locale: ptBR });
    }
    return format(parseISO(dataISO), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dataISO;
  }
}

/**
 * Formata data ISO para DD/MM/YYYY HH:mm.
 * Se timezone fornecido, converte para o fuso antes de formatar.
 * Ex: "2026-03-17T18:04:00Z" → "17/03/2026 15:04"
 */
export function formatarDataHora(dataISO: string, timezone?: string): string {
  try {
    if (timezone) {
      return formatInTimeZone(dataISO, timezone, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
    return format(parseISO(dataISO), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return dataISO;
  }
}

/**
 * Formata data ISO para DD/MM (curto, usado em gráficos e labels).
 * Se timezone fornecido, converte para o fuso antes de formatar.
 * Ex: "2026-03-17" → "17/03"
 */
export function formatarDataCurta(dataISO: string, timezone?: string): string {
  try {
    if (timezone) {
      return formatInTimeZone(dataISO, timezone, 'dd/MM', { locale: ptBR });
    }
    return format(parseISO(dataISO), 'dd/MM', { locale: ptBR });
  } catch {
    return dataISO;
  }
}

/**
 * Calcula tempo relativo a partir de uma data ISO string.
 * Agnóstico de timezone (compara timestamps UTC).
 * Ex: "há 5 min", "há 2h", "há 3d", "há 2 sem"
 * Para datas antigas (>4 semanas), retorna DD/MM no formato curto.
 */
export function tempoRelativo(dataISO: string): string {
  try {
    const agora = Date.now();
    const data = new Date(dataISO).getTime();
    const diffMs = agora - data;

    const minutos = Math.floor(diffMs / 60000);
    const horas = Math.floor(diffMs / 3600000);
    const dias = Math.floor(diffMs / 86400000);
    const semanas = Math.floor(dias / 7);

    if (minutos < 1) return 'agora';
    if (minutos < 60) return `há ${minutos} min`;
    if (horas < 24) return `há ${horas}h`;
    if (dias < 7) return `há ${dias}d`;
    if (semanas < 4) return `há ${semanas} sem`;

    return format(parseISO(dataISO), 'dd MMM', { locale: ptBR });
  } catch {
    return dataISO;
  }
}
