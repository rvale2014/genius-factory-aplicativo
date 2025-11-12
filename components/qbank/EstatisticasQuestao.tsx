// components/EstatisticasQuestao.tsx
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/lib/api';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  questaoId: string;
};

type Estatisticas = {
  tipo: string;
  acertos: number;
  erros: number;
  alternativas?: { letra: string; total: number }[];
  notas?: number[];
};

export default function EstatisticasQuestao({ questaoId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Estatisticas | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
    
      try {
        const { data } = await api.get(`/mobile/v1/qbank/estatisticas/${questaoId}`);
        setStats(data);
      } catch (err) {
        setError('Não foi possível carregar as estatísticas.');
      } finally {
        setLoading(false);
      }
    }

    if (questaoId) {
      fetchStats();
    }
  }, [questaoId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7C3AED" />
        <Text style={styles.loadingText}>Carregando estatísticas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma estatística disponível ainda.</Text>
      </View>
    );
  }

  // ✅ Calcular métricas
  const totalTentativas = stats.acertos + stats.erros;
  const percentualAcerto = totalTentativas > 0 
    ? (stats.acertos / totalTentativas) * 100 
    : 0;

  // Se não tem tentativas, não mostra nada
  if (totalTentativas === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Ainda não há respostas para esta questão.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estatísticas da Questão</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#7C3AED" />
          <Text style={styles.statValue}>{totalTentativas}</Text>
          <Text style={styles.statLabel}>Tentativas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          <Text style={styles.statValue}>{stats.acertos}</Text>
          <Text style={styles.statLabel}>Acertos</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.statValue}>{stats.erros}</Text>
          <Text style={styles.statLabel}>Erros</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="stats-chart-outline" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{percentualAcerto.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Taxa de Acerto</Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <Text style={styles.progressLabel}>Desempenho Geral</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${percentualAcerto}%`,
                backgroundColor: percentualAcerto >= 70 ? '#10B981' : '#EF4444'
              }
            ]} 
          />
        </View>
      </View>

      {/* ✅ Mostrar distribuição de alternativas (se aplicável) */}
      {stats.alternativas && stats.alternativas.length > 0 && (
        <View style={styles.alternativasContainer}>
          <Text style={styles.alternativasTitle}>Distribuição de Respostas</Text>
          {stats.alternativas.map((alt) => {
            const percent = totalTentativas > 0 
              ? (alt.total / totalTentativas) * 100 
              : 0;
            return (
              <View key={alt.letra} style={styles.alternativaRow}>
                <Text style={styles.alternativaLetra}>{alt.letra}</Text>
                <View style={styles.alternativaBar}>
                  <View 
                    style={[
                      styles.alternativaBarFill,
                      { width: `${percent}%` }
                    ]}
                  />
                </View>
                <Text style={styles.alternativaPercent}>{percent.toFixed(0)}%</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressBarContainer: {
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  alternativasContainer: {
    gap: 12,
    marginTop: 8,
  },
  alternativasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  alternativaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alternativaLetra: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    width: 24,
  },
  alternativaBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  alternativaBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  alternativaPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 40,
    textAlign: 'right',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});