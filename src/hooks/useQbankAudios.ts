// hooks/useQbankAudios.ts
import { useEffect, useState } from 'react';
import { api } from '@/src/lib/api';

type AudioPage = {
  index: number;
  url: string;
  durationMs?: number;
};

type UseQbankAudiosParams = {
  questaoId: string;
  kind: 'dica' | 'comentario';
  enabled?: boolean;
};

type UseQbankAudiosReturn = {
  loading: boolean;
  error: string | null;
  pages: AudioPage[];
  byIndex: Record<number, string>;
  hasAudio: boolean;
  totalPages: number;
};

export function useQbankAudios({ 
  questaoId, 
  kind, 
  enabled = true 
}: UseQbankAudiosParams): UseQbankAudiosReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<AudioPage[]>([]);

  useEffect(() => {
    if (!enabled || !questaoId) {
      return;
    }

    async function fetchAudios() {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get('/mobile/v1/qbank/audios', {
          params: {
            questaoId,
            kind,
          },
        });
        
        const audios = Array.isArray(data?.audios) ? data.audios : [];
        setPages(audios);
      } catch (err: any) {
        console.error('[useQbankAudios] Erro:', err);
        setError(err?.message || 'Erro desconhecido');
        setPages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAudios();
  }, [questaoId, kind, enabled]);

  const byIndex = pages.reduce<Record<number, string>>((acc, page) => {
    acc[page.index] = page.url;
    return acc;
  }, {});

  return {
    loading,
    error,
    pages,
    byIndex,
    hasAudio: pages.length > 0,
    totalPages: pages.length,
  };
}