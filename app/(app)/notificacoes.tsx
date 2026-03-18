// app/(app)/notificacoes.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import { Bell, Clock, Megaphone, Trophy } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificacaoDetalheSheet from '../../components/notificacoes/NotificacaoDetalheSheet';
import type { Notificacao } from '../../src/schemas/notificacoes';
import {
  contarNaoLidas,
  listarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
} from '../../src/services/notificacoesService';
import { notificacoesNaoLidasAtom } from '../../src/state/notificacoes';

const PAGE_SIZE = 20;

/** Retorna ícone e cor por tipo de notificação */
function getIconePorTipo(tipo: Notificacao['tipo']) {
  switch (tipo) {
    case 'manual':
      return { Icon: Megaphone, color: '#8B5CF6' };
    case 'inatividade':
      return { Icon: Clock, color: '#F59E0B' };
    case 'conquista':
      return { Icon: Trophy, color: '#14b8a6' };
    default:
      return { Icon: Bell, color: '#666' };
  }
}

import { tempoRelativo } from '../../src/lib/dateFormat';

export default function NotificacoesScreen() {
  const router = useRouter();
  const setNaoLidas = useSetAtom(notificacoesNaoLidasAtom);

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<Notificacao | null>(null);
  const mountedRef = useRef(true);

  const hasMore = notificacoes.length < total;

  // Carrega a primeira página
  const carregarNotificacoes = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setErro(null);

      const res = await listarNotificacoes(1, PAGE_SIZE);
      if (!mountedRef.current) return;

      setNotificacoes(res.notificacoes);
      setTotal(res.total);
      setPage(1);

      // Atualiza contagem global
      const count = await contarNaoLidas();
      if (mountedRef.current) setNaoLidas(count);
    } catch {
      if (mountedRef.current && !silencioso) {
        setErro('Não foi possível carregar as notificações.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [setNaoLidas]);

  // Recarrega ao focar na tela
  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      carregarNotificacoes(notificacoes.length > 0);
      return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Paginação infinita
  const carregarMais = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await listarNotificacoes(nextPage, PAGE_SIZE);
      if (!mountedRef.current) return;

      setNotificacoes(prev => [...prev, ...res.notificacoes]);
      setTotal(res.total);
      setPage(nextPage);
    } catch {
      // Silencioso
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    carregarNotificacoes(false);
  }, [carregarNotificacoes]);

  // Tap na notificação
  const handleTapNotificacao = useCallback(async (item: Notificacao) => {
    // Marca como lida (otimista)
    if (!item.lida) {
      setNotificacoes(prev =>
        prev.map(n => n.id === item.id ? { ...n, lida: true } : n)
      );
      setNaoLidas(prev => Math.max(0, prev - 1));

      try {
        await marcarComoLida(item.id);
      } catch {
        // Reverte se falhar
        setNotificacoes(prev =>
          prev.map(n => n.id === item.id ? { ...n, lida: false } : n)
        );
        setNaoLidas(prev => prev + 1);
      }
    }

    // Abre detalhe da notificação
    setNotificacaoSelecionada(item);
  }, [setNaoLidas]);

  // Fechar detalhe
  const handleFecharDetalhe = useCallback(() => {
    setNotificacaoSelecionada(null);
  }, []);

  // Navegar a partir do detalhe
  const handleNavegarDetalhe = useCallback(() => {
    const rota = notificacaoSelecionada?.dados?.route;
    setNotificacaoSelecionada(null);
    if (rota && typeof rota === 'string') {
      try {
        router.push(rota as any);
      } catch {
        // Rota inválida
      }
    }
  }, [notificacaoSelecionada, router]);

  // Marcar todas como lidas
  const handleMarcarTodasLidas = useCallback(async () => {
    try {
      // Otimista
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      setNaoLidas(0);
      // Zera badge do ícone do app
      try { const N = require('expo-notifications'); N.setBadgeCountAsync(0); } catch {};

      await marcarTodasComoLidas();
    } catch {
      // Recarrega para corrigir estado
      carregarNotificacoes(true);
    }
  }, [carregarNotificacoes, setNaoLidas]);

  // Render item
  const renderItem = useCallback(({ item }: { item: Notificacao }) => {
    const { Icon, color } = getIconePorTipo(item.tipo);

    return (
      <TouchableOpacity
        style={[styles.notificacaoItem, !item.lida && styles.notificacaoNaoLida]}
        onPress={() => handleTapNotificacao(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={20} color={color} strokeWidth={2} />
        </View>
        <View style={styles.notificacaoContent}>
          <View style={styles.notificacaoHeader}>
            <Text
              style={[styles.notificacaoTitulo, !item.lida && styles.tituloNaoLido]}
              numberOfLines={1}
            >
              {item.titulo}
            </Text>
            <Text style={styles.notificacaoTempo}>{tempoRelativo(item.criadaEm)}</Text>
          </View>
          <Text style={styles.notificacaoCorpo} numberOfLines={2}>
            {item.corpo}
          </Text>
        </View>
        {!item.lida && <View style={styles.dotNaoLida} />}
      </TouchableOpacity>
    );
  }, [handleTapNotificacao]);

  // Loading
  if (loading && notificacoes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificações</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF5FDB" />
        </View>
      </SafeAreaView>
    );
  }

  // Erro
  if (erro && notificacoes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificações</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#b00020" />
          <Text style={styles.erroText}>{erro}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => carregarNotificacoes(false)}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const temNaoLidas = notificacoes.some(n => !n.lida);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        {temNaoLidas ? (
          <TouchableOpacity onPress={handleMarcarTodasLidas} style={styles.headerRight}>
            <Text style={styles.marcarTodasText}>Marcar lidas</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* Lista */}
      <FlatList
        data={notificacoes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={notificacoes.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF5FDB']}
            tintColor="#FF5FDB"
          />
        }
        onEndReached={carregarMais}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={48} color="#CCC" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptySubtitle}>
              Quando você receber notificações, elas aparecerão aqui.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#FF5FDB" />
            </View>
          ) : null
        }
      />

      {/* Detalhe da notificação */}
      <NotificacaoDetalheSheet
        notificacao={notificacaoSelecionada}
        onClose={handleFecharDetalhe}
        onNavegar={handleNavegarDetalhe}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  headerRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  marcarTodasText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF5FDB',
    fontFamily: 'Inter-SemiBold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  erroText: {
    fontSize: 15,
    color: '#b00020',
    textAlign: 'center',
    fontFamily: 'Inter',
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
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificacaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  notificacaoNaoLida: {
    backgroundColor: '#FDFAFF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificacaoContent: {
    flex: 1,
  },
  notificacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificacaoTitulo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 8,
    fontFamily: 'Inter-Medium',
  },
  tituloNaoLido: {
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter-Bold',
  },
  notificacaoTempo: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter',
  },
  notificacaoCorpo: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  dotNaoLida: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5FDB',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
