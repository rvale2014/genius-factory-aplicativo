import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CENTER_X = SCREEN_WIDTH / 2;
const NODE_OFFSET = SCREEN_WIDTH * 0.16;

export function CaminhoSkeleton() {
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <SkeletonBox width={24} height={24} borderRadius={4} style={{ opacity: 0.4 }} />
        <SkeletonBox width={160} height={15} borderRadius={4} style={{ opacity: 0.4 }} />
        <View style={{ width: 44 }} />
      </View>

      {/* Header caminho */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonBox width={180} height={16} borderRadius={4} style={{ opacity: 0.4 }} />
          <SkeletonBox width={20} height={20} borderRadius={4} style={{ opacity: 0.3 }} />
        </View>
        <SkeletonBox width={52} height={52} borderRadius={26} style={{ opacity: 0.3 }} />
      </View>

      {/* Blocos em zigzag */}
      {Array.from({ length: 5 }).map((_, i) => {
        const isLeft = i % 2 === 0;
        return (
          <View key={i} style={styles.nodeContainer}>
            <View
              style={[
                styles.blocoWrapper,
                isLeft ? styles.blocoEsquerda : styles.blocoDireita,
              ]}
            >
              <View style={styles.blocoCard}>
                <SkeletonBox width={56} height={56} borderRadius={28} style={{ opacity: 0.35 }} />
                <SkeletonBox width={80} height={10} borderRadius={4} style={{ marginTop: 4, opacity: 0.3 }} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  blocoWrapper: {
    width: '100%',
    paddingVertical: 6,
  },
  blocoEsquerda: {
    transform: [{ translateX: -NODE_OFFSET }],
  },
  blocoDireita: {
    transform: [{ translateX: NODE_OFFSET }],
  },
  blocoCard: {
    alignItems: 'center',
    gap: 8,
  },
});
