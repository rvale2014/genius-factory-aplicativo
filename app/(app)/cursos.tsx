// app/(app)/cursos/index.tsx
import { AlunoHeaderSummary } from '@/components/AlunoHeaderSummary';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CursoItem } from '@/src/schemas/cursos';
import { listarCursos, type ListarCursosParams } from '@/src/services/cursosService';

const PER_PAGE = 15;
const placeholderImage = require('../../assets/images/genius-factory-logo.webp');

type AnoTab = 'todos' | '4' | '5' | '6';
const ANOS: { label: string; value: AnoTab }[] = [
  { label: 'Todas', value: 'todos' },
  { label: '4º ano', value: '4' },
  { label: '5º ano', value: '5' },
  { label: '6º ano', value: '6' },
];

export default function CursosScreen() {
  const router = useRouter();

  // filtros
  const [ano, setAno] = useState<AnoTab>('todos');

  // dados
  const [itens, setItens] = useState<CursoItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // estados
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / PER_PAGE)),
    [totalItems]
  );
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

        const res = await listarCursos({
          ano,
          page: 1,
          perPage: PER_PAGE,
        } as ListarCursosParams);

        if (!active) return;
        setItens(res.items);
        setTotalItems(res.total);
      } catch (e: any) {
        if (!active) return;
        setErro('Não foi possível carregar os cursos. Tente novamente.');
      } finally {
        if (active) {
          setLoading(false);
          initialLoadedRef.current = true;
        }
      }
    }

    loadFirst();
    return () => { active = false; };
  }, [ano]);

  // pull to refresh
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setErro(null);

      const res = await listarCursos({
        ano,
        page: 1,
        perPage: PER_PAGE,
      } as ListarCursosParams);

      setItens(res.items);
      setPage(1);
      setTotalItems(res.total);
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

      const res = await listarCursos({
        ano,
        page: nextPage,
        perPage: PER_PAGE,
      } as ListarCursosParams);

      setItens((prev) => [...prev, ...res.items]);
      setPage(nextPage);
      setTotalItems(res.total);
    } catch {
      // mantém itens já carregados; exibe erro silencioso
    } finally {
      setLoadingMore(false);
    }
  };

  // UI do seletor de ano (mesmo padrão de Trilhas)
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

  // Card de curso
  const CourseCard = ({ item }: { item: CursoItem }) => {
    const pct = Math.max(0, Math.min(item.progresso.percentual || 0, 100));
    const nextStepText = item.progresso.proximaAulaTitulo
      ? `Próxima aula: ${item.progresso.proximaAulaTitulo}`
      : pct === 100
        ? 'Curso concluído'
        : 'Ainda não iniciado';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          router.push({
            pathname: '/cursos/[id]',
            params: { id: item.id },
          });
        }}
      >
        <Image
          source={item.imagem ? { uri: item.imagem } : placeholderImage}
          style={styles.cardImage}
          resizeMode="cover"
        />

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.nome}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="book-outline" size={14} color="#666" />
            <Text style={styles.metaText} numberOfLines={1}>{item.materia.nome}</Text>

            <View style={styles.dot} />
            <Ionicons name="play-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{item._counts.aulas} aulas</Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>

          <View style={styles.ctaRow}>
            <Text style={styles.ultimaAtiv} numberOfLines={1}>
              {nextStepText}
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
          <Text style={styles.headerTitle}>Cursos</Text>
        </View>
        <YearSelector />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando cursos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (erro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AlunoHeaderSummary style={styles.alunoHeader} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cursos</Text>
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
        <Text style={styles.headerTitle}>Cursos</Text>
      </View>

      <YearSelector />

      <FlatList
        data={itens}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <CourseCard item={item} />}
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
              <Text style={styles.emptyText}>Nenhum curso encontrado.</Text>
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
    fontSize: 24,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
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
    fontSize: 13,
    color: '#333',
    fontFamily: 'Inter-Medium',
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


