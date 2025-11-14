import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Bloco } from '../../src/schemas/trilhas.caminho-completo';

interface BlocoCardProps {
  bloco: Bloco;
  index: number;
  isDesbloqueado: boolean;
  isConcluido: boolean;
  onPress: () => void;
}

export function BlocoCard({ bloco, index, isDesbloqueado, isConcluido, onPress }: BlocoCardProps) {
  // Define a cor do círculo baseado no estado
  const getCircleColor = () => {
    if (isConcluido) return '#10B981'; // Verde para concluído
    if (isDesbloqueado) return '#FF5F96'; // Rosa-avermelhado moderado para desbloqueado
    return '#CBD5F5'; // Cinza claro para bloqueado
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.circulo,
          { backgroundColor: getCircleColor() },
          !isDesbloqueado && styles.circuloBloqueado,
        ]}
        onPress={onPress}
        disabled={!isDesbloqueado}
        activeOpacity={0.8}
      >
    <Text style={styles.numeroTexto}>
      {index + 1}
    </Text>
      </TouchableOpacity>

      {/* Título (opcional - pode remover se quiser ainda mais minimalista) */}
      {isDesbloqueado && (
        <Text
          style={styles.titulo}
          numberOfLines={2}
        >
          {bloco.titulo}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  circulo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  circuloBloqueado: {
    opacity: 0.5,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  numeroTexto: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  titulo: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 120,
    fontFamily: 'Inter-Medium',
  },
});