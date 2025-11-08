// app/(app)/trilhas/index.tsx
import { AlunoHeaderSummary } from '@/components/AlunoHeaderSummary';
import type { TrilhaItem } from '@/src/schemas/trilhas';
import { listarTrilhas, type ListarTrilhasParams } from '@/src/services/trilhasService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// === config ===
const PER_PAGE = 15;
const placeholderImage = require('../../assets/images/genius-factory-logo.webp');

type AnoTab = 'todos' | '4' | '5' | '6';
const ANOS: { label: string; value: AnoTab }[] = [
  { label: 'Todas', value: 'todos' },
  { label: '4º ano', value: '4' },
  { label: '5º ano', value: '5' },
  { label: '6º ano', value: '6' },
];

export default function TrilhasScreen() {
  const router = useRouter();

  // filtros
  const [ano, setAno] = useState<AnoTab>('todos');
  const [materia] = useState<'todas' | string>('todas'); // reservado para futura UI

  // dados
  const [itens, setItens] = useState<TrilhaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // estados
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const canLoadMore = useMemo(() => page < totalPages, [page, totalPages]);
  const initialLoadedRef = useRef(false);

  // carregar primeira página (ou quando filtro muda)
  useEffect(() => {
    let active = true;
    async function loadFirst() {
      try {
        setLoading(true);
        setErro(null);
        setPage(1);
        const res = await listarTrilhas({
          ano,
          materia,
          page: 1,
          perPage: PER_PAGE,
        } as ListarTrilhasParams);
        if (!active) return;
        setItens(res.trilhas);
        setTotalPages(res.totalPages);
      } catch (e: any) {
        if (!active) return;
        setErro('Não foi possível carregar as trilhas. Tente novamente.');
      } finally {
        if (active) {
          setLoading(false);
          initialLoadedRef.current = true;
        }
      }
    }
    loadFirst();
    return () => {
      active = false;
    };
  }, [ano, materia]);

  // pull to refresh
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setErro(null);
      const res = await listarTrilhas({
        ano,
        materia,
        page: 1,
        perPage: PER_PAGE,
      } as ListarTrilhasParams);
      setItens(res.trilhas);
      setPage(1);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setErro('Falha ao atualizar a lista.');
    } finally {
      setRefreshing(false);
    }
  };

  // infinite scroll
  const loadMore = async () => {
    if (loading || loadingMore || refreshing || !canLoadMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await listarTrilhas({
        ano,
        materia,
        page: nextPage,
        perPage: PER_PAGE,
      } as ListarTrilhasParams);
      setItens((prev) => [...prev, ...res.trilhas]);
      setPage(nextPage);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      // mantém itens já carregados
    } finally {
      setLoadingMore(false);
    }
  };

  // UI do seletor de ano
  const YearSelector = () => (
    <View style={styles.tabsContainer}>
      {ANOS.map((opt) => {
        const active = ano === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => setAno(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Card de trilha
  const TrilhaCard = ({ item }: { item: TrilhaItem }) => {
    const pct = Math.max(0, Math.min(item.percentual, 100));

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          // Navegação para a futura Tela do Caminho:
          // router.push(`/trilhas/${item.id}/caminhos/${item.caminhoAtualId || ''}`);
          // por enquanto, só um log para evitar erro se a rota ainda não existe
          console.log('Abrir trilha:', item.id, 'caminho:', item.caminhoAtualId);
        }}
      >
        <Image
          source={item.imagemUrl ? { uri: item.imagemUrl } : placeholderImage}
          style={styles.cardImage}
          resizeMode="cover"
          onError={() => {
            // fallback no erro também
          }}
        />

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.titulo}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="book-outline" size={14} color="#666" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.materiaNome}
            </Text>

            <View style={styles.dot} />
            <Ionicons name="list-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{item.totalAtividades} atividades</Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>

          <View style={styles.ctaRow}>
            <Text style={styles.ultimaAtiv} numberOfLines={1}>
              {item.ultimaAtividade ? item.ultimaAtividade : 'Ainda não iniciado'}
            </Text>
            <View style={styles.goButton}>
              <Ionicons name="chevron-forward" size={18} color="#FFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // estados de tela
  if (loading && !initialLoadedRef.current) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AlunoHeaderSummary style={styles.alunoHeader} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trilhas</Text>
        </View>
        <YearSelector />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando trilhas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (erro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AlunoHeaderSummary style={styles.alunoHeader} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trilhas</Text>
        </View>
        <YearSelector />
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={40} color="#b00020" />
          <Text style={styles.errorText}>{erro}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AlunoHeaderSummary style={styles.alunoHeader} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trilhas</Text>
      </View>

      <YearSelector />

      <FlatList
        data={itens}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <TrilhaCard item={item} />}
        onEndReachedThreshold={0.5}
        onEndReached={loadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5FDB" />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color="#FF5FDB" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhuma trilha encontrada.</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  alunoHeader: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24, fontWeight: '700', color: '#333',
  },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tabActive: {
    backgroundColor: '#FFE9F6',
    borderColor: '#FF5FDB',
  },
  tabText: { color: '#555', fontWeight: '600' },
  tabTextActive: { color: '#FF5FDB' },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    gap: 12,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4,
    borderWidth: 1, borderColor: '#EEE',
  },
  cardImage: {
    width: 96,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15, fontWeight: '700', color: '#333',
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  metaText: {
    fontSize: 12, color: '#666', flexShrink: 1,
  },
  dot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: '#CCC',
  },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  progressBar: {
    flex: 1, height: 6, backgroundColor: '#E5E5E5', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#FF5FDB', borderRadius: 3,
  },
  progressPct: {
    fontSize: 12, fontWeight: '700', color: '#7A34FF',
  },
  ctaRow: {
    marginTop: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  ultimaAtiv: {
    fontSize: 11, color: '#666', flex: 1, paddingRight: 8,
  },
  goButton: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#14b8a6',
    alignItems: 'center', justifyContent: 'center',
  },

  loadingBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  loadingText: { color: '#666' },

  errorBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20,
  },
  errorText: { color: '#b00020', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#FF5FDB', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: '#FFF', fontWeight: '700' },

  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#666' },
});


