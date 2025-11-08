import { api } from '../lib/api';

export type QuestaoOption = { id: string; nome: string };

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | number[]
  | boolean[];

type Params = Record<string, Serializable>;

function serializeParams(params: Params): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== null && item !== '')
        .forEach((item) => search.append(key, String(item)));
      return;
    }

    if (typeof value === 'boolean') {
      search.append(key, value ? 'true' : 'false');
      return;
    }

    search.append(key, String(value));
  });

  return search.toString();
}

const arraySerializer = {
  serialize: (params: Params) => serializeParams(params),
};

function normalizeOptions(raw: any, keyHint?: string): QuestaoOption[] {
  let source: any = raw;

  if (Array.isArray(raw)) {
    source = raw;
  } else if (keyHint && Array.isArray(raw?.[keyHint])) {
    source = raw[keyHint];
  } else if (Array.isArray(raw?.data)) {
    source = raw.data;
  } else if (Array.isArray(raw?.items)) {
    source = raw.items;
  } else if (Array.isArray(raw?.results)) {
    source = raw.results;
  }

  if (!Array.isArray(source)) {
    console.warn('[questoesService] Resposta inesperada para opções:', raw);
    return [];
  }

  return source
    .map((item) => {
      if (typeof item === 'string') {
        return { id: item, nome: item };
      }
      if (!item || typeof item !== 'object') return null;

      const id =
        item.id ??
        item.value ??
        item.codigo ??
        item.slug ??
        item.uuid ??
        item.chave ??
        item.key ??
        null;
      const nome =
        item.nome ??
        item.name ??
        item.titulo ??
        item.descricao ??
        item.label ??
        item.codigo ??
        (id != null ? String(id) : null);

      if (id == null || nome == null) return null;

      return {
        id: String(id),
        nome: String(nome),
      };
    })
    .filter((item): item is QuestaoOption => item !== null);
}

export async function buscarMaterias(): Promise<QuestaoOption[]> {
  const { data } = await api.get('/mobile/v1/qbank/materias');
  return normalizeOptions(data, 'materias');
}

export async function buscarInstituicoes(): Promise<QuestaoOption[]> {
  const { data } = await api.get('/mobile/v1/qbank/instituicoes');
  return normalizeOptions(data, 'instituicoes');
}

export async function buscarGraus(): Promise<QuestaoOption[]> {
  const { data } = await api.get('/mobile/v1/qbank/graus');
  return normalizeOptions(data, 'graus');
}

export async function buscarSeries(): Promise<QuestaoOption[]> {
  const { data } = await api.get('/mobile/v1/qbank/series');
  return normalizeOptions(data, 'series');
}

export async function buscarAnos(): Promise<QuestaoOption[]> {
  const { data } = await api.get('/mobile/v1/qbank/anos');
  return normalizeOptions(data, 'anos');
}

export type AssuntoNode = {
  id: string;
  titulo?: string | null;
  materiaId?: string | null;
  filhos: AssuntoNode[];
  isMateria?: boolean;
};

export async function buscarAssuntosTree(materiaIds: string[]): Promise<AssuntoNode[]> {
  if (!materiaIds || materiaIds.length === 0) return [];

  const { data } = await api.get('/mobile/v1/qbank/assuntos', {
    params: { materiaId: materiaIds },
    paramsSerializer: arraySerializer,
  });

  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

  function mapNode(node: any): AssuntoNode {
    return {
      id: String(node.id),
      titulo: node.titulo ?? node.nome ?? null,
      materiaId: node.materiaId ?? null,
      isMateria: node.isMateria ?? false,
      filhos: Array.isArray(node.filhos) ? node.filhos.map(mapNode) : [],
    };
  }

  return items.map(mapNode);
}

export async function buscarClasses(instituicaoIds: string[]): Promise<QuestaoOption[]> {
  const { data } = await api.get('/mobile/v1/qbank/classes', {
    params: { instituicaoId: instituicaoIds },
    paramsSerializer: arraySerializer,
  });

  return normalizeOptions(data, 'classes');
}

export async function buscarFases(
  instituicaoId: string | undefined,
  classeIds: string[]
): Promise<QuestaoOption[]> {
  if (!instituicaoId) return [];

  const { data } = await api.get('/mobile/v1/qbank/fases', {
    params: { instituicaoId, classeId: classeIds },
    paramsSerializer: arraySerializer,
  });

  return normalizeOptions(data, 'fases');
}

export type QuestoesFiltros = {
  materiaId: string[];
  assuntoId: string[];
  tipo: string[];
  instituicaoId: string[];
  classeId: string[];
  faseId: string[];
  grauDificuldadeId: string[];
  serieEscolarId: string[];
  anoId: string[];
  excluirSomenteErradas: boolean;
  excluirResolvidas?: boolean;
  excluirAcertadas: boolean;
  excluirNaoComentadas: boolean;
};

export type QuestoesListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listarQuestoes<T>(
  filtros: QuestoesFiltros,
  page: number,
  pageSize: number
): Promise<QuestoesListResponse<T>> {
  const params: Record<string, any> = {
    ...filtros,
    page,
    pageSize,
  };

  if (params.excluirSomenteErradas) {
    params.excluirSomenteErradas = true;
    params.excluirResolvidas = false;
  }

  const { data } = await api.get<QuestoesListResponse<T>>('/mobile/v1/qbank/questoes', {
    params,
    paramsSerializer: arraySerializer,
  });
  return data;
}

export async function contarQuestoes(filtros: QuestoesFiltros): Promise<number> {
  const params: Record<string, any> = {
    ...filtros,
  };

  if (params.excluirSomenteErradas) {
    params.excluirSomenteErradas = true;
    params.excluirResolvidas = false;
  }

  const { data } = await api.get<{ total: number }>('/mobile/v1/qbank/questoes/count', {
    params,
    paramsSerializer: arraySerializer,
  });
  return data.total;
}

