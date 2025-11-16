// app/(app)/conquistas.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ConquistaItem } from '../../src/schemas/conquistas';
import { obterConquistas } from '../../src/services/conquistasService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 140;
const CARD_MARGIN = 8;

// Placeholder para imagens com erro
const placeholderImage = require('../../assets/images/logo_genius.webp');

// Helper para obter a fonte Inter correta
function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

// Componente para carregar imagem com fallback
function ImageWithFallback({
  uri,
  style,
  grayscale = false,
}: {
  uri: string;
  style: any;
  grayscale?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !uri) {
    return <Image source={placeholderImage} style={style} resizeMode="contain" />;
  }

  return (
    <Image
      source={{ uri }}
      style={[style, grayscale && styles.grayscaleImage]}
      resizeMode="contain"
      onError={() => setImageError(true)}
    />
  );
}

// Card individual de conquista
function ConquistaCard({ conquista }: { conquista: ConquistaItem }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const handleLongPress = () => {
    setTooltipVisible(true);
  };

  const closeTooltip = () => {
    setTooltipVisible(false);
  };

  return (
    <>
      <View style={styles.conquistaCardWrapper}>
        <Pressable
          style={styles.conquistaCard}
          onPress={() => setTooltipVisible(true)}
          onLongPress={handleLongPress}
          delayLongPress={300}
        >
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setTooltipVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.cardImageContainer}>
            <ImageWithFallback
              uri={conquista.imagemUrl}
              style={styles.cardImage}
              grayscale={!conquista.desbloqueada}
            />
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {conquista.titulo || conquista.nome}
          </Text>
          <View
            style={[
              styles.cardBadge,
              conquista.desbloqueada ? styles.badgeDesbloqueada : styles.badgeBloqueada,
            ]}
          >
            <Ionicons
              name={conquista.desbloqueada ? 'checkmark-circle' : 'lock-closed'}
              size={12}
              color={conquista.desbloqueada ? '#A855F7' : '#60A5FA'}
            />
            <Text
              style={[
                styles.badgeText,
                conquista.desbloqueada ? styles.badgeTextDesbloqueada : styles.badgeTextBloqueada,
              ]}
            >
              {conquista.desbloqueada ? 'Desbloqueada' : 'Bloqueada'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Tooltip Modal */}
      <Modal
        visible={tooltipVisible}
        transparent
        animationType="fade"
        onRequestClose={closeTooltip}
      >
        <Pressable style={styles.tooltipOverlay} onPress={closeTooltip}>
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipTitle}>{conquista.titulo}</Text>
              <TouchableOpacity onPress={closeTooltip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.tooltipDivider} />
            <Text style={styles.tooltipSectionTitle}>Descrição</Text>
            <Text style={styles.tooltipText}>{conquista.descricao}</Text>
            <Text style={styles.tooltipSectionTitle}>Critério</Text>
            <Text style={styles.tooltipText}>{conquista.criterio}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// Seção de categoria com scroll horizontal
function CategoriaSection({
  titulo,
  conquistas,
}: {
  titulo: string;
  conquistas: ConquistaItem[];
}) {
  const desbloqueadas = conquistas.filter((c) => c.desbloqueada).length;
  const total = conquistas.length;
  const percentual = total > 0 ? Math.round((desbloqueadas / total) * 100) : 0;

  return (
    <View style={styles.categoriaSection}>
      <View style={styles.categoriaHeader}>
        <Text style={styles.categoriaTitle}>{titulo}</Text>
        <Text style={styles.categoriaProgresso}>
          {desbloqueadas}/{total} ({percentual}%)
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.conquistasScroll}
      >
        {conquistas.map((conquista) => (
          <ConquistaCard key={conquista.id} conquista={conquista} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function ConquistasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [conquistas, setConquistas] = useState<ConquistaItem[]>([]);
  const [tabAtiva, setTabAtiva] = useState<'conquistas' | 'especiais'>('conquistas');

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const dados = await obterConquistas();
        setConquistas(dados.conquistas);
      } catch (e: any) {
        console.error('Erro ao carregar conquistas:', e);
        setErro('Não foi possível carregar as conquistas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando conquistas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (erro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#b00020" />
          <Text style={styles.errorText}>{erro}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              setLoading(true);
              setErro(null);
              try {
                const dados = await obterConquistas();
                setConquistas(dados.conquistas);
              } catch (e: any) {
                setErro('Não foi possível carregar as conquistas.');
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

  // Separar conquistas por tipo
  const conquistasNormais = conquistas.filter((c) => !c.especial);
  const conquistasEspeciais = conquistas.filter((c) => c.especial);

  // Agrupar conquistas normais por categoria
  const categorias = {
    Progresso: conquistasNormais.filter((c) => c.categoria === 'Progresso'),
    Consistência: conquistasNormais.filter((c) => c.categoria === 'Consistência'),
    Desempenho: conquistasNormais.filter((c) => c.categoria === 'Desempenho'),
    Exploração: conquistasNormais.filter((c) => c.categoria === 'Exploração'),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(app)/dashboard')}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color="#EB1480" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conquistas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tabAtiva === 'conquistas' && styles.tabAtiva]}
          onPress={() => setTabAtiva('conquistas')}
        >
          <Text style={[styles.tabText, tabAtiva === 'conquistas' && styles.tabTextAtiva]}>
            Badges de Conquista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabAtiva === 'especiais' && styles.tabAtiva]}
          onPress={() => setTabAtiva('especiais')}
        >
          <Text style={[styles.tabText, tabAtiva === 'especiais' && styles.tabTextAtiva]}>
            Badges Especiais
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tabAtiva === 'conquistas' ? (
          <>
            {Object.entries(categorias).map(([categoria, items]) =>
              items.length > 0 ? (
                <CategoriaSection key={categoria} titulo={categoria} conquistas={items} />
              ) : null
            )}
          </>
        ) : (
          <View style={styles.especialSection}>
            {conquistasEspeciais.length > 0 ? (
              <View style={styles.especialGrid}>
                {conquistasEspeciais.map((conquista) => (
                  <ConquistaCard key={conquista.id} conquista={conquista} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Nenhuma badge especial disponível</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabAtiva: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: getInterFont('600'),
  },
  tabTextAtiva: {
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  categoriaSection: {
    marginBottom: 24,
  },
  categoriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoriaTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Inter-Medium',
  },
  categoriaProgresso: {
    fontSize: 14,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  conquistasScroll: {
    paddingHorizontal: 20,
    gap: CARD_MARGIN,
  },
  conquistaCardWrapper: {
    position: 'relative',
  },
  conquistaCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
  },
  cardImageContainer: {
    width: '100%',
    height: 80,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: 70,
    height: 70,
  },
  grayscaleImage: {
    opacity: 0.5,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 32,
    fontFamily: 'Inter-Medium',
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  badgeDesbloqueada: {
    backgroundColor: '#F3E8FF',
  },
  badgeBloqueada: {
    backgroundColor: '#E0F2FE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  badgeTextDesbloqueada: {
    color: '#A855F7',
  },
  badgeTextBloqueada: {
    color: '#60A5FA',
  },
  especialSection: {
    paddingHorizontal: 20,
  },
  especialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_MARGIN,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontFamily: getInterFont('400'),
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    fontFamily: getInterFont('700'),
  },
  tooltipDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  tooltipSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
    fontFamily: getInterFont('600'),
  },
  tooltipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontFamily: getInterFont('400'),
  },
});