// app/(app)/cursos/[id].tsx

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
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
  const [abaAtiva, setAbaAtiva] = useState<'materiais' | 'duvidas'>('materiais');

  // Computar lista de vídeos
  const videos: VideoComAula[] = useMemo(() => {
    return aulas.flatMap((aula) =>
      aula.conteudos
        .filter((conteudo) => conteudo.tipo === 'VIDEO')
        .map((conteudo) => ({ aula, conteudo }))
    );
  }, [aulas]);

  const videoAtual = videos[indiceVideoAtual] || null;
  const videoConcluido =
    !!videoAtual &&
    !!statusAulas[videoAtual.aula.id]?.conteudosConcluidos?.includes(
      videoAtual.conteudo.id
    );
  const totalVideos = videos.length;

  // 📚 Computar PDFs da aula atual
  const pdfsAulaAtual = useMemo(() => {
    if (!videoAtual) return [];
    return videoAtual.aula.conteudos.filter((c) => c.tipo === 'PDF');
  }, [videoAtual]);

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

  // 📚 Abrir PDF
  const handleAbrirPdf = useCallback(async (url: string, titulo: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('Não é possível abrir o PDF:', url);
      }
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
    }
  }, []);

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

      {/* Título da aula */}
      {videoAtual && (
        <View style={styles.aulaTituloContainer}>
          <Text style={styles.aulaTitulo} numberOfLines={2}>
            Aula {aulas.findIndex((a) => a.id === videoAtual.aula.id) + 1} -{' '}
            {videoAtual.aula.nome}
          </Text>
          <TouchableOpacity
            style={[
              styles.statusToggle,
              videoConcluido && styles.statusToggleActive,
            ]}
            onPress={() =>
              toggleConteudo(
                videoAtual.conteudo.id,
                videoAtual.aula.id,
                videoConcluido
              )
            }
            accessibilityRole="button"
            accessibilityLabel={
              videoConcluido
                ? 'Marcar aula como não concluída'
                : 'Marcar aula como concluída'
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name={videoConcluido ? 'checkmark' : 'checkmark-outline'}
              size={18}
              color={videoConcluido ? '#16A34A' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Player de vídeo */}
        {videoAtual && (
          <View style={styles.playerSection}>
            {/* Player com controles de navegação */}
            <View style={styles.playerContainer}>
              {indiceVideoAtual > 0 && (
                <TouchableOpacity style={styles.navButton} onPress={voltar}>
                  <ChevronLeft size={13} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <View style={styles.playerWrapper}>
                <VideoPlayer
                  uri={videoAtual.conteudo.url}
                  onEnded={handleVideoEnded}
                  onError={(error) => console.error('Erro no player:', error)}
                />
              </View>
              {indiceVideoAtual < totalVideos - 1 && (
                <TouchableOpacity style={styles.navButton} onPress={avancar}>
                  <ChevronRight size={13} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
              {[
                { id: 'materiais', label: 'Livros Digitais' },
                { id: 'duvidas', label: 'Dúvidas' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabButton,
                    abaAtiva === tab.id && styles.tabButtonAtiva,
                  ]}
                  onPress={() => setAbaAtiva(tab.id as typeof abaAtiva)}
                  activeOpacity={0.9}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      abaAtiva === tab.id && styles.tabButtonTextAtiva,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conteúdo da aba Materiais */}
            {abaAtiva === 'materiais' && (
              <View style={styles.tabContent}>
                {pdfsAulaAtual.length === 0 ? (
                  <Text style={styles.tabContentText}>
                    Não há livros digitais disponíveis para esta aula.
                  </Text>
                ) : (
                  <View style={styles.pdfList}>
                    {pdfsAulaAtual.map((pdf) => (
                      <TouchableOpacity
                        key={pdf.id}
                        style={styles.pdfItem}
                        onPress={() => handleAbrirPdf(pdf.url, pdf.titulo)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.pdfIconContainer}>
                          <Ionicons name="document-text" size={20} color="#7A34FF" />
                        </View>
                        <Text style={styles.pdfTitulo} numberOfLines={2}>
                          {pdf.titulo}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Conteúdo da aba Dúvidas */}
            {abaAtiva === 'duvidas' && (
              <View style={styles.tabContent}>
                <Text style={styles.tabContentTitle}>Dúvidas</Text>
                <Text style={styles.tabContentText}>
                  Tire suas dúvidas com nossos professores direto pelo fórum da aula
                  (disponível em breve).
                </Text>
              </View>
            )}
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
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 12,
    fontFamily: getInterFont('700'),
  },
  headerSpacer: {
    width: 32,
  },
  aulaTituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  aulaTitulo: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontFamily: getInterFont('500'),
  },
  scrollContent: {
    paddingBottom: 20,
  },
  playerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerWrapper: {
    flex: 1,
  },
  tabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 2,
    marginTop: 16,
    gap: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonAtiva: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: getInterFont('500'),
  },
  tabButtonTextAtiva: {
    color: '#111827',
    fontFamily: getInterFont('500'),
  },
  navButton: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#30C58E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    marginTop: 16,
    gap: 6,
  },
  videoInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabContent: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  tabContentTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: getInterFont('600'),
  },
  tabContentText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: getInterFont('400'),
  },
  videoTitulo: {
    fontSize: 16,
    color: '#333',
    fontFamily: getInterFont('500'),
  },
  statusToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusToggleActive: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  // 📚 Novos estilos para PDFs
  pdfList: {
    gap: 8,
  },
  pdfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  pdfIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfTitulo: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontFamily: getInterFont('500'),
  },
});