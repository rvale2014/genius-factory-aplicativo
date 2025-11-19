// components/blocos/BarraNavegacaoPaginas.tsx

import { Ionicons } from '@expo/vector-icons'
import React from 'react'
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
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Array.from({ length: totalPaginas }, (_, index) => {
          const isConcluida = paginasConcluidas[index]
          const isAtual = paginaAtual === index
          const isErro = paginasComErro.includes(index)

          return (
            <View key={index} style={styles.circuloWrapper}>
              {/* Anel externo para efeito glow quando está selecionado */}
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
                    // Se está concluída, tem erro ou é atual, texto branco
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 4,
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
    backgroundColor: '#C084FC', // Roxo mais claro para o anel externo
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
    backgroundColor: '#7C3AED', // Roxo vibrante
    borderColor: '#7C3AED',
  },
  circuloErro: {
    backgroundColor: '#FF5FDB',
    borderColor: '#FF5FDB',
  },
  circuloAtual: {
    borderColor: '#9333EA', // Borda roxa mais escura para contraste
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
})