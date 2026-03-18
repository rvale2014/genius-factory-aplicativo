// src/lib/timezone.ts

const FALLBACK_TIMEZONE = 'America/Sao_Paulo';

/**
 * Valida se um string é um timezone IANA válido.
 * Testa criando um DateTimeFormat com o timezone fornecido.
 */
export function isTimezoneValido(tz: string): boolean {
  try {
    Intl.DateTimeFormat('pt-BR', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detecta o timezone IANA do dispositivo via Intl API.
 * Retorna ex: "America/Sao_Paulo", "America/Manaus", "Europe/Lisbon".
 * Fallback: "America/Sao_Paulo" se Intl não disponível ou retornar valor inválido.
 */
export function detectarTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isTimezoneValido(tz)) {
      return tz;
    }
    return FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}
