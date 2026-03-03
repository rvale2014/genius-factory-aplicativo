import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

export function RankingSkeleton() {
  return (
    <View>
      {/* Meu Card */}
      <View style={styles.meuCard}>
        <SkeletonBox width={56} height={56} borderRadius={28} />
        <View style={styles.meuCardCenter}>
          <SkeletonBox width={120} height={14} borderRadius={4} />
          <SkeletonBox width={160} height={11} borderRadius={4} />
        </View>
        <View style={styles.meuCardRight}>
          <SkeletonBox width={50} height={17} borderRadius={4} />
          <SkeletonBox width={40} height={9} borderRadius={4} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <SkeletonBox width="48%" height={36} borderRadius={6} />
        <SkeletonBox width="48%" height={36} borderRadius={6} />
      </View>

      {/* Ranking Items */}
      <View style={styles.listContainer}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.rankingItem}>
            <View style={styles.positionContainer}>
              <SkeletonBox width={20} height={14} borderRadius={4} />
            </View>
            <SkeletonBox width={36} height={36} borderRadius={18} style={styles.avatar} />
            <View style={styles.nameContainer}>
              <SkeletonBox width="70%" height={14} borderRadius={4} />
            </View>
            <SkeletonBox width={40} height={14} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meuCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meuCardCenter: {
    flex: 1,
    gap: 4,
  },
  meuCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tabsContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  rankingItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionContainer: {
    width: 32,
  },
  avatar: {
    marginHorizontal: 12,
  },
  nameContainer: {
    flex: 1,
  },
});
