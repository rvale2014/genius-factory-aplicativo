// app/(app)/cursos/[id].tsx

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConquistaModal } from '../../../components/curso/ConquistaModal';
import { ModalAulas } from '../../../components/curso/ModalAulas';
import { VideoPlayer } from '../../../components/curso/VideoPlayer';
import {
  avaliarAula,
  concluirConteudo,
  desconcluirConteudo,
  obterDetalhesCurso,
  registrarVisualizacaoAula,
} from '../../../src/services/cursoService';
import type {
  Aula,
  Conteudo,
  NovaConquista,
  StatusAula,
} from '../../../types/curso';

const { width } = Dimensions.get('window');

interface VideoComAula {
  aula: Aula;
  conteudo: Conteudo;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export default function CursoDetalhesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [curso, setCurso] = useState<{ id: string; nome: string } | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [statusAulas, setStatusAulas] = useState<Record<string, StatusAula>>({});
  const [avaliacoes, setAvaliacoes] = useState<Record<string, number>>({});

  // Estados de navegação
  const [indiceVideoAtual, setIndiceVideoAtual] = useState(0);
  const [aulaSelecionada, setAulaSelecionada] = useState<Aula | null>(null);

  // Estados de conquistas
  const [filaConquistas, setFilaConquistas] = useState<NovaConquista[]>([]);
  const [modalConquistaAberto, setModalConquistaAberto] = useState(false);

  // Computar lista de vídeos
  const videos: VideoComAula[] = useMemo(() => {
    return aulas.flatMap((aula) =>
      aula.conteudos
        .filter((conteudo) => conteudo.tipo === 'VIDEO')
        .map((conteudo) => ({ aula, conteudo }))
    );
  }, [aulas]);

  const videoAtual = videos[indiceVideoAtual] || null;
  const totalVideos = videos.length;

  // Progresso do curso
  const percentualProgresso = useMemo(() => {
    const total = aulas.reduce((acc, aula) => {
      return acc + aula.conteudos.filter((c) => c.tipo === 'VIDEO').length;
    }, 0);
    const concluidos = aulas.reduce((acc, aula) => {
      const videosDaAula = aula.conteudos.filter((c) => c.tipo === 'VIDEO');
      const videosConcluidos = videosDaAula.filter((video) =>
        statusAulas[aula.id]?.conteudosConcluidos?.includes(video.id)
      ).length;
      return acc + videosConcluidos;
    }, 0);
    return total > 0 ? Math.round((concluidos / total) * 100) : 0;
  }, [aulas, statusAulas]);

  // Carregar dados do curso
  useEffect(() => {
    if (!id) return;

    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const data = await obterDetalhesCurso(id);

        setCurso(data.curso);
        setAulas(data.aulas);
        setStatusAulas(data.statusAulas);
        setAvaliacoes(data.avaliacoes);

        // Selecionar primeira aula e primeiro vídeo
        if (data.aulas.length > 0) {
          const primeiraAula = data.aulas[0];
          setAulaSelecionada(primeiraAula);
          
          // Registrar visualização
          registrarVisualizacaoAula(primeiraAula.id);
        }
      } catch (e: any) {
        console.error('Erro ao carregar curso:', e);
        setErro('Não foi possível carregar o curso. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id]);

  // Navegar para vídeo específico
  const irParaVideoPorId = useCallback(
    (conteudoId: string) => {
      const index = videos.findIndex((v) => v.conteudo.id === conteudoId);
      if (index !== -1) {
        setIndiceVideoAtual(index);
        const video = videos[index];
        setAulaSelecionada(video.aula);
      }
    },
    [videos]
  );

  // Navegar entre vídeos
  const avancar = useCallback(() => {
    setIndiceVideoAtual((prev) => {
      const next = Math.min(prev + 1, totalVideos - 1);
      if (next !== prev) {
        const nextVideo = videos[next];
        setAulaSelecionada(nextVideo.aula);
      }
      return next;
    });
  }, [totalVideos, videos]);

  const voltar = useCallback(() => {
    setIndiceVideoAtual((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next !== prev) {
        const nextVideo = videos[next];
        setAulaSelecionada(nextVideo.aula);
      }
      return next;
    });
  }, [videos]);

  // Toggle conclusão de conteúdo
  const toggleConteudo = useCallback(
    async (conteudoId: string, aulaId: string, jaConcluido: boolean) => {
      // Atualização otimista
      const statusAnterior = statusAulas[aulaId];
      const aulaAtual = aulas.find((a) => a.id === aulaId);
      const videosDaAula = aulaAtual?.conteudos?.filter((c) => c.tipo === 'VIDEO') ?? [];

      setStatusAulas((prev) => {
        const conteudosAtuais = prev[aulaId]?.conteudosConcluidos ?? [];
        const novosConteudos = jaConcluido
          ? conteudosAtuais.filter((id) => id !== conteudoId)
          : Array.from(new Set([...conteudosAtuais, conteudoId]));

        const videosConcluidos = videosDaAula.filter((video) =>
          novosConteudos.includes(video.id)
        ).length;
        const aulaConcluida =
          videosDaAula.length > 0 && videosConcluidos === videosDaAula.length;

        return {
          ...prev,
          [aulaId]: {
            aulaConcluida,
            conteudosConcluidos: novosConteudos,
          },
        };
      });

      try {
        // Chamar API
        if (jaConcluido) {
          await desconcluirConteudo(conteudoId, aulaId);
        } else {
          const response = await concluirConteudo(conteudoId, aulaId);

          // Processar conquistas
          const novas = response.novasConquistas || [];
          if (novas.length > 0) {
            setFilaConquistas((prev) => {
              const existentes = new Set(prev.map((c) => c.nome));
              const unicas = novas.filter((c) => !existentes.has(c.nome));
              return unicas.length ? [...prev, ...unicas] : prev;
            });
            setModalConquistaAberto(true);
          }

          // Atualizar status da aula com resposta da API
          if (response.statusAula) {
            setStatusAulas((prev) => ({
              ...prev,
              [aulaId]: response.statusAula,
            }));
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar conteúdo:', error);
        // Rollback em caso de erro
        setStatusAulas((prev) => ({
          ...prev,
          [aulaId]: statusAnterior,
        }));
      }
    },
    [aulas, statusAulas]
  );

  // Avaliar aula
  const handleAvaliarAula = useCallback(async (aulaId: string, nota: number) => {
    setAvaliacoes((prev) => ({ ...prev, [aulaId]: nota }));
    try {
      await avaliarAula(aulaId, nota);
    } catch (error) {
      console.error('Erro ao avaliar aula:', error);
    }
  }, []);

  // Exibir próxima conquista
  const exibirProximaConquista = useCallback(() => {
    setFilaConquistas((prev) => {
      const [, ...resto] = prev;
      if (resto.length === 0) {
        setModalConquistaAberto(false);
      }
      return resto;
    });
  }, []);

  // Quando vídeo termina
  const handleVideoEnded = useCallback(() => {
    if (!videoAtual) return;

    // Marcar como concluído
    const jaConcluido = statusAulas[videoAtual.aula.id]?.conteudosConcluidos.includes(
      videoAtual.conteudo.id
    );
    if (!jaConcluido) {
      toggleConteudo(videoAtual.conteudo.id, videoAtual.aula.id, false);
    }

    // Avançar automaticamente após 3 segundos
    setTimeout(() => {
      if (indiceVideoAtual < totalVideos - 1) {
        avancar();
      }
    }, 3000);
  }, [videoAtual, statusAulas, toggleConteudo, indiceVideoAtual, totalVideos, avancar]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A34FF" />
          <Text style={styles.loadingText}>Carregando curso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (erro || !curso) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#b00020" />
          <Text style={styles.errorText}>{erro || 'Erro ao carregar curso'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setErro(null);
              obterDetalhesCurso(id)
                .then((data) => {
                  setCurso(data.curso);
                  setAulas(data.aulas);
                  setStatusAulas(data.statusAulas);
                  setAvaliacoes(data.avaliacoes);
                })
                .catch((e) => {
                  console.error('Erro ao recarregar:', e);
                  setErro('Não foi possível carregar o curso.');
                })
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {curso.nome}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Player de vídeo */}
        {videoAtual && (
          <View style={styles.playerSection}>
            {/* Controles de navegação */}
            <View style={styles.navegacaoControles}>
              {indiceVideoAtual > 0 && (
                <TouchableOpacity style={styles.navButton} onPress={voltar}>
                  <ChevronLeft size={20} color="#FFFFFF" />
                  <Text style={styles.navButtonText}>Anterior</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {indiceVideoAtual < totalVideos - 1 && (
                <TouchableOpacity style={styles.navButton} onPress={avancar}>
                  <Text style={styles.navButtonText}>Próximo</Text>
                  <ChevronRight size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Player */}
            <VideoPlayer
              uri={videoAtual.conteudo.url}
              onEnded={handleVideoEnded}
              onError={(error) => console.error('Erro no player:', error)}
            />

            {/* Info do vídeo */}
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitulo}>
                Aula {aulas.findIndex((a) => a.id === videoAtual.aula.id) + 1} -{' '}
                {videoAtual.aula.nome}
              </Text>
              <TouchableOpacity
                style={[
                  styles.concluidoButton,
                  statusAulas[videoAtual.aula.id]?.conteudosConcluidos.includes(
                    videoAtual.conteudo.id
                  ) && styles.concluidoButtonAtivo,
                ]}
                onPress={() =>
                  toggleConteudo(
                    videoAtual.conteudo.id,
                    videoAtual.aula.id,
                    statusAulas[videoAtual.aula.id]?.conteudosConcluidos.includes(
                      videoAtual.conteudo.id
                    )
                  )
                }
              >
                <Text
                  style={[
                    styles.concluidoButtonText,
                    statusAulas[videoAtual.aula.id]?.conteudosConcluidos.includes(
                      videoAtual.conteudo.id
                    ) && styles.concluidoButtonTextAtivo,
                  ]}
                >
                  {statusAulas[videoAtual.aula.id]?.conteudosConcluidos.includes(
                    videoAtual.conteudo.id
                  )
                    ? 'Concluído ✓'
                    : 'Marcar como concluído'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal de Aulas */}
      <ModalAulas
        aulas={aulas}
        statusAulas={statusAulas}
        avaliacoes={avaliacoes}
        aulaSelecionadaId={aulaSelecionada?.id || null}
        videoAtualId={videoAtual?.conteudo.id || null}
        onSelecionarAula={(aula) => {
          setAulaSelecionada(aula);
          registrarVisualizacaoAula(aula.id);
        }}
        onSelecionarVideo={irParaVideoPorId}
        onAvaliarAula={handleAvaliarAula}
        onToggleConteudo={toggleConteudo}
        percentualProgresso={percentualProgresso}
      />

      {/* Modal de Conquistas */}
      <ConquistaModal
        visible={modalConquistaAberto && filaConquistas.length > 0}
        conquista={filaConquistas[0] || null}
        alunoNome="Aluno"
        conquistasRestantes={filaConquistas.length - 1}
        onClose={exibirProximaConquista}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#b00020',
    textAlign: 'center',
    fontFamily: getInterFont('400'),
  },
  retryButton: {
    backgroundColor: '#7A34FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 12,
    fontFamily: getInterFont('700'),
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  playerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  navegacaoControles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7A34FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  videoInfo: {
    marginTop: 16,
    gap: 12,
  },
  videoTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    fontFamily: getInterFont('700'),
  },
  concluidoButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  concluidoButtonAtivo: {
    backgroundColor: '#7A34FF',
  },
  concluidoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: getInterFont('600'),
  },
  concluidoButtonTextAtivo: {
    color: '#FFFFFF',
  },
});














