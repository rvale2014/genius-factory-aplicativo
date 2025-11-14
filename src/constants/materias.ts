import type { ImageSourcePropType } from 'react-native';

export const GRADIENTES_MATERIAS: Record<string, [string, string]> = {
  'Matemática': ['#312e81', '#4c1d95'],
  'Português': ['#312e81', '#4c1d95'],
  'Ciências': ['#312e81', '#4c1d95'],
  'Geografia': ['#312e81', '#4c1d95'],
  'História': ['#312e81', '#4c1d95'],
  'Educação Financeira': ['#312e81', '#4c1d95'],
  'Astronomia': ['#312e81', '#4c1d95'],
  'Química': ['#312e81', '#4c1d95'],
  'Física': ['#312e81', '#4c1d95'],
};

// Gradiente padrão caso a matéria não esteja mapeada
export const GRADIENTE_PADRAO: [string, string] = ['#312e81', '#4c1d95'];

export function getGradienteMateria(materiaNome: string | null | undefined): [string, string] {
  if (!materiaNome) return GRADIENTE_PADRAO;
  return GRADIENTES_MATERIAS[materiaNome] ?? GRADIENTE_PADRAO;
}

const pixelRobot = require('../../assets/images/pixel-robot.webp') as ImageSourcePropType;
const kidsPlay = require('../../assets/images/criancas-brincando.webp') as ImageSourcePropType;

export function getMateriaVisualConfig(materiaNome: string | null | undefined): {
  gradient: [string, string];
  decorImage: ImageSourcePropType;
  secondaryDecorImage: ImageSourcePropType;
} {
  return {
    gradient: getGradienteMateria(materiaNome),
    decorImage: pixelRobot,
    secondaryDecorImage: kidsPlay,
  };
}