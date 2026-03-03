import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIXO = '@geniusfactory:';
const INDICE_PREFIX = `${PREFIXO}indice-bloco-`;

/**
 * Retorna a chave do índice de um bloco.
 */
function chaveIndice(blocoId: string): string {
  return `${INDICE_PREFIX}${blocoId}`;
}

/**
 * Registra uma chave no índice do bloco.
 * Chamado automaticamente ao salvar dados de questões.
 */
export async function registrarChaveBloco(blocoId: string, chave: string): Promise<void> {
  try {
    const indiceKey = chaveIndice(blocoId);
    const raw = await AsyncStorage.getItem(indiceKey);
    const chaves: string[] = raw ? JSON.parse(raw) : [];

    if (!chaves.includes(chave)) {
      chaves.push(chave);
      await AsyncStorage.setItem(indiceKey, JSON.stringify(chaves));
    }
  } catch {
    // Erro silencioso — não deve impedir o fluxo principal
  }
}

/**
 * Obtém todas as chaves registradas para um bloco e as chaves fixas conhecidas.
 * Substitui o uso de getAllKeys() + filter.
 */
export async function obterChavesBloco(blocoId: string): Promise<string[]> {
  const chavesFixas = [
    `${PREFIXO}pos-bloco-${blocoId}`,
    `${PREFIXO}done-bloco-${blocoId}`,
    `${PREFIXO}erro-bloco-${blocoId}`,
  ];

  try {
    const indiceKey = chaveIndice(blocoId);
    const raw = await AsyncStorage.getItem(indiceKey);
    const chavesDinamicas: string[] = raw ? JSON.parse(raw) : [];

    // Inclui a própria chave do índice para auto-limpeza
    return [...chavesFixas, ...chavesDinamicas, indiceKey];
  } catch {
    return chavesFixas;
  }
}
