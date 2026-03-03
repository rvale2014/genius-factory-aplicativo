import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

const { width } = Dimensions.get('window');

export function CursoDetalhesSkeleton() {
  return (
    <View style={styles.container}>
      {/* Título da aula */}
      <View style={styles.aulaTituloContainer}>
        <SkeletonBox width="75%" height={16} borderRadius={4} />
        <SkeletonBox width={28} height={28} borderRadius={14} />
      </View>

      {/* Player de vídeo */}
      <View style={styles.playerSection}>
        <SkeletonBox width="100%" height={Math.round((width - 40) * 9 / 16)} borderRadius={12} />

        {/* Tabs (Livros Digitais / Dúvidas) */}
        <View style={styles.tabsWrapper}>
          <SkeletonBox width="48%" height={36} borderRadius={14} />
          <SkeletonBox width="48%" height={36} borderRadius={14} />
        </View>

        {/* Conteúdo da aba (materiais) */}
        <View style={styles.tabContent}>
          {Array.from({ length: 2 }).map((_, i) => (
            <View key={i} style={styles.pdfItem}>
              <SkeletonBox width={40} height={40} borderRadius={8} />
              <SkeletonBox width="60%" height={12} borderRadius={4} />
              <SkeletonBox width={20} height={20} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  aulaTituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  playerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 2,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabContent: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  pdfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
});
