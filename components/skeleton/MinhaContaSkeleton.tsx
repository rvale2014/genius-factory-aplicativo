import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

function SectionSkeleton({ fieldsCount }: { fieldsCount: number }) {
  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <SkeletonBox width={24} height={24} borderRadius={6} />
          <SkeletonBox width={140} height={14} borderRadius={4} />
        </View>
        <SkeletonBox width={50} height={28} borderRadius={6} />
      </View>

      {/* Fields */}
      {Array.from({ length: fieldsCount }).map((_, i) => (
        <View key={i} style={styles.fieldGroup}>
          <SkeletonBox width={100} height={11} borderRadius={4} />
          <SkeletonBox width="100%" height={40} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}

export function MinhaContaSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <SkeletonBox width={90} height={90} borderRadius={45} />
      </View>

      {/* Informações pessoais: nome, CPF, telefone, data nascimento */}
      <SectionSkeleton fieldsCount={4} />

      {/* Dados de acesso: nickname, e-mail */}
      <SectionSkeleton fieldsCount={2} />

      {/* Endereço: CEP, rua, número+complemento, bairro, cidade+estado */}
      <SectionSkeleton fieldsCount={5} />

      {/* Responsável: nome, CPF, e-mail, celular, nascimento */}
      <SectionSkeleton fieldsCount={5} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldGroup: {
    marginBottom: 12,
    gap: 6,
  },
});
