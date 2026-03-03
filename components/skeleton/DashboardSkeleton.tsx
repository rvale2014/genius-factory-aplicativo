import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

export function DashboardSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBox width={140} height={24} borderRadius={4} />
        <SkeletonBox width={24} height={24} borderRadius={12} />
      </View>

      {/* Banner Aluno */}
      <View style={styles.bannerAluno}>
        <SkeletonBox width={70} height={70} borderRadius={35} />
        <View style={styles.bannerAlunoInfo}>
          <SkeletonBox width={140} height={16} borderRadius={4} />
          <SkeletonBox width={100} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Desempenho */}
      <View style={styles.sectionContainer}>
        <SkeletonBox width={130} height={14} borderRadius={4} />
        <View style={styles.desempenhoRow}>
          <View style={styles.desempenhoCardLarge}>
            <SkeletonBox width={80} height={80} borderRadius={40} />
          </View>
          <View style={styles.desempenhoCardSmall}>
            <SkeletonBox width={48} height={48} borderRadius={24} />
            <SkeletonBox width={50} height={18} borderRadius={4} />
            <SkeletonBox width={70} height={12} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Nav cards */}
      <View style={styles.sectionContainer}>
        <View style={styles.navRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.navItem}>
              <SkeletonBox width={40} height={40} borderRadius={20} />
              <SkeletonBox width={36} height={8} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Banner promo */}
      <View style={styles.sectionContainer}>
        <SkeletonBox width="100%" height={140} borderRadius={16} />
      </View>

      {/* Card curso */}
      <View style={styles.sectionContainer}>
        <SkeletonBox width={100} height={14} borderRadius={4} style={styles.cursoTitulo} />
        <View style={styles.cursoCard}>
          <SkeletonBox width={150} height={100} borderRadius={8} />
          <View style={styles.cursoCardRight}>
            <SkeletonBox width="80%" height={13} borderRadius={4} />
            <SkeletonBox width="50%" height={12} borderRadius={4} />
            <SkeletonBox width="100%" height={6} borderRadius={3} />
            <View style={styles.cursoCardRow}>
              <SkeletonBox width="40%" height={11} borderRadius={4} />
              <SkeletonBox width={22} height={22} borderRadius={4} />
            </View>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerAluno: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    height: 110,
    backgroundColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bannerAlunoInfo: {
    flex: 1,
    gap: 8,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  desempenhoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  desempenhoCardLarge: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desempenhoCardSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  cursoTitulo: {
    marginBottom: 12,
  },
  cursoCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  cursoCardRight: {
    flex: 1,
    gap: 6,
  },
  cursoCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
