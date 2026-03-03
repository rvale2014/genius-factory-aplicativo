import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

export function BlocoSkeleton() {
  return (
    <View style={styles.container}>
      {/* Barra de navegação (círculos) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navBar}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonBox key={i} width={38} height={38} borderRadius={19} />
        ))}
      </ScrollView>

      {/* Audio player */}
      <View style={styles.audioPlayer}>
        <SkeletonBox width={44} height={44} borderRadius={22} />
        <View style={styles.audioInfo}>
          <SkeletonBox width={30} height={10} borderRadius={4} />
          <SkeletonBox width="70%" height={4} borderRadius={2} />
          <SkeletonBox width={30} height={10} borderRadius={4} />
        </View>
        <SkeletonBox width={24} height={12} borderRadius={4} />
      </View>

      {/* Conteúdo de leitura */}
      <View style={styles.content}>
        {/* Parágrafo 1 */}
        <View style={styles.paragraph}>
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="60%" height={14} borderRadius={4} />
        </View>

        {/* Imagem */}
        <SkeletonBox width="100%" height={220} borderRadius={12} />

        {/* Parágrafo 2 */}
        <View style={styles.paragraph}>
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="100%" height={14} borderRadius={4} />
          <SkeletonBox width="45%" height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  navBar: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  audioInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    marginTop: 20,
    gap: 16,
  },
  paragraph: {
    gap: 8,
  },
});
