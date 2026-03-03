import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

export function PerformanceSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.mainCard}>
        {/* Banner do Aluno */}
        <View style={styles.bannerAluno}>
          <SkeletonBox width={56} height={56} borderRadius={28} />
          <View style={styles.bannerInfo}>
            <SkeletonBox width={140} height={16} borderRadius={4} />
            <SkeletonBox width={100} height={12} borderRadius={4} />
          </View>
          <View style={styles.bannerRight}>
            <SkeletonBox width={60} height={20} borderRadius={10} />
            <SkeletonBox width={50} height={20} borderRadius={10} />
          </View>
        </View>

        {/* Sequência de estudos */}
        <View style={styles.streakSection}>
          <SkeletonBox width={160} height={14} borderRadius={4} />
          <View style={styles.streakRow}>
            <View style={styles.streakCard}>
              <SkeletonBox width={40} height={40} borderRadius={20} />
              <SkeletonBox width={30} height={18} borderRadius={4} />
              <SkeletonBox width={70} height={10} borderRadius={4} />
            </View>
            <View style={styles.streakCard}>
              <SkeletonBox width={40} height={40} borderRadius={20} />
              <SkeletonBox width={30} height={18} borderRadius={4} />
              <SkeletonBox width={70} height={10} borderRadius={4} />
            </View>
          </View>
        </View>

        {/* Gráfico de desempenho */}
        <View style={styles.chartSection}>
          <SkeletonBox width={180} height={14} borderRadius={4} />
          <View style={styles.chartPlaceholder}>
            <SkeletonBox width="100%" height={160} borderRadius={8} />
          </View>
          {/* Legendas */}
          <View style={styles.legendRow}>
            <SkeletonBox width={80} height={12} borderRadius={4} />
            <SkeletonBox width={80} height={12} borderRadius={4} />
            <SkeletonBox width={80} height={12} borderRadius={4} />
          </View>
        </View>

        {/* Desempenho médio (gauge) */}
        <View style={styles.gaugeSection}>
          <SkeletonBox width={140} height={14} borderRadius={4} />
          <View style={styles.gaugeCenter}>
            <SkeletonBox width={120} height={120} borderRadius={60} />
          </View>
          <View style={styles.gaugeInfoRow}>
            <SkeletonBox width={100} height={12} borderRadius={4} />
            <SkeletonBox width={60} height={12} borderRadius={4} />
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filtersSection}>
          <SkeletonBox width={80} height={12} borderRadius={4} />
          <View style={styles.filtersRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBox key={i} width={70} height={32} borderRadius={16} />
            ))}
          </View>
          <SkeletonBox width={80} height={12} borderRadius={4} style={{ marginTop: 12 }} />
          <View style={styles.filtersRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBox key={i} width={55} height={32} borderRadius={16} />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
  },
  bannerAluno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  bannerInfo: {
    flex: 1,
    gap: 6,
  },
  bannerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  streakSection: {
    marginBottom: 20,
    gap: 12,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 12,
  },
  streakCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  chartSection: {
    marginBottom: 20,
    gap: 12,
  },
  chartPlaceholder: {
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  gaugeSection: {
    marginBottom: 20,
    gap: 12,
  },
  gaugeCenter: {
    alignItems: 'center',
    marginVertical: 8,
  },
  gaugeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  filtersSection: {
    gap: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
});
