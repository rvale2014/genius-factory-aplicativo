// src/components/performance/PerformanceHeader.tsx

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CachedImage } from '../CachedImage';

const diamondImage = require('../../assets/images/diamante.webp');
const trophyImage = require('../../assets/images/trofeu.webp');

interface PerformanceHeaderProps {
  nome: string;
  avatarUrl: string | null;
  geniusCoins: number;
  posicaoGlobal: number;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export function PerformanceHeader({
  nome,
  avatarUrl,
  geniusCoins,
  posicaoGlobal,
}: PerformanceHeaderProps) {
  const rankingDisplay = posicaoGlobal > 0 ? `${posicaoGlobal}°` : '-';

  return (
    <LinearGradient
      colors={['#7A34FF', '#FF5FDB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.bannerAluno}
    >
      <View style={styles.bannerContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            {avatarUrl ? (
              <CachedImage
                uri={avatarUrl}
                style={styles.avatarImage}
                contentFit="contain"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>
        <View style={styles.bannerInfo}>
          <Text style={styles.alunoNome}>{nome}</Text>
          <View style={styles.infoRow}>
            <View style={styles.pontosContainer}>
              <Image source={diamondImage} style={styles.diamondIcon} resizeMode="contain" />
              <Text style={styles.alunoPontos}>{geniusCoins}</Text>
            </View>
            <View style={styles.rankingContainer}>
              <Image source={trophyImage} style={styles.trophyIcon} resizeMode="contain" />
              <Text style={styles.rankingText}>{rankingDisplay}</Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bannerAluno: {
    borderRadius: 12,
    padding: 20,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 3,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 32,
    backgroundColor: 'transparent',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: getInterFont('700'),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pontosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diamondIcon: {
    width: 24,
    height: 24,
  },
  alunoPontos: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: getInterFont('400'),
  },
  rankingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trophyIcon: {
    width: 26,
    height: 26,
  },
  rankingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: getInterFont('700'),
  },
});