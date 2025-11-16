// components/curso/ConquistaModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NovaConquista } from '../../types/curso';

interface ConquistaModalProps {
  visible: boolean;
  conquista: NovaConquista | null;
  alunoNome: string;
  conquistasRestantes: number;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function ConquistaModal({
  visible,
  conquista,
  alunoNome,
  conquistasRestantes,
  onClose,
}: ConquistaModalProps) {
  if (!conquista) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Botão fechar */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* Imagem da conquista */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: conquista.imagemUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Título */}
          <Text style={styles.titulo}>{conquista.titulo}</Text>

          {/* Mensagem de parabéns */}
          <View style={styles.mensagemContainer}>
            <Text style={styles.mensagem}>Parabéns, {alunoNome}!</Text>
            <Text style={styles.submensagem}>
              Você desbloqueou uma nova conquista.
            </Text>
          </View>

          {/* Conquistas restantes */}
          {conquistasRestantes > 0 && (
            <View style={styles.restantesContainer}>
              <Text style={styles.restantesTexto}>
                🎉 Ainda há{' '}
                <Text style={styles.restantesNumero}>{conquistasRestantes}</Text>{' '}
                conquista{conquistasRestantes > 1 ? 's' : ''} para ver.
              </Text>
              <Text style={styles.restantesSubtexto}>
                Clique em "Continuar" para a próxima.
              </Text>
            </View>
          )}

          {/* Botão continuar */}
          <TouchableOpacity style={styles.botaoContinuar} onPress={onClose}>
            <Text style={styles.botaoTexto}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10,
  },
  imageContainer: {
    width: 112,
    height: 112,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 8,
    borderColor: '#F3E8FF',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  mensagemContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mensagem: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  submensagem: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  restantesContainer: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 12,
    marginBottom: 20,
  },
  restantesTexto: {
    fontSize: 14,
    color: '#7C3AED',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  restantesNumero: {
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  restantesSubtexto: {
    fontSize: 12,
    color: '#8B5CF6',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  botaoContinuar: {
    backgroundColor: '#7A34FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
