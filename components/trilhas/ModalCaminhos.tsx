import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TrilhasCaminhoResponse } from '../../src/schemas/trilhas.caminho-completo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalCaminhosProps {
  visible: boolean;
  onClose: () => void;
  trilha: TrilhasCaminhoResponse['trilha'];
  caminhoAtualId: string;
  onSelecionarCaminho: (caminhoId: string) => void;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export function ModalCaminhos({
  visible,
  onClose,
  trilha,
  caminhoAtualId,
  onSelecionarCaminho,
}: ModalCaminhosProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.titulo} numberOfLines={2}>
                {trilha.titulo}
              </Text>
              <Text style={styles.subtitulo}>
                Escolha um caminho
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Lista de Caminhos */}
          <View style={styles.listWrapper}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {trilha.caminhos.map((caminho, index) => {
                const isAtual = caminho.id === caminhoAtualId;
                const isConcluido = caminho.percentual === 100;
                const isDesbloqueado = index === 0 || 
                  trilha.caminhos[index - 1].percentual === 100;

                return (
                  <TouchableOpacity
                    key={caminho.id}
                    style={[
                      styles.caminhoCard,
                      isAtual && styles.caminhoCardAtual,
                      !isDesbloqueado && styles.caminhoCardBloqueado,
                    ]}
                    onPress={() => {
                      if (isDesbloqueado) {
                        onSelecionarCaminho(caminho.id);
                      }
                    }}
                    disabled={!isDesbloqueado}
                    activeOpacity={0.7}
                  >
                    {/* Número e Status */}
                    <View style={[
                      styles.caminhoNumero,
                      isAtual && styles.caminhoNumeroAtual,
                      isConcluido && styles.caminhoNumeroConcluido,
                      !isDesbloqueado && styles.caminhoNumeroBloqueado,
                    ]}>
                      {isConcluido ? (
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      ) : !isDesbloqueado ? (
                        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                      ) : (
                        <Text style={[
                          styles.caminhoNumeroTexto,
                          isAtual && styles.caminhoNumeroTextoAtual,
                        ]}>
                          {caminho.ordem + 1}
                        </Text>
                      )}
                    </View>

                    {/* Informações */}
                    <View style={styles.caminhoInfo}>
                      <Text 
                        style={[
                          styles.caminhoNome,
                          !isDesbloqueado && styles.caminhoNomeBloqueado,
                        ]}
                        numberOfLines={2}
                      >
                        {caminho.nome}
                      </Text>
                      
                      <View style={styles.caminhoStats}>
                        <Text style={[
                          styles.caminhoStatsTexto,
                          !isDesbloqueado && styles.caminhoStatsTextoBloqueado,
                        ]}>
                          {caminho.concluidas}/{caminho.totalAtividades} atividades
                        </Text>
                        
                        {isDesbloqueado && (
                          <>
                            <View style={styles.separator} />
                            <Text style={styles.caminhoPercentual}>
                              {caminho.percentual}%
                            </Text>
                          </>
                        )}
                      </View>

                      {/* Barra de Progresso */}
                      {isDesbloqueado && (
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill,
                              { width: `${caminho.percentual}%` }
                            ]} 
                          />
                        </View>
                      )}
                    </View>

                    {/* Badge "Atual" */}
                    {isAtual && (
                      <View style={styles.badgeAtual}>
                        <Text style={styles.badgeAtualTexto}>Atual</Text>
                      </View>
                    )}

                    {/* Seta */}
                    {isDesbloqueado && !isAtual && (
                      <Ionicons 
                        name="chevron-forward" 
                        size={20} 
                        color="#9CA3AF" 
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.85,
    width: '100%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  subtitulo: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  caminhoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  caminhoCardAtual: {
    borderColor: '#7A34FF',
    borderWidth: 2,
    backgroundColor: '#F9F5FF',
  },
  caminhoCardBloqueado: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  caminhoNumero: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  caminhoNumeroAtual: {
    backgroundColor: '#EDE9FE',
  },
  caminhoNumeroConcluido: {
    backgroundColor: '#D1FAE5',
  },
  caminhoNumeroBloqueado: {
    backgroundColor: '#F3F4F6',
  },
  caminhoNumeroTexto: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Inter-Bold',
  },
  caminhoNumeroTextoAtual: {
    color: '#7A34FF',
  },
  caminhoInfo: {
    flex: 1,
  },
  caminhoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    fontFamily: 'Inter-SemiBold',
  },
  caminhoNomeBloqueado: {
    color: '#9CA3AF',
  },
  caminhoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  caminhoStatsTexto: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  caminhoStatsTextoBloqueado: {
    color: '#9CA3AF',
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  caminhoPercentual: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A34FF',
    fontFamily: 'Inter-SemiBold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7A34FF',
    borderRadius: 3,
  },
  badgeAtual: {
    backgroundColor: '#7A34FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeAtualTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
});