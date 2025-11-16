// src/components/performance/PerformanceStreak.tsx

import { Flame, Target } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface PerformanceStreakProps {
  diasSeguidosAtual: number;
  maiorSequencia: number;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export function PerformanceStreak({ diasSeguidosAtual, maiorSequencia }: PerformanceStreakProps) {
  const cards = [
    {
      title: 'Sequência de estudos',
      value: diasSeguidosAtual,
      icon: Flame,
      iconColor: diasSeguidosAtual > 0 ? '#f97316' : '#9CA3AF',
      bgColor: diasSeguidosAtual > 0 ? 'rgba(249, 115, 22, 0.1)' : '#F3F4F6',
      description:
        diasSeguidosAtual === 0
          ? 'Comece hoje!'
          : diasSeguidosAtual === 1
          ? 'Continue amanhã'
          : 'Mantenha o ritmo!',
      suffix: diasSeguidosAtual === 1 ? 'dia' : 'dias',
    },
    {
      title: 'Maior sequência',
      value: maiorSequencia,
      icon: Target,
      iconColor: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.1)',
      description:
        maiorSequencia === diasSeguidosAtual && diasSeguidosAtual > 0
          ? 'Recorde atual!'
          : 'Seu melhor resultado',
      suffix: maiorSequencia === 1 ? 'dia' : 'dias',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.cardsRow}>
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <View key={index} style={styles.card}>
              <View style={styles.iconContainer}>
                <IconComponent size={20} color={card.iconColor} strokeWidth={2} />
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {card.title}
              </Text>

              <View style={styles.valueRow}>
                <Text style={styles.cardValue}>{card.value}</Text>
                <Text style={styles.cardSuffix}>{card.suffix}</Text>
              </View>

              <Text style={styles.cardDescription} numberOfLines={1}>
                {card.description}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: getInterFont('500'),
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    fontFamily: getInterFont('700'),
  },
  cardSuffix: {
    fontSize: 14,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  cardDescription: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontFamily: getInterFont('400'),
  },
});