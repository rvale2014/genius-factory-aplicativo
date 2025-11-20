import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { invalidarCacheCaminho, obterCaminho } from '../../../../../src/services/caminhoService';

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
  const initialLoadedRef = useRef(false);
  // Mantém um Set de blocos que estão em modo "refazer" (AsyncStorage limpo, mas backend ainda indica concluído)
  const [blocosEmRefazer, setBlocosEmRefazer] = useState<Set<string>>(new Set());

  // ✅ NOVO: Refs para controle de scroll
  const scrollViewRef = useRef<ScrollView>(null);
  const blocoPosicoes = useRef<Record<string, number>>({});

  /**
   * Restaura o scroll para o bloco de referência quando retorna de "fora"
   */
  const restaurarScrollParaBlocoReferencia = useCallback(async (
    caminhoId: string,
    dados: TrilhasCaminhoResponse
  ) => {
    try {
      const chave = `@geniusfactory:caminho-bloco-ref-${caminhoId}`;
      const blocoRefId = await AsyncStorage.getItem(chave);
      
      if (!blocoRefId) {
        console.log('[restaurarScroll] ℹ️ Sem bloco de referência salvo');
        return;
      }
      
      console.log(`[restaurarScroll] 📍 Bloco de referência: ${blocoRefId}`);
      
      // Aguarda um pouco para garantir que os blocos foram renderizados e posições capturadas
      setTimeout(() => {
        const posicaoY = blocoPosicoes.current[blocoRefId];
        
        if (posicaoY !== undefined) {
          console.log(`[restaurarScroll] ⬇️ Fazendo scroll para Y=${posicaoY}`);
          scrollViewRef.current?.scrollTo({ 
            y: Math.max(0, posicaoY - 100), // Offset de 100px para não ficar colado no topo
            animated: true 
          });
        } else {
          console.log(`[restaurarScroll] ⚠️ Posição do bloco ${blocoRefId} ainda não capturada`);
        }
      }, 300); // Aguarda 300ms para garantir que o layout foi calculado
    } catch (error) {
      console.error('[restaurarScroll] ❌ Erro:', error);
    }
  }, []);

  // Função de recarregamento silencioso (sem mostrar loading)
  const recarregarSilencioso = useCallback(async () => {
    if (!trilhaId || !caminhoId) return;
    try {
      console.log('[recarregarSilencioso] 🔄 Recarregando dados do caminho...');
      setErro(null);
      // Força busca de dados novos (ignora cache se necessário)
      // Como o cache já foi invalidado antes de navegar de volta, isso garante dados atualizados
      const dados = await obterCaminho(trilhaId, caminhoId);
      console.log('[recarregarSilencioso] ✅ Dados recarregados:', {
        totalBlocos: dados.blocos.length,
        blocos: dados.blocos.map(b => ({
          id: b.id,
          titulo: b.titulo,
          concluido: b.atividades.every(a => a.concluido)
        }))
      });
      setData(dados);
      
      // ✅ NOVO: Restaurar scroll para bloco de referência quando retorna de "fora"
      await restaurarScrollParaBlocoReferencia(caminhoId, dados);
    } catch (e: any) {
      // Erro silencioso - não mostra mensagem para não interromper a experiência
      console.error('[recarregarSilencioso] ❌ Erro ao recarregar caminho:', e);
    }
  }, [trilhaId, caminhoId, restaurarScrollParaBlocoReferencia]);

  // Carregamento inicial
  useEffect(() => {
    async function carregarCaminho() {
      try {
        setLoading(true);
        setErro(null);
        const dados = await obterCaminho(trilhaId, caminhoId);
        setData(dados);
        initialLoadedRef.current = true;
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

  // Recarregar quando a tela ganha foco (silenciosamente)
  useFocusEffect(
    useCallback(() => {
      if (initialLoadedRef.current) {
        // O cache já foi invalidado antes de navegar de volta do bloco
        // Isso garante que dados atualizados sejam buscados
        recarregarSilencioso();
      }
    }, [recarregarSilencioso])
  );

  const handleSelecionarCaminho = (novoCaminhoId: string) => {
    setModalCaminhosVisible(false);
    if (novoCaminhoId !== caminhoId) {
      router.replace(`/trilhas/${trilhaId}/caminhos/${novoCaminhoId}`);
    }
  };

  /**
   * Verifica quais blocos estão em modo "refazer" (AsyncStorage limpo mas backend ainda indica concluído)
   */
  useEffect(() => {
    async function verificarBlocosEmRefazer() {
      if (!data) return;
      
      console.log('[CaminhoScreen] 🔍 Verificando blocos em modo refazer...');
      const blocosRefazer = new Set<string>();
      
      for (const bloco of data.blocos) {
        // Se o bloco está concluído no backend (todas atividades concluídas)
        const todasAtividadesConcluidas = bloco.atividades.every(a => a.concluido);
        
        if (todasAtividadesConcluidas) {
          // Vamos usar uma flag no AsyncStorage para marcar blocos em modo refazer
          const refazerKey = `@geniusfactory:refazer-bloco-${bloco.id}`;
          const emRefazer = await AsyncStorage.getItem(refazerKey);
          console.log(`[CaminhoScreen] 📦 Bloco ${bloco.id} (${bloco.titulo}): concluído=${todasAtividadesConcluidas}, flagRefazer=${emRefazer}`);
          
          if (emRefazer === 'true') {
            blocosRefazer.add(bloco.id);
            console.log(`[CaminhoScreen] ✅ Bloco ${bloco.id} está em modo REFAZER`);
          }
        }
      }
      
      console.log(`[CaminhoScreen] 📊 Blocos em refazer: ${Array.from(blocosRefazer).join(', ') || 'nenhum'}`);
      setBlocosEmRefazer(blocosRefazer);
    }
    
    verificarBlocosEmRefazer();
  }, [data]);

  /**
   * Salva qual bloco é a "referência" para retorno futuro
   * Lógica: próximo bloco não concluído OU último bloco se todos concluídos
   */
  const salvarBlocoReferencia = useCallback(async () => {
    if (!data || !caminhoId) return;
    
    try {
      // Encontra o próximo bloco não concluído (considerando blocos em refazer)
      let blocoReferencia: string | null = null;
      
      for (const bloco of data.blocos) {
        const todasAtividadesConcluidas = bloco.atividades.every(a => a.concluido);
        const estaEmRefazer = blocosEmRefazer.has(bloco.id);
        const isConcluidoFinal = todasAtividadesConcluidas && !estaEmRefazer;
        
        if (!isConcluidoFinal) {
          blocoReferencia = bloco.id;
          console.log(`[salvarBlocoRef] 🎯 Próximo bloco a fazer: ${bloco.id} (${bloco.titulo})`);
          break;
        }
      }
      
      // Se todos estão concluídos, usa o último bloco
      if (!blocoReferencia && data.blocos.length > 0) {
        blocoReferencia = data.blocos[data.blocos.length - 1].id;
        console.log(`[salvarBlocoRef] 🏁 Todos concluídos, usando último bloco: ${blocoReferencia}`);
      }
      
      if (blocoReferencia) {
        const chave = `@geniusfactory:caminho-bloco-ref-${caminhoId}`;
        await AsyncStorage.setItem(chave, blocoReferencia);
        console.log(`[salvarBlocoRef] ✅ Bloco de referência salvo: ${blocoReferencia}`);
      }
    } catch (error) {
      console.error('[salvarBlocoRef] ❌ Erro:', error);
    }
  }, [data, caminhoId, blocosEmRefazer]);

  /**
   * Captura a posição Y de cada bloco quando é renderizado
   */
  const handleBlocoLayout = useCallback((blocoId: string, y: number) => {
    blocoPosicoes.current[blocoId] = y;
    console.log(`[handleBlocoLayout] 📐 Bloco ${blocoId} em Y=${y}`);
  }, []);

  /**
   * Limpa todo o AsyncStorage relacionado a um bloco específico
   */
  const limparPersistenciaBloco = useCallback(async (blocoId: string) => {
    try {
      console.log(`[limparPersistenciaBloco] 🧹 Iniciando limpeza do bloco ${blocoId}`);
      
      // 1. Marca o bloco como em modo "refazer"
      await AsyncStorage.setItem(`@geniusfactory:refazer-bloco-${blocoId}`, 'true');
      console.log(`[limparPersistenciaBloco] ✅ Flag de refazer salva para bloco ${blocoId}`);
      
      // 2. Remove as chaves principais do bloco
      const chavesPrincipais = [
        `@geniusfactory:pos-bloco-${blocoId}`,
        `@geniusfactory:done-bloco-${blocoId}`,
        `@geniusfactory:erro-bloco-${blocoId}`,
      ];

      // 3. Busca todas as chaves do AsyncStorage para encontrar as relacionadas ao bloco
      const todasChaves = await AsyncStorage.getAllKeys();
      console.log(`[limparPersistenciaBloco] 📋 Total de chaves no AsyncStorage: ${todasChaves.length}`);
      
      // Filtra chaves relacionadas ao bloco:
      // - questao-estado-${blocoId}-${questaoId}
      // - marcada-${blocoId}-${questaoId}
      // - resposta-bloco-${blocoId}-${questaoId}
      const prefixoBloco = `@geniusfactory:`;
      const chavesQuestoes = todasChaves.filter((key) => {
        if (!key.startsWith(prefixoBloco)) return false;
        const sufixo = key.replace(prefixoBloco, '');
        return (
          sufixo.startsWith(`questao-estado-${blocoId}-`) ||
          sufixo.startsWith(`marcada-${blocoId}-`) ||
          sufixo.startsWith(`resposta-bloco-${blocoId}-`)
        );
      });

      // 4. Remove todas as chaves relacionadas
      const todasChavesParaRemover = [...chavesPrincipais, ...chavesQuestoes];
      console.log(`[limparPersistenciaBloco] 🗑️ Removendo ${todasChavesParaRemover.length} chaves:`, todasChavesParaRemover);
      
      if (todasChavesParaRemover.length > 0) {
        await AsyncStorage.multiRemove(todasChavesParaRemover);
        console.log(`[limparPersistenciaBloco] ✅ Chaves removidas com sucesso`);
      } else {
        console.log(`[limparPersistenciaBloco] ℹ️ Nenhuma chave para remover`);
      }
    } catch (error) {
      console.error('[limparPersistenciaBloco] ❌ Erro:', error);
    }
  }, []);

  const handlePressBloco = useCallback(async (blocoId: string, isConcluido: boolean) => {
    console.log(`[handlePressBloco] 🖱️ Bloco clicado: ${blocoId}, isConcluido: ${isConcluido}`);
    
    // ✅ NOVO: Remove a referência ao entrar no bloco para evitar scroll indesejado
    try {
      const chave = `@geniusfactory:caminho-bloco-ref-${caminhoId}`;
      await AsyncStorage.removeItem(chave);
      console.log(`[handlePressBloco] 🗑️ Referência de scroll removida`);
    } catch (error) {
      console.error('[handlePressBloco] ❌ Erro ao remover referência:', error);
    }
    
    // Se o bloco está concluído, mostra confirmação
    if (isConcluido) {
      Alert.alert(
        'Bloco Concluído',
        'Este bloco já foi concluído. O que você deseja fazer?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Revisar',
            onPress: () => {
              console.log(`[handlePressBloco] 👀 Revisar bloco ${blocoId}`);
              // Navega sem limpar o AsyncStorage
              router.push(`/trilhas/${trilhaId}/caminhos/${caminhoId}/blocos/${blocoId}`);
            },
          },
          {
            text: 'Refazer',
            style: 'destructive',
            onPress: async () => {
              console.log(`[handlePressBloco] 🔄 REFAZER bloco ${blocoId} - Iniciando...`);
              
              // Limpa o AsyncStorage
              await limparPersistenciaBloco(blocoId);
              console.log(`[handlePressBloco] ✅ AsyncStorage limpo`);
              
              // Invalida o cache
              await invalidarCacheCaminho(trilhaId, caminhoId);
              console.log(`[handlePressBloco] ✅ Cache invalidado`);
              
              // Recarrega os dados
              await recarregarSilencioso();
              console.log(`[handlePressBloco] ✅ Dados recarregados`);
              
              // CRÍTICO: Aguarda 300ms para garantir que AsyncStorage foi completamente limpo
              // AsyncStorage.multiRemove é assíncrono e pode não ter terminado imediatamente
              await new Promise(resolve => setTimeout(resolve, 300));
              console.log(`[handlePressBloco] ✅ AsyncStorage estabilizado`);
              
              // Navega para o bloco
              router.push(`/trilhas/${trilhaId}/caminhos/${caminhoId}/blocos/${blocoId}`);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      // Se não está concluído, navega normalmente
      console.log(`[handlePressBloco] ➡️ Navegando normalmente para bloco ${blocoId}`);
      router.push(`/trilhas/${trilhaId}/caminhos/${caminhoId}/blocos/${blocoId}`);
    }
  }, [trilhaId, caminhoId, router, limparPersistenciaBloco, recarregarSilencioso]);
  
  // Força atualização do estado blocosEmRefazer após recarregar dados
  useEffect(() => {
    if (data) {
      console.log('[CaminhoScreen] 📊 Estado atual do blocosEmRefazer:', Array.from(blocosEmRefazer));
    }
  }, [data, blocosEmRefazer]);

  // Salva a referência sempre que os dados mudam
  useEffect(() => {
    if (data && data.blocos.length > 0) {
      salvarBlocoReferencia();
    }
  }, [data, blocosEmRefazer, salvarBlocoReferencia]);

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
  const atividadesConcluidas = data.blocos.reduce((sum, bloco) => {
    // Se o bloco está em modo "refazer", não conta as atividades como concluídas
    const estaEmRefazer = blocosEmRefazer.has(bloco.id);
    if (estaEmRefazer) {
      return sum; // Não conta nenhuma atividade deste bloco
    }
    return sum + bloco.atividades.filter(a => a.concluido).length;
  }, 0);
  const percentualGeral = totalAtividades > 0
    ? Math.round((atividadesConcluidas / totalAtividades) * 100)
    : 0;

  // Determina quais blocos estão desbloqueados
  const blocosComStatus = data.blocos.map((bloco, index) => {
    const todasAtividadesConcluidas = bloco.atividades.every(a => a.concluido);
    // Se o bloco está em modo "refazer", não considera como concluído visualmente
    const estaEmRefazer = blocosEmRefazer.has(bloco.id);
    const blocoAnteriorConcluido = index === 0 || 
      data.blocos[index - 1].atividades.every(a => a.concluido);

    const isConcluidoFinal = todasAtividadesConcluidas && !estaEmRefazer;
    
    if (index === 0 || todasAtividadesConcluidas || estaEmRefazer) {
      console.log(`[blocosComStatus] 📦 Bloco ${bloco.id} (${bloco.titulo}): concluídoBackend=${todasAtividadesConcluidas}, emRefazer=${estaEmRefazer}, isConcluidoFinal=${isConcluidoFinal}`);
    }

    return {
      ...bloco,
      isDesbloqueado: blocoAnteriorConcluido,
      // Se está em modo refazer, considera como não concluído para efeito visual
      isConcluido: isConcluidoFinal,
    };
  });

  const {
    gradient: gradiente,
    decorImage: trilhaDecor,
    secondaryDecorImage: trilhaDecorSecondary,
  } = getMateriaVisualConfig(data.trilha.materiaNome);
  const progressOffset = PROGRESS_CIRC * (1 - percentualGeral / 100);

  // Verifica se o caminho está 100% concluído
  const caminhoConcluido = percentualGeral === 100 && blocosEmRefazer.size === 0;
  
  // Encontra o próximo caminho
  const proximoCaminho = caminhoConcluido
    ? data.trilha.caminhos.find(c => c.ordem === data.caminho.ordem + 1)
    : null;

  const handleIrParaProximoCaminho = () => {
    if (proximoCaminho) {
      router.replace(`/trilhas/${trilhaId}/caminhos/${proximoCaminho.id}`);
    }
  };

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
            onPress={() => router.push('/trilhas')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {data.trilha.titulo}
          </Text>
          <View style={{ width: 44 }} />
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

          {caminhoConcluido && proximoCaminho ? (
            <TouchableOpacity
              style={styles.proximoCaminhoSetaHeader}
              onPress={handleIrParaProximoCaminho}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
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
          )}
        </View>

        {/* Caminho de Blocos (estilo Duolingo) */}
        <ScrollView
          ref={scrollViewRef}
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
                onLayout={(event) => {
                  const { y } = event.nativeEvent.layout;
                  handleBlocoLayout(bloco.id, y);
                }}
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
                    onPress={() => handlePressBloco(bloco.id, bloco.isConcluido)}
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
  proximoCaminhoSetaHeader: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1CC5A5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
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