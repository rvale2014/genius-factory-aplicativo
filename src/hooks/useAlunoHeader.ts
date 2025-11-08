import { useEffect, useState } from 'react';
import { fetchAlunoHeader, type AlunoHeaderData } from '../services/alunoHeaderService';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function useAlunoHeader() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<AlunoHeaderData | null>(null);
  const [error, setError] = useState<Error | null>(null);

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

  return {
    status,
    data,
    error,
    loading: status === 'loading',
  };
}

