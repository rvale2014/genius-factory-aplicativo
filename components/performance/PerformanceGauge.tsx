// src/components/performance/PerformanceGauge.tsx

import { TrendingDown, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GaugeChart } from '../GaugeChart';

interface PerformanceGaugeProps {
  taxaAcertos: number; // 0-100
  acimaDaMedia: boolean;
  deltaPct: number;
  children?: React.ReactNode;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export function PerformanceGauge({ taxaAcertos, acimaDaMedia, deltaPct, children }: PerformanceGaugeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desempenho médio</Text>

      {children && <View style={styles.filtersWrapper}>{children}</View>}
      
      <View style={styles.content}>
        {/* Gauge */}
        <View style={styles.gaugeCard}>
          <GaugeChart
            value={taxaAcertos}
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
            {acimaDaMedia ? (
              <TrendingUp size={24} color="#14b8a6" strokeWidth={2} />
            ) : (
              <TrendingDown size={24} color="#b00020" strokeWidth={2} />
            )}
          </View>
          <Text
            style={[
              styles.mediaPercentual,
              { color: acimaDaMedia ? '#14b8a6' : '#b00020' },
            ]}
          >
            {deltaPct > 0 ? '+' : ''}
            {deltaPct.toFixed(1)}%
          </Text>
          <Text style={styles.mediaLabel}>
            {acimaDaMedia ? 'Acima da média' : 'Abaixo da média'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: getInterFont('600'),
  },
  filtersWrapper: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    gap: 16,
  },
  gaugeCard: {
    flex: 2,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCard: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
});