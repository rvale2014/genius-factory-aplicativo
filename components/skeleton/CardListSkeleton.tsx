import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

interface CardListSkeletonProps {
  count?: number;
}

export function CardListSkeleton({ count = 4 }: CardListSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox width={96} height={72} borderRadius={8} />
          <View style={styles.cardRight}>
            <SkeletonBox width="80%" height={13} borderRadius={4} />
            <SkeletonBox width="55%" height={12} borderRadius={4} />
            <SkeletonBox width="100%" height={6} borderRadius={3} />
            <View style={styles.cardRow}>
              <SkeletonBox width="40%" height={11} borderRadius={4} />
              <SkeletonBox width={22} height={22} borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  card: {
    marginTop: 12,
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardRight: {
    flex: 1,
    gap: 6,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
