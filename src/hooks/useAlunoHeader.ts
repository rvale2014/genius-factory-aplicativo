import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchAlunoHeader,
  revalidateAlunoHeaderCache,
  subscribeToAlunoHeaderChanges,
  type AlunoHeaderData
} from '../services/alunoHeaderService';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function useAlunoHeader() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<AlunoHeaderData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Carregamento inicial
  useEffect(() => {
    let active = true;

    async function load() {
      setStatus((prev) => (prev === 'ready' ? prev : 'loading'));
      setError(null);
      try {
        const result = await fetchAlunoHeader();
        if (!active) return;
        setData(result);
        setStatus('ready');
      } catch (err: any) {
        if (!active) return;
        setError(err instanceof Error ? err : new Error('Erro ao carregar dados do aluno.'));
        setStatus('error');
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  // Reage a mudanças no cache (quando Dashboard ou outras telas atualizam)
  useEffect(() => {
    const unsubscribe = subscribeToAlunoHeaderChanges((newData) => {
      setData(newData);
      setStatus('ready');
      setError(null);
    });

    return unsubscribe;
  }, []);

  // ✅ Revalida o cache quando a tela ganha foco (silenciosamente)
  useFocusEffect(
    useCallback(() => {
      // Não revalida no primeiro render (já foi feito no useEffect inicial)
      if (status === 'idle' || status === 'loading') {
        return;
      }

      // Revalida silenciosamente em background
      revalidateAlunoHeaderCache();
    }, [status])
  );

  return {
    status,
    data,
    error,
    loading: status === 'loading',
  };
}

