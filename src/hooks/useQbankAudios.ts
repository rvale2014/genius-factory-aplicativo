// hooks/useQbankAudios.ts
import { useEffect, useState } from 'react';

type AudioPage = {
  index: number;
  url: string;
};

type UseQbankAudiosParams = {
  questaoId: string;
  kind: 'dica' | 'comentario';
};

type UseQbankAudiosReturn = {
  loading: boolean;
  error: string | null;
  pages: AudioPage[];
  byIndex: Record<number, string>;
  hasAudio: boolean;
  totalPages: number;
};

export function useQbankAudios({ questaoId, kind }: UseQbankAudiosParams): UseQbankAudiosReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<AudioPage[]>([]);

  useEffect(() => {
    async function fetchAudios() {
      setLoading(true);
      setError(null);

      try {
        // TODO: Substituir pela sua API real quando estiver pronta
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/qbank/audios?questaoId=${questaoId}&kind=${kind}`
        );

        if (!response.ok) {
          throw new Error('Falha ao carregar áudios');
        }

        const data = await response.json();
        
        // Espera-se que a API retorne: { audios: [{ index: 0, url: "..." }, ...] }
        const audios = Array.isArray(data?.audios) ? data.audios : [];
        setPages(audios);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setPages([]);
      } finally {
        setLoading(false);
      }
    }

    if (questaoId) {
      fetchAudios();
    }
  }, [questaoId, kind]);

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