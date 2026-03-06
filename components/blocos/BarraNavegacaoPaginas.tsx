// components/blocos/BarraNavegacaoPaginas.tsx

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  totalPaginas: number
  paginaAtual: number
  paginasConcluidas: boolean[]
  paginasComErro?: number[] // Páginas com respostas incorretas
  onIrParaPagina: (index: number) => void
}

export function BarraNavegacaoPaginas({
  totalPaginas,
  paginaAtual,
  paginasConcluidas,
  paginasComErro = [],
  onIrParaPagina,
}: Props) {
  const scrollRef = useRef<ScrollView>(null)
  const [showFade, setShowFade] = useState(true)
  const scrollWidth = useRef(0)

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number }; contentSize: { width: number }; layoutMeasurement: { width: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    scrollWidth.current = layoutMeasurement.width
    const distanciaDoFim = contentSize.width - layoutMeasurement.width - contentOffset.x
    setShowFade(distanciaDoFim > 20)
  }, [])

  // Scroll automático para centralizar a bolinha atual
  useEffect(() => {
    const ITEM_WIDTH = 44 // 36px bolinha + 8px gap
    const containerWidth = scrollWidth.current || 300
    // Centraliza a bolinha atual na área visível
    const offset = Math.max(0, paginaAtual * ITEM_WIDTH - containerWidth / 2 + ITEM_WIDTH / 2)
    scrollRef.current?.scrollTo({ x: offset, animated: true })
  }, [paginaAtual])

  return (
    <View style={styles.container}>
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {Array.from({ length: totalPaginas }, (_, index) => {
            const isConcluida = paginasConcluidas[index]
            const isAtual = paginaAtual === index
            const isErro = paginasComErro.includes(index)

            return (
              <View key={index} style={styles.circuloWrapper}>
                {isAtual && (
                  <View style={styles.anelExterno} />
                )}
              <TouchableOpacity
                onPress={() => onIrParaPagina(index)}
                style={[
                  styles.circulo,
                  isErro && styles.circuloErro,
                    (isConcluida || isAtual) && !isErro && styles.circuloConcluido,
                  isAtual && styles.circuloAtual,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.circuloTexto,
                      (isConcluida || isErro || isAtual) && styles.circuloTextoBranco,
                  ]}
                >
                  {index + 1}
                </Text>
                {isConcluida && !isErro && (
                  <View style={styles.iconWrapper}>
                    <Ionicons name="checkmark-circle" size={14} color="#30C58E" />
                  </View>
                )}
                {isErro && (
                  <View style={styles.iconWrapper}>
                    <Ionicons name="close-circle" size={14} color="#FF5FDB" />
                  </View>
                )}
              </TouchableOpacity>
              </View>
            )
          })}
        </ScrollView>

        {/* Fade na borda direita indicando mais conteúdo */}
        {showFade && totalPaginas > 8 && (
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fadeOverlay}
            pointerEvents="none"
          />
        )}
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scrollContainer: {
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingRight: 32,
    gap: 8,
    alignItems: 'center',
  },
  circuloWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anelExterno: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C084FC',
    opacity: 0.4,
    zIndex: 0,
  },
  circulo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  circuloConcluido: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  circuloErro: {
    backgroundColor: '#FF5FDB',
    borderColor: '#FF5FDB',
  },
  circuloAtual: {
    borderColor: '#9333EA',
    borderWidth: 2,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  circuloTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  circuloTextoBranco: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  iconWrapper: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  fadeOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
  },
})
