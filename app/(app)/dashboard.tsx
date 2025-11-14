import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Award, BookOpen, Gauge, TrendingDown, TrendingUp, Trophy } from 'lucide-react-native';
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
import { GaugeChart } from '../../components/GaugeChart';
import { api } from '../../src/lib/api';
import { getBaseUrl } from '../../src/lib/baseUrl';
import type { DashboardResponse } from '../../src/schemas/dashboard';
import { primeAlunoHeaderCache } from '../../src/services/alunoHeaderService';
import { obterDashboard } from '../../src/services/dashboardService';

const { width } = Dimensions.get('window');

// Placeholder image para quando não há imagem
const placeholderImage = require('../../assets/images/logo_genius.webp');
const diamondImage = require('../../assets/images/diamante.webp');
const trophyImage = require('../../assets/images/trofeu.webp');

// Componente para carregar imagem com fallback
function ImageWithFallback({ 
  uri, 
  style, 
  placeholder 
}: { 
  uri: string | null; 
  style: any; 
  placeholder: any;
}) {
  const [imageError, setImageError] = useState(false);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    // Reset states when URI changes
    setImageError(false);
    setIsRenewing(false);
    
    async function loadImage() {
      if (!uri || typeof uri !== 'string' || uri.trim() === '') {
        setFinalUrl(null);
        return;
      }

      let processedUri = uri.trim();
      
      if (processedUri.startsWith('http://') || processedUri.startsWith('https://')) {
        // Já é uma URL absoluta
        // Para URLs do Firebase Storage, tenta usar diretamente primeiro
        try {
          const url = new URL(processedUri);
          const normalizedUrl = url.toString();
          setFinalUrl(normalizedUrl);
        } catch (e) {
          setFinalUrl(processedUri);
        }
      } else if (processedUri.startsWith('/')) {
        // Caminho relativo - constrói URL completa
        const baseUrl = getBaseUrl().replace('/api', '');
        setFinalUrl(`${baseUrl}${processedUri}`);
      } else {
        setFinalUrl(null);
      }
    }

    loadImage();
  }, [uri]);

  // Função para renovar o token via endpoint proxy
  const renewToken = async (firebaseUrl: string) => {
    try {
      setIsRenewing(true);
  
      // ⚠️ Envie a URL crua; o axios já faz o encode dos query params.
      const response = await api.get('/mobile/v1/image-proxy', {
        params: { url: firebaseUrl },
      });
  
      if (response.data?.url) {
        setFinalUrl(response.data.url);
        setImageError(false);
      } else {
        console.warn('Resposta do endpoint não contém URL:', response.data);
        setImageError(true);
      }
    } catch (error: any) {
                  console.error('Erro ao renovar token da imagem:', error);
                  console.error('Status:', error.response?.status);
                  console.error('Detalhes do erro:', error.response?.data || error.message);
      setImageError(true);
    } finally {
      setIsRenewing(false);
    }
  };
  

  // Se não houver URL ou houver erro, mostra placeholder
  if (!finalUrl || (imageError && !isRenewing)) {
    return <Image source={placeholder} style={style} resizeMode="cover" />;
  }

  // Se estiver renovando, mostra placeholder
  if (isRenewing) {
    return <Image source={placeholder} style={style} resizeMode="cover" />;
  }

  // Tenta carregar a imagem diretamente
  // Se houver erro 403, tenta renovar o token via endpoint proxy
  return (
    <Image
      source={{ uri: finalUrl }}
      style={style}
      resizeMode="cover"
      onError={(error) => {
        const errorMsg = error.nativeEvent?.error || 'Unknown error';
        const is403 = errorMsg.includes('403') || errorMsg.includes('Forbidden');
        
        if (is403 && finalUrl && finalUrl.includes('firebasestorage.googleapis.com')) {
          // Se for erro 403 em URL do Firebase Storage, tenta renovar o token
          console.warn('Token expirado, tentando renovar:', finalUrl);
          renewToken(finalUrl);
        } else {
          console.warn('Erro ao carregar imagem:', {
            uri: finalUrl,
            error: errorMsg,
            is403,
          });
          setImageError(true);
        }
      }}
    />
  );
}

// Helper para obter o nome correto da fonte Inter baseado no fontWeight
function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setLoading(true);
        setErro(null);
        const dados = await obterDashboard();
        setData(dados);
        primeAlunoHeaderCache({
          nome: dados.aluno.nome,
          avatarUrl: dados.aluno.avatarUrl,
          geniusCoins: dados.aluno.geniusCoins,
        });
      } catch (e: any) {
        console.error('Erro ao carregar dashboard:', e);
        setErro('Não foi possível carregar os dados do dashboard. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    carregarDashboard();
  }, []);


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando dashboard...</Text>
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
            onPress={() => {
              setLoading(true);
              setErro(null);
                          obterDashboard()
                            .then((dadosAtualizados) => {
                              setData(dadosAtualizados);
                              primeAlunoHeaderCache({
                                nome: dadosAtualizados.aluno.nome,
                                avatarUrl: dadosAtualizados.aluno.avatarUrl,
                                geniusCoins: dadosAtualizados.aluno.geniusCoins,
                              });
                            })
                .catch((e) => {
                  console.error('Erro ao recarregar:', e);
                  setErro('Não foi possível carregar os dados.');
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

  const rankingDisplay = data.aluno.posicaoGlobal > 0 ? `${data.aluno.posicaoGlobal}°` : '-';
  const ultimaTrilha = data.ultimaTrilha;
  const ultimoCursoId = data.ultimoCurso?.id;

  const handleOpenUltimoCurso = () => {
    if (!ultimoCursoId) return;
    router.push({
      pathname: '/cursos/[id]',
      params: { id: ultimoCursoId },
    });
  };

  const handleOpenUltimaTrilha = () => {
    if (!ultimaTrilha) return;
    if (!ultimaTrilha.caminhoAtualId) {
      router.push('/trilhas');
      return;
    }
    router.push(`/trilhas/${ultimaTrilha.id}/caminhos/${ultimaTrilha.caminhoAtualId}`);
  };

  const handleOpenUltimoSimulado = () => {
    const simulado = data.ultimoSimulado;
    if (!simulado) return;

    const status = simulado.status;
    const resolverStatuses = new Set([
      'nao_iniciado',
      'nao-iniciado',
      'pausado',
      'em_andamento',
      'em-andamento',
    ]);

    if (status === 'finalizado') {
      router.push(`/simulados/${simulado.id}/resultado`);
      return;
    }

    if (resolverStatuses.has(status)) {
      router.push(`/simulados/${simulado.id}/resolver`);
      return;
    }

    // fallback
    router.push(`/simulados/${simulado.id}/resolver`);
  };

  const handleVerMeusSimulados = () => {
    router.push('/simulados/meusSimulados');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Card Principal: Banner do Aluno + Desempenho Médio */}
        <View style={styles.mainCard}>
          {/* 1. Banner do Aluno */}
          <LinearGradient
            colors={['#7A34FF', '#FF5FDB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bannerAluno}
          >
            <View style={styles.bannerContent}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  {data.aluno.avatarUrl ? (
                    <Image
                      source={{ uri: data.aluno.avatarUrl }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={40} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.bannerInfo}>
                <Text style={styles.alunoNome}>{data.aluno.nome}</Text>
                <View style={styles.infoRow}>
                  <View style={styles.pontosContainer}>
                    <Image source={diamondImage} style={styles.diamondIcon} resizeMode="contain" />
                    <Text style={styles.alunoPontos}>{data.aluno.geniusCoins}</Text>
                  </View>
                  <View style={styles.rankingContainer}>
                    <Image source={trophyImage} style={styles.trophyIcon} resizeMode="contain" />
                    <Text style={styles.rankingText}>{rankingDisplay}</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* 2. Desempenho Médio */}
          <View style={styles.desempenhoSection}>
            <Text style={styles.desempenhoTitle}>Desempenho médio</Text>

            <View style={styles.desempenhoRow}>
              {/* Gráfico Gauge */}
              <View style={styles.gaugeCard}>
                <GaugeChart
                  value={data.desempenhoGeral.alunoPct}
                  size={120}
                  strokeWidth={12}
                  gradientStart="#a855f7"
                  gradientEnd="#f472b6"
                  backgroundColor="rgba(168, 85, 247, 0.12)"
                  label="Taxa de acertos"
                  fontSize={20}
                  fontFamily={getInterFont('700')}
                />
              </View>

              {/* Indicador de Média */}
              <View style={styles.mediaCard}>
                <View style={styles.mediaIconContainer}>
                  {data.desempenhoGeral.acimaDaMedia ? (
                    <TrendingUp size={24} color="#14b8a6" strokeWidth={2} />
                  ) : (
                    <TrendingDown size={24} color="#b00020" strokeWidth={2} />
                  )}
                </View>
                <Text
                  style={[
                    styles.mediaPercentual,
                    { color: data.desempenhoGeral.acimaDaMedia ? '#14b8a6' : '#b00020' },
                  ]}
                >
                  {data.desempenhoGeral.deltaPct > 0 ? '+' : ''}
                  {data.desempenhoGeral.deltaPct.toFixed(1)}%
                </Text>
                <Text style={styles.mediaLabel}>
                  {data.desempenhoGeral.acimaDaMedia ? 'Acima da média' : 'Abaixo da média'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Cards de Navegação */}
        <View style={styles.section}>
          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/(app)/questoes')}
              accessibilityRole="button"
              accessibilityLabel="Ir para Questões"
            >
              <View style={[styles.navCardIcon, { backgroundColor: '#FFF0F8' }]}>
                <BookOpen size={22} color="#FF5FDB" strokeWidth={2} />
              </View>
              <Text style={styles.navCardText} numberOfLines={1}>
                Questões
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navCard}>
              <View style={[styles.navCardIcon, { backgroundColor: '#FFF0F8' }]}>
                <Gauge size={22} color="#FF5FDB" strokeWidth={2} />
              </View>
              <Text style={styles.navCardText} numberOfLines={1}>
                Performance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navCard}>
              <View style={[styles.navCardIcon, { backgroundColor: '#FFF0F8' }]}>
                <Trophy size={22} color="#FF5FDB" strokeWidth={2} />
              </View>
              <Text style={styles.navCardText} numberOfLines={1}>
                Ranking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navCard}>
              <View style={[styles.navCardIcon, { backgroundColor: '#FFF0F8' }]}>
                <Award size={22} color="#FF5FDB" strokeWidth={2} />
              </View>
              <Text style={styles.navCardText} numberOfLines={1}>
                Conquistas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Banner com Imagens (Carrossel) */}
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerScroll}
          >
            <LinearGradient
              colors={['#7A34FF', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bannerCard}
            >
              <View style={styles.bannerCardContent}>
                <View style={styles.bannerTag}>
                  <Text style={styles.bannerTagText}>Genius Factory</Text>
                </View>
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerTitle}>Aprendizado Inteligente para um futuro brilhante</Text>
                </View>
                <Image
                  source={require('../../assets/images/menino_e_robo.webp')}
                  style={styles.bannerImage}
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>
          </ScrollView>
        </View>

        {/* 5. Último Curso */}
        {data.ultimoCurso && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meus Cursos</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
            <TouchableOpacity
              style={styles.cursoCard}
              activeOpacity={0.85}
              onPress={handleOpenUltimoCurso}
            >
              <ImageWithFallback
                uri={data.ultimoCurso.imagemUrl}
                style={styles.cursoImage}
                placeholder={placeholderImage}
              />
              <View style={styles.cursoContent}>
                <Text style={styles.cursoTitle}>{data.ultimoCurso.titulo}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${data.ultimoCurso.progressoPercentual}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.cursoProgresso}>{data.ultimoCurso.progressoPercentual}%</Text>
                </View>
                <View style={styles.cursoInfo}>
                  <Ionicons name="book-outline" size={14} color="#666" />
                  <Text style={styles.cursoInfoText} numberOfLines={1}>
                    {data.ultimoCurso.materiaNome || 'Sem matéria'}
                  </Text>
                  <TouchableOpacity
                    style={styles.cursoButton}
                    activeOpacity={0.8}
                    onPress={handleOpenUltimoCurso}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. Última Trilha */}
        {ultimaTrilha && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Minhas Trilhas</Text>
              <TouchableOpacity onPress={handleOpenUltimaTrilha}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cursoCard}
              onPress={handleOpenUltimaTrilha}
              activeOpacity={0.85}
            >
              <ImageWithFallback
                uri={ultimaTrilha.imagemUrl}
                style={styles.cursoImage}
                placeholder={placeholderImage}
              />
              <View style={styles.cursoContent}>
                <Text style={styles.cursoTitle}>{ultimaTrilha.titulo}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${ultimaTrilha.progressoPercentual}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.cursoProgresso}>{ultimaTrilha.progressoPercentual}%</Text>
                </View>
                <View style={styles.cursoInfo}>
                  <Ionicons name="book-outline" size={14} color="#666" />
                  <Text style={styles.cursoInfoText} numberOfLines={1}>
                    {ultimaTrilha.materiaNome || 'Sem matéria'}
                  </Text>
                  <TouchableOpacity style={styles.cursoButton} onPress={handleOpenUltimaTrilha} activeOpacity={0.8}>
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 7. Último Simulado */}
        {data.ultimoSimulado && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meus Simulados</Text>
              <TouchableOpacity
                onPress={handleVerMeusSimulados}
                accessibilityRole="button"
                accessibilityLabel="Ver todos os simulados"
              >
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.simuladoCard} onPress={handleOpenUltimoSimulado} activeOpacity={0.75}>
              <Text style={styles.simuladoTitle}>{data.ultimoSimulado.titulo}</Text>
              <View style={styles.simuladoInfo}>
                <Ionicons name="book-outline" size={16} color="#666" />
                <Text style={styles.simuladoInfoText}>
                  {data.ultimoSimulado.materias.length > 0
                    ? data.ultimoSimulado.materias.join(', ')
                    : 'Sem matéria especificada'}
                </Text>
              </View>
              <View style={styles.simuladoInfo}>
                <Ionicons
                  name={
                    data.ultimoSimulado.status === 'finalizado'
                      ? 'checkmark-circle-outline'
                      : data.ultimoSimulado.status === 'em-andamento'
                      ? 'play-circle-outline'
                      : data.ultimoSimulado.status === 'pausado'
                      ? 'pause-circle-outline'
                      : 'time-outline'
                  }
                  size={16}
                  color="#666"
                />
                <Text style={styles.simuladoInfoText} numberOfLines={1}>
                  Status: {data.ultimoSimulado.status === 'finalizado' ? 'Finalizado' : data.ultimoSimulado.status === 'em-andamento' ? 'Em andamento' : data.ultimoSimulado.status === 'pausado' ? 'Pausado' : 'Não iniciado'}
                  {data.ultimoSimulado.desempenho !== null && ` • ${data.ultimoSimulado.desempenho}%`}
                </Text>
                <TouchableOpacity style={styles.simuladoButton} onPress={handleVerMeusSimulados} activeOpacity={0.75}>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
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
    backgroundColor: '#FF5FDB',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14b8a6',
  },
  mainCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerAluno: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 3,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: getInterFont('700'),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pontosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diamondIcon: {
    width: 24,
    height: 24,
  },
  alunoPontos: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: getInterFont('400'),
  },
  rankingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trophyIcon: {
    width: 26,
    height: 26,
  },
  rankingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: getInterFont('700'),
  },
  desempenhoSection: {
    padding: 0,
  },
  desempenhoTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    textAlign: 'left',
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  desempenhoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gaugeCard: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mediaCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeWrapper: {
    position: 'relative',
    marginBottom: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  gaugeBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  gaugeFillMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  gaugeFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  gaugeIndicator: {
    position: 'absolute',
    left: 0,
  },
  gaugePercentual: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    fontFamily: getInterFont('700'),
  },
  gaugeLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  mediaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaPercentual: {
    fontSize: 20,
    fontWeight: '700',
    color: '#14b8a6',
    marginBottom: 4,
    fontFamily: getInterFont('700'),
  },
  mediaLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  navCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 0,
  },
  navCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  navCardText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flexShrink: 1,
    fontFamily: getInterFont('600'),
    marginTop: -4,
  },
  bannerScroll: {
    paddingRight: 20,
  },
  bannerCard: {
    width: width - 40,
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
  },
  bannerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTag: {
    position: 'absolute',
    top: -2,
    left: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  bannerTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF5FDB',
    fontFamily: getInterFont('600'),
  },
  bannerTextContainer: {
    flex: 1,
    marginRight: 16,
    marginTop: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: getInterFont('700'),
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: getInterFont('400'),
  },
  bannerImage: {
    width: 140,
    height: 140,
  },
  cursoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cursoImage: {
    width: 150,
    height: 100,
    backgroundColor: '#F5F5F5',
  },
  cursoContent: {
    flex: 1,
    padding: 16,
  },
  cursoTitle: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF5FDB',
    borderRadius: 3,
  },
  cursoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 0,
    flex: 1,
  },
  cursoInfoText: {
    fontSize: 12,
    color: '#666',
    fontFamily: getInterFont('400'),
    flex: 1,
  },
  cursoProgresso: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7A34FF',
    fontFamily: getInterFont('700'),
  },
  cursoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  simuladoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simuladoTitle: {
    fontSize: 13,
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  simuladoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flex: 1,
  },
  simuladoInfoText: {
    fontSize: 12,
    color: '#666',
    fontFamily: getInterFont('400'),
    flex: 1,
  },
  simuladoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

