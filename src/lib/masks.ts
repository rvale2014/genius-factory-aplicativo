// src/lib/masks.ts


export const CPF_MASK = [
  /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/
];

export const PHONE_MASK = [
  '(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/
];

export const CEP_MASK = [
  /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/
];

export const DATE_MASK = [
  /\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/
];

/**
 * Converte DD/MM/YYYY para YYYY-MM-DD (formato ISO)
 */
export function dateToISO(dateBR: string): string | null {
  if (!dateBR || dateBR.length !== 10) return null;
  const [day, month, year] = dateBR.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Converte YYYY-MM-DD para DD/MM/YYYY
 */
export function dateFromISO(dateISO: string): string {
  if (!dateISO) return '';
  const [year, month, day] = dateISO.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Remove caracteres não numéricos
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}