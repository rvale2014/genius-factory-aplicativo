export const GRADIENTES_MATERIAS: Record<string, [string, string]> = {
  'Matemática': ['#7A34FF', '#60A5FA'],
  'Português': ['#14b8a6', '#10b981'],
  'Ciências': ['#f59e0b', '#f97316'],
  'Geografia': ['#8b5cf6', '#a855f7'],
  'História': ['#ef4444', '#dc2626'],
  'Educação Financeira': ['#06b6d4', '#0891b2'],
  'Astronomia': ['#312e81', '#4c1d95'],
  'Química': ['#16a34a', '#15803d'],
  'Física': ['#0284c7', '#0369a1'],
};

// Gradiente padrão caso a matéria não esteja mapeada
export const GRADIENTE_PADRAO: [string, string] = ['#7A34FF', '#FF5FDB'];

export function getGradienteMateria(materiaNome: string | null | undefined): [string, string] {
  if (!materiaNome) return GRADIENTE_PADRAO;
  return GRADIENTES_MATERIAS[materiaNome] ?? GRADIENTE_PADRAO;
}