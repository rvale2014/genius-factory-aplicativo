// components/blocos/ModalConquistas.tsx

import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type Conquista = {
  nome: string
  titulo: string
  nivel: number
  categoria: string
  imagemUrl: string
}

type Props = {
  visible: boolean
  conquistas: Conquista[]
  onClose: () => void
}

export function ModalConquistas({ visible, conquistas, onClose }: Props) {
  const [conquistaAtual, setConquistaAtual] = useState(0)

  if (!visible || conquistas.length === 0) {
    return null
  }

  const conquista = conquistas[conquistaAtual]
  const temMais = conquistaAtual < conquistas.length - 1

  const handleProxima = () => {
    if (temMais) {
      setConquistaAtual(prev => prev + 1)
    } else {
      onClose()
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.backdrop}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerBadge}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.headerTitle}>Conquista Desbloqueada!</Text>
              {conquistas.length > 1 && (
                <Text style={styles.headerSubtitle}>
                  {conquistaAtual + 1} de {conquistas.length}
                </Text>
              )}
            </View>

            {/* Imagem da conquista */}
            <View style={styles.imageContainer}>
              {conquista.imagemUrl ? (
                <Image
                  source={{ uri: conquista.imagemUrl }}
                  style={styles.conquistaImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="trophy" size={80} color="#F59E0B" />
                </View>
              )}
            </View>

            {/* Detalhes */}
            <View style={styles.detalhes}>
              <Text style={styles.titulo}>{conquista.titulo}</Text>
              <View style={styles.metaRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Nível {conquista.nivel}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{conquista.categoria}</Text>
                </View>
              </View>
            </View>

            {/* Botão */}
            <TouchableOpacity
              onPress={handleProxima}
              style={styles.botao}
              activeOpacity={0.8}
            >
              <Text style={styles.botaoTexto}>
                {temMais ? 'Próxima Conquista' : 'Continuar'}
              </Text>
              <Ionicons
                name={temMais ? 'arrow-forward' : 'checkmark'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 40, 400),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  imageContainer: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  conquistaImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detalhes: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
})

