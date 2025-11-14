// types/curso.ts

export interface Conteudo {
  id: string;
  titulo: string;
  tipo: 'PDF' | 'VIDEO' | 'TEXTO';
  url: string;
}

export interface Aula {
  id: string;
  nome: string;
  dataDisponibilizacao: string;
  conteudos: Conteudo[];
}

export interface Curso {
  id: string;
  nome: string;
  imagem?: string | null;
}

export interface StatusAula {
  aulaConcluida: boolean;
  conteudosConcluidos: string[];
}

export interface CursoDetalhesResponse {
  curso: Curso;
  aulas: Aula[];
  statusAulas: Record<string, StatusAula>;
  avaliacoes: Record<string, number>;
}

export interface NovaConquista {
  nome: string;
  titulo: string;
  nivel: number;
  categoria: string;
  imagemUrl: string;
}

export interface ConcluirConteudoResponse {
  ok: boolean;
  statusAula: StatusAula;
  novasConquistas?: NovaConquista[];
  conquistasDesbloqueadas?: NovaConquista[];
}