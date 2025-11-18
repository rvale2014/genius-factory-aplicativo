import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { BlocoCard } from '../../../../../components/trilhas/BlocoCard';
import { ModalCaminhos } from '../../../../../components/trilhas/ModalCaminhos';
import { getMateriaVisualConfig } from '../../../../../src/constants/materias';
import type { TrilhasCaminhoResponse } from '../../../../../src/schemas/trilhas.caminho-completo';
import { obterCaminho } from '../../../../../src/services/caminhoService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONNECTOR_HEIGHT = 70;
const CENTER_X = SCREEN_WIDTH / 2;
const NODE_OFFSET = SCREEN_WIDTH * 0.16;
const LEFT_NODE_X = CENTER_X - NODE_OFFSET;
const RIGHT_NODE_X = CENTER_X + NODE_OFFSET;
const PROGRESS_SIZE = 52;
const PROGRESS_STROKE = 5;
const PROGRESS_RADIUS = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
const PROGRESS_CIRC = 2 * Math.PI * PROGRESS_RADIUS;

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export default function CaminhoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; caminhoId: string }>();
  const { id: trilhaId, caminhoId } = params;

  const [data, setData] = useState<TrilhasCaminhoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalCaminhosVisible, setModalCaminhosVisible] = useState(false);

  useEffect(() => {
    async function carregarCaminho() {
      try {
        setLoading(true);
        setErro(null);
        const dados = await obterCaminho(trilhaId, caminhoId);
        setData(dados);
      } catch (e: any) {
        console.error('Erro ao carregar caminho:', e);
        setErro('Não foi possível carregar os dados do caminho. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    if (trilhaId && caminhoId) {
      carregarCaminho();
    }
  }, [trilhaId, caminhoId]);

  const handleSelecionarCaminho = (novoCaminhoId: string) => {
    setModalCaminhosVisible(false);
    if (novoCaminhoId !== caminhoId) {
      router.replace(`/trilhas/${trilhaId}/caminhos/${novoCaminhoId}`);
    }
  };

  const handlePressBloco = (blocoId: string) => {
    router.push(`/trilhas/${trilhaId}/caminhos/${caminhoId}/blocos/${blocoId}`)
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A34FF" />
          <Text style={styles.loadingText}>Carregando caminho...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (erro || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#b00020" />
          <Text style={styles.errorText}>{erro || 'Erro ao carregar dados'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              setLoading(true);
              setErro(null);
              try {
                const dados = await obterCaminho(trilhaId, caminhoId);
                setData(dados);
              } catch (e) {
                console.error('Erro ao recarregar:', e);
                setErro('Não foi possível carregar os dados.');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calcula progresso geral do caminho
  const totalAtividades = data.blocos.reduce(
    (sum, bloco) => sum + bloco.atividades.length,
    0
  );
  const atividadesConcluidas = data.blocos.reduce(
    (sum, bloco) => sum + bloco.atividades.filter(a => a.concluido).length,
    0
  );
  const percentualGeral = totalAtividades > 0
    ? Math.round((atividadesConcluidas / totalAtividades) * 100)
    : 0;

  // Determina quais blocos estão desbloqueados
  const blocosComStatus = data.blocos.map((bloco, index) => {
    const todasAtividadesConcluidas = bloco.atividades.every(a => a.concluido);
    const blocoAnteriorConcluido = index === 0 || 
      data.blocos[index - 1].atividades.every(a => a.concluido);

    return {
      ...bloco,
      isDesbloqueado: blocoAnteriorConcluido,
      isConcluido: todasAtividadesConcluidas,
    };
  });

  const {
    gradient: gradiente,
    decorImage: trilhaDecor,
    secondaryDecorImage: trilhaDecorSecondary,
  } = getMateriaVisualConfig(data.trilha.materiaNome);
  const progressOffset = PROGRESS_CIRC * (1 - percentualGeral / 100);

  return (
    <View style={styles.container}>
      {/* Background com Gradiente */}
      <LinearGradient
        colors={[...gradiente, '#1F2937']}
        locations={[0, 0.4, 1]}
        style={styles.backgroundGradient}
      />
      <Image source={trilhaDecor} style={styles.robotImage} resizeMode="contain" />
      <Image
        source={trilhaDecorSecondary}
        style={styles.kidsImage}
        resizeMode="contain"
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Topo com nome da trilha */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {data.trilha.titulo}
          </Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => router.push('/trilhas')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Header Caminho */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerCenter}
            onPress={() => setModalCaminhosVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerTitle} numberOfLines={2}>
              {data.caminho.ordem + 1}. {data.caminho.nome}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.progressCircle}>
            <Svg width={PROGRESS_SIZE} height={PROGRESS_SIZE}>
              <Circle
                cx={PROGRESS_SIZE / 2}
                cy={PROGRESS_SIZE / 2}
                r={PROGRESS_RADIUS}
                stroke="#FFFFFF"
                strokeWidth={PROGRESS_STROKE}
                fill="none"
              />
              <Circle
                cx={PROGRESS_SIZE / 2}
                cy={PROGRESS_SIZE / 2}
                r={PROGRESS_RADIUS}
                stroke="#1CC5A5"
                strokeWidth={PROGRESS_STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${PROGRESS_CIRC} ${PROGRESS_CIRC}`}
                strokeDashoffset={progressOffset}
                transform={`rotate(-90 ${PROGRESS_SIZE / 2} ${PROGRESS_SIZE / 2})`}
              />
            </Svg>
            <Text style={styles.progressCircleText}>{percentualGeral}%</Text>
          </View>
        </View>

        {/* Caminho de Blocos (estilo Duolingo) */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {blocosComStatus.map((bloco, index) => {
            const isLeft = index % 2 === 0;
            const showConnector = index < blocosComStatus.length - 1;
            return (
              <View
                key={bloco.id}
                style={[
                  styles.nodeContainer,
                  showConnector && styles.nodeWithConnector,
                ]}
              >
                <View
                  style={[
                    styles.blocoWrapper,
                    isLeft ? styles.blocoEsquerda : styles.blocoDireita,
                  ]}
                >
                  <BlocoCard
                    bloco={bloco}
                    index={index}
                    isDesbloqueado={bloco.isDesbloqueado}
                    isConcluido={bloco.isConcluido}
                    onPress={() => handlePressBloco(bloco.id)}
                  />
                </View>

                {showConnector && (
                  <Svg
                    width={SCREEN_WIDTH}
                    height={CONNECTOR_HEIGHT}
                    viewBox={`0 0 ${SCREEN_WIDTH} ${CONNECTOR_HEIGHT}`}
                    pointerEvents="none"
                    style={styles.connectorSvg}
                  >
                    <Path
                      d={
                        isLeft
                          ? `M ${LEFT_NODE_X} 8 C ${LEFT_NODE_X} ${CONNECTOR_HEIGHT * 0.5} ${RIGHT_NODE_X} ${
                              CONNECTOR_HEIGHT * 0.5
                            } ${RIGHT_NODE_X} ${CONNECTOR_HEIGHT - 8}`
                          : `M ${RIGHT_NODE_X} 8 C ${RIGHT_NODE_X} ${CONNECTOR_HEIGHT * 0.5} ${LEFT_NODE_X} ${
                              CONNECTOR_HEIGHT * 0.5
                            } ${LEFT_NODE_X} ${CONNECTOR_HEIGHT - 8}`
                      }
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth={4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </Svg>
                )}
              </View>
            );
          })}

          {/* Espaçamento final */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Caminhos */}
      <ModalCaminhos
        visible={modalCaminhosVisible}
        onClose={() => setModalCaminhosVisible(false)}
        trilha={data.trilha}
        caminhoAtualId={caminhoId}
        onSelecionarCaminho={handleSelecionarCaminho}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  robotImage: {
    position: 'absolute',
    top: '33%',
    right: 150,
    width: 240,
    height: 200,
    opacity: 0.35,
    pointerEvents: 'none',  
  },
  kidsImage: {
    position: 'absolute',
    bottom: '10%',
    left: 140,
    width: 320,
    height: 290,
    opacity: 0.35,
    pointerEvents: 'none',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
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
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 15,
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: getInterFont('500'),
    flexShrink: 1,
    marginRight: 6,
  },
  progressCircle: {
    width: PROGRESS_SIZE,
    height: PROGRESS_SIZE,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  infoButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    position: 'relative',
    paddingBottom: 20,
  },
  nodeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nodeWithConnector: {
    marginBottom: 22,
  },
  blocoWrapper: {
    width: '100%',
    paddingVertical: 6,
  },
  blocoEsquerda: {
    transform: [{ translateX: -NODE_OFFSET }],
  },
  blocoDireita: {
    transform: [{ translateX: NODE_OFFSET }],
  },
  connectorSvg: {
    marginTop: -16,
    marginBottom: -26,
    alignSelf: 'center',
  },
});