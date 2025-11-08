import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useAlunoHeader } from '../src/hooks/useAlunoHeader';

const diamondImage = require('../assets/images/diamante.webp');

type Props = {
  style?: StyleProp<ViewStyle>;
  onPressNotification?: () => void;
};

export function AlunoHeaderSummary({ style, onPressNotification }: Props) {
  const { data, loading } = useAlunoHeader();

  const nome = data?.nome ?? 'Aluno';
  const pontos =
    data?.geniusCoins !== undefined
      ? data.geniusCoins.toLocaleString('pt-BR')
      : loading
      ? 'Carregando...'
      : '--';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.profileGroup}>
        <View style={styles.avatarCircle}>
          {data?.avatarUrl ? (
            <Image source={{ uri: data.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={26} color="#FFFFFF" />
          )}
        </View>
        <View>
          <Text style={styles.nome} numberOfLines={1}>
            {nome}
          </Text>
          <View style={styles.pontosRow}>
            <Image source={diamondImage} style={styles.diamondIcon} resizeMode="contain" />
            <Text style={styles.pontos} numberOfLines={1}>
              {pontos}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={onPressNotification}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={22} color="#FF5FDB" />
        <View style={styles.notificationDot} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pontosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diamondIcon: {
    width: 20,
    height: 20,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 3,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  nome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter-Bold',
  },
  pontos: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14b8a6',
  },
});

