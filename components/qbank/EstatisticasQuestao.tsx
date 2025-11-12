// components/EstatisticasQuestao.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  questaoId: string;
};

type Estatisticas = {
  totalTentativas: number;
  totalAcertos: number;
  percentualAcerto: number;
  mediaTempoResposta: number;
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
        // TODO: Substituir pela sua API real quando estiver pronta
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/qbank/estatisticas?questaoId=${questaoId}`
        );

        if (!response.ok) {
          throw new Error('Falha ao carregar estatísticas');
        }

        const data = await response.json();
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estatísticas da Questão</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#7C3AED" />
          <Text style={styles.statValue}>{stats.totalTentativas}</Text>
          <Text style={styles.statLabel}>Tentativas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          <Text style={styles.statValue}>{stats.totalAcertos}</Text>
          <Text style={styles.statLabel}>Acertos</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="stats-chart-outline" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{stats.percentualAcerto.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Taxa de Acerto</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{stats.mediaTempoResposta}s</Text>
          <Text style={styles.statLabel}>Tempo Médio</Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <Text style={styles.progressLabel}>Desempenho Geral</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${stats.percentualAcerto}%`,
                backgroundColor: stats.percentualAcerto >= 70 ? '#10B981' : '#EF4444'
              }
            ]} 
          />
        </View>
      </View>
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