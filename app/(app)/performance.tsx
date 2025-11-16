// app/(app)/performance.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PerformanceChart } from '../../components/performance/PerformanceChart';
import { PerformanceFilters } from '../../components/performance/PerformanceFilters';
import { PerformanceGauge } from '../../components/performance/PerformanceGauge';
import { PerformanceHeader } from '../../components/performance/PerformanceHeader';
import { PerformanceStreak } from '../../components/performance/PerformanceStreak';
import { obterPerformance, PerformanceData } from '../../src/services/performanceService';

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export default function PerformanceScreen() {
  const router = useRouter();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Filtros
  const [materiaSelecionada, setMateriaSelecionada] = useState<string>('todas');
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'7' | '14' | '30' | 'all'>('all');

  // Carregar dados
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        setErro(null);
        
        const params: any = { dias: periodoSelecionado };
        if (materiaSelecionada !== 'todas') {
          params.materiaId = materiaSelecionada;
        }
        
        const dados = await obterPerformance(params);
        setData(dados);
      } catch (e: any) {
        console.error('Erro ao carregar performance:', e);
        setErro('Não foi possível carregar os dados de performance. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    
    carregarDados();
  }, [materiaSelecionada, periodoSelecionado]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando performance...</Text>
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
              obterPerformance({ dias: periodoSelecionado })
                .then(setData)
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/dashboard')}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={18} color="#EB1480" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Performance</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Card Principal */}
        <View style={styles.mainCard}>
          {/* Banner do Aluno */}
          <PerformanceHeader
            nome={data.nome}
            avatarUrl={data.avatarUrl}
            geniusCoins={data.geniusCoins}
            posicaoGlobal={data.posicaoGlobal}
          />

          {/* Sequência de estudos */}
          <PerformanceStreak
            diasSeguidosAtual={data.streak.diasSeguidosAtual}
            maiorSequencia={data.streak.maiorSequencia}
          />

          {/* Desempenho diário */}
          <PerformanceChart materias={data.porMateria} />

          {/* Desempenho médio */}
          <PerformanceGauge
            taxaAcertos={data.desempenho.taxaAcertos}
            acimaDaMedia={data.desempenho.acimaDaMedia}
            deltaPct={data.desempenho.deltaPct}
          >
            <PerformanceFilters
              materias={data.porMateria}
              materiaSelecionada={materiaSelecionada}
              onMateriaChange={setMateriaSelecionada}
              periodoSelecionado={periodoSelecionado}
              onPeriodoChange={setPeriodoSelecionado}
            />
          </PerformanceGauge>
        </View>

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
  mainCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
  },
});