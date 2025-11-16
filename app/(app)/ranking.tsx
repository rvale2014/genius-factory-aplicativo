// app/(app)/ranking.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obterRanking, RankingData, RankingItem } from '../../src/services/rankingService';

const placeholderImage = require('../../assets/images/logo_genius.webp');

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

// Cores especiais para top 5 + padrão cíclico
function getAvatarBgColor(posicao: number): string {
  switch (posicao) {
    case 1: return '#FBBF24'; // Ouro
    case 2: return '#60A5FA'; // Azul
    case 3: return '#FB923C'; // Bronze
    case 4: return '#9CA3AF'; // Cinza
    case 5: return '#14B8A6'; // Teal
  }
  
  const padroes = [
    '#D8B4FE', '#F9A8D4', '#A5B4FC', '#86EFAC', '#FCA5A5',
    '#A5F3FC', '#FCD34D', '#D9F99D', '#6EE7B7', '#DDD6FE',
  ];
  
  const indicePadrao = (posicao - 6) % padroes.length;
  return padroes[indicePadrao];
}

// Componente de Avatar com fallback
function AvatarItem({
  src,
  avatarImageUrl,
  name,
  size = 40,
}: {
  src?: string | null;
  avatarImageUrl?: string | null;
  name: string;
  size?: number;
}) {
  const imageSrc = avatarImageUrl || src;
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'A';

  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      {imageSrc ? (
        <Image
          source={{ uri: imageSrc }}
          style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
            backgroundColor: '#a855f7',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: size / 3, fontFamily: getInterFont('700') }}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function RankingScreen() {
  const router = useRouter();
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<'geral' | 'semanal'>('geral');

  // Carregar dados
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        setErro(null);
        const dados = await obterRanking({ tipo: tipoSelecionado, limit: 100 });
        setData(dados);
      } catch (e: any) {
        console.error('Erro ao carregar ranking:', e);
        setErro('Não foi possível carregar o ranking. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [tipoSelecionado]);

  // Renderizar item do ranking
  const renderItem = ({ item, index }: { item: RankingItem; index: number }) => {
    const nomeExibicao = item.nickname || item.nome;
    const pontos = tipoSelecionado === 'semanal' ? item.moedasSemana ?? 0 : item.geniusCoins;
    const bgColor = getAvatarBgColor(item.posicao);

    return (
      <View style={styles.rankingItem}>
        <View style={styles.posicaoContainer}>
          <Text style={styles.posicaoText}>{item.posicao}</Text>
        </View>

        <View style={[styles.avatarContainer, { backgroundColor: bgColor }]}>
          <AvatarItem
            src={item.foto}
            avatarImageUrl={item.avatarImageUrl}
            name={nomeExibicao}
            size={36}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.nomeText} numberOfLines={1}>
            {nomeExibicao}
          </Text>
        </View>

        <View style={styles.pontosContainer}>
          <Text style={styles.pontosText}>{pontos}</Text>
          <Text style={styles.pontosLabel}>pontos</Text>
        </View>
      </View>
    );
  };

  // Card do aluno logado no topo
  const renderMeuCard = () => {
    if (!data?.minhaPosicao) return null;

    const meuItem = data.ranking.find((r) => r.posicao === data.minhaPosicao!.posicao);
    if (!meuItem) return null;

    const nomeExibicao = meuItem.nickname || meuItem.nome;
    const pontos = tipoSelecionado === 'semanal' 
      ? data.minhaPosicao.moedasSemana ?? 0 
      : data.minhaPosicao.geniusCoins;

    return (
      <View style={styles.meuCard}>
        <View style={styles.meuCardContent}>
          <View style={styles.meuCardLeft}>
            <View style={styles.meuAvatarContainer}>
              <AvatarItem
                src={meuItem.foto}
                avatarImageUrl={meuItem.avatarImageUrl}
                name={nomeExibicao}
                size={56}
              />
              <View style={styles.meuCardBadge}>
                <Text style={styles.meuCardBadgeText}>{data.minhaPosicao.posicao}</Text>
              </View>
            </View>
            <View style={styles.meuCardInfo}>
              <Text style={styles.meuCardNome}>{nomeExibicao}</Text>
              <Text style={styles.meuCardPosicao}>
                Você está na {data.minhaPosicao.posicao}ª posição
              </Text>
            </View>
          </View>
          <View style={styles.meuCardRight}>
            <Text style={styles.meuCardPontos}>{pontos}</Text>
            <Text style={styles.meuCardPontosLabel}>
              pontos {tipoSelecionado === 'semanal' ? 'esta semana' : 'total'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando ranking...</Text>
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
              obterRanking({ tipo: tipoSelecionado, limit: 100 })
                .then(setData)
                .catch(() => setErro('Não foi possível carregar o ranking.'))
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
        <TouchableOpacity
          onPress={() => router.push('/(app)/dashboard')}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color="#EB1480" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ranking</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Meu Card */}
      {renderMeuCard()}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tipoSelecionado === 'semanal' && styles.tabActive]}
          onPress={() => setTipoSelecionado('semanal')}
        >
          <Text
            style={[styles.tabText, tipoSelecionado === 'semanal' && styles.tabTextActive]}
          >
            Semanal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tipoSelecionado === 'geral' && styles.tabActive]}
          onPress={() => setTipoSelecionado('geral')}
        >
          <Text style={[styles.tabText, tipoSelecionado === 'geral' && styles.tabTextActive]}>
            Desde o início
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <FlatList
        data={data.ranking}
        keyExtractor={(item) => item.alunoId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
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
  tabTextActive: {
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  meuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#F3E8FF',
  },
  meuCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meuCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  meuAvatarContainer: {
    position: 'relative',
  },
  meuCardBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7A34FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meuCardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: getInterFont('700'),
  },
  meuCardInfo: {
    flex: 1,
  },
  meuCardNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    fontFamily: getInterFont('600'),
  },
  meuCardPosicao: {
    fontSize: 11,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  meuCardRight: {
    alignItems: 'flex-end',
  },
  meuCardPontos: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7A34FF',
    fontFamily: getInterFont('700'),
  },
  meuCardPontosLabel: {
    fontSize: 9,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  posicaoContainer: {
    width: 32,
    alignItems: 'center',
  },
  posicaoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: getInterFont('600'),
  },
  avatarContainer: {
    padding: 2,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  avatarCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  infoContainer: {
    flex: 1,
  },
  nomeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: getInterFont('500'),
  },
  pontosContainer: {
    alignItems: 'flex-end',
  },
  pontosText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    fontFamily: getInterFont('700'),
  },
  pontosLabel: {
    fontSize: 11,
    color: '#999',
    fontFamily: getInterFont('400'),
  },
});