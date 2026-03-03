import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

export function ConquistasSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          {/* Header categoria */}
          <View style={styles.sectionHeader}>
            <SkeletonBox width={100} height={16} borderRadius={4} />
            <View style={{ flex: 1 }} />
            <SkeletonBox width={50} height={14} borderRadius={4} />
          </View>

          {/* Cards horizontal */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <View key={cardIndex} style={styles.card}>
                <SkeletonBox width={70} height={70} borderRadius={8} style={styles.cardIcon} />
                <SkeletonBox width="80%" height={13} borderRadius={4} style={styles.cardTitle} />
                <SkeletonBox width="60%" height={13} borderRadius={4} style={styles.cardSubtitle} />
                <SkeletonBox width="70%" height={20} borderRadius={12} style={styles.cardBadge} />
              </View>
            ))}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  card: {
    width: 140,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardSubtitle: {
    marginBottom: 8,
  },
  cardBadge: {},
});
