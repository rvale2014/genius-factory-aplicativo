import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isSmall = width < 360;
const isTablet = width > 600;

// ============================================
// COMPONENTE PRINCIPAL: LoadingScreen
// ============================================
export default function LoadingScreen(): React.ReactElement {
  // Valores animados do logo
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ==========================================
    // FASE 1: Fade-in inicial (600ms)
    // ==========================================
    const fadeIn = Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    });

    // ==========================================
    // FASE 2: Loop de flutuação vertical
    // ==========================================
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // ==========================================
    // SEQUÊNCIA COORDENADA
    // ==========================================
    // 1. Fade-in completo
    // 2. Pequeno delay (200ms) para estabilizar
    // 3. Inicia loop de flutuação
    Animated.sequence([
      fadeIn,
      Animated.delay(200), // Pausa entre animações
    ]).start(() => {
      floatLoop.start();
    });

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      logoOpacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, []); // ← Dependências vazias para executar apenas uma vez

  // ==========================================
  // DIMENSÕES RESPONSIVAS
  // ==========================================
  const logoWidth = isTablet ? 400 : isSmall ? width * 0.6 : width * 0.65;
  const logoHeight = isTablet ? 200 : isSmall ? width * 0.32 : width * 0.35;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ==========================================
          CONTEÚDO PRINCIPAL
          ========================================== */}
      <View style={styles.content}>
        {/* LOGO GENIUS - Animado */}
        <Animated.Image
          source={require('../assets/images/genius-factory-logo.png')}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              width: logoWidth,
              height: logoHeight,
              opacity: logoOpacity, // ← Sempre aplicado
              transform: [{ translateY }],
            },
          ]}
          accessibilityLabel="Logo Genius Factory"
          accessibilityRole="image"
        />
      </View>
    </SafeAreaView>
  );
}

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    alignSelf: 'center',
  },
});