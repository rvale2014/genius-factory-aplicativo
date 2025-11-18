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
            <TouchableOpacity
              key={index}
              onPress={() => onIrParaPagina(index)}
              style={[
                styles.circulo,
                isErro && styles.circuloErro,
                isConcluida && !isErro && styles.circuloConcluido,
                isAtual && styles.circuloAtual,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.circuloTexto,
                  (isConcluida || isErro) && styles.circuloTextoBranco,
                  isAtual && styles.circuloTextoAtual,
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
                  <Ionicons name="close-circle" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
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
  },
  circuloConcluido: {
    backgroundColor: '#A855F7',
    borderColor: '#9333EA',
  },
  circuloErro: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  circuloAtual: {
    borderColor: '#7C3AED',
    borderWidth: 3,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  circuloTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  circuloTextoBranco: {
    color: '#FFFFFF',
  },
  circuloTextoAtual: {
    color: '#7C3AED',
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