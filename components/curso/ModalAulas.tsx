// components/curso/ModalAulas.tsx

import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Aula, StatusAula } from '../../types/curso';
import { StarRating } from './StarRating';

interface ModalAulasProps {
  aulas: Aula[];
  statusAulas: Record<string, StatusAula>;
  avaliacoes: Record<string, number>;
  aulaSelecionadaId: string | null;
  videoAtualId: string | null;
  onSelecionarAula: (aula: Aula) => void;
  onSelecionarVideo: (conteudoId: string, aulaId: string) => void;
  onAvaliarAula: (aulaId: string, nota: number) => void;
  onToggleConteudo: (conteudoId: string, aulaId: string, concluido: boolean) => void;
  percentualProgresso: number;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export function ModalAulas({
  aulas,
  statusAulas,
  avaliacoes,
  aulaSelecionadaId,
  videoAtualId,
  onSelecionarAula,
  onSelecionarVideo,
  onAvaliarAula,
  onToggleConteudo,
  percentualProgresso,
}: ModalAulasProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%'], []);
  const [expandedAulas, setExpandedAulas] = React.useState<Set<string>>(
    new Set([aulaSelecionadaId || ''])
  );

  const handleSheetChange = useCallback((index: number) => {
    if (index !== 0) {
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, []);

  const toggleAula = useCallback((aulaId: string) => {
    setExpandedAulas((prev) => {
      const next = new Set(prev);
      if (next.has(aulaId)) {
        next.delete(aulaId);
      } else {
        next.add(aulaId);
      }
      return next;
    });
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      enablePanDownToClose={false}
      enableHandlePanningGesture={false}
      enableOverDrag={false}
      onChange={handleSheetChange}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aulas</Text>
          <View style={styles.progressoBadge}>
            <Text style={styles.progressoTexto}>{percentualProgresso}%</Text>
          </View>
        </View>

        {/* Lista de aulas */}
        <View style={styles.aulasList}>
          {aulas.map((aula, index) => {
            const status = statusAulas[aula.id];
            const isExpanded = expandedAulas.has(aula.id);
            const isSelecionada = aulaSelecionadaId === aula.id;
            const aulaConcluida = status?.aulaConcluida || false;
            const videos = aula.conteudos.filter((c) => c.tipo === 'VIDEO');

            return (
              <View key={aula.id} style={styles.aulaItem}>
                {/* Header da aula */}
                <TouchableOpacity
                  style={[
                    styles.aulaHeader,
                    isSelecionada && styles.aulaHeaderSelecionada,
                    aulaConcluida && styles.aulaHeaderConcluida,
                  ]}
                  onPress={() => {
                    toggleAula(aula.id);
                    onSelecionarAula(aula);
                  }}
                >
                  {/* Número ou check */}
                  <View
                    style={[
                      styles.aulaNumero,
                      isSelecionada && styles.aulaNumeroSelecionada,
                      aulaConcluida && styles.aulaNumeroCompleta,
                    ]}
                  >
                    {aulaConcluida ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.aulaNumeroTexto,
                          isSelecionada && styles.aulaNumeroTextoSelecionada,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>

                  {/* Nome da aula */}
                  <Text
                    style={[
                      styles.aulaNome,
                      isSelecionada && styles.aulaNomeSelecionada,
                      aulaConcluida && styles.aulaNomeConcluida,
                    ]}
                    numberOfLines={2}
                  >
                    {aula.nome}
                  </Text>

                  {/* Ícone expandir */}
                  <View style={styles.expandIconContainer}>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#10B981"
                    />
                  </View>
                </TouchableOpacity>

                {/* Conteúdo expandido */}
                {isExpanded && (
                  <View style={styles.aulaConteudo}>
                    {/* Vídeos */}
                    {videos.map((video) => {
                      const concluido = status?.conteudosConcluidos?.includes(
                        video.id
                      );
                      const isVideoAtual = videoAtualId === video.id;

                      return (
                        <View key={video.id} style={styles.videoItem}>
                          <Ionicons
                            name="play-circle-outline"
                            size={16}
                            color="#666"
                          />
                          <TouchableOpacity
                            style={styles.videoTitulo}
                            onPress={() => onSelecionarVideo(video.id, aula.id)}
                          >
                            <Text
                              style={[
                                styles.videoTexto,
                                isVideoAtual && styles.videoTextoAtual,
                              ]}
                              numberOfLines={1}
                            >
                              {video.titulo}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() =>
                              onToggleConteudo(video.id, aula.id, !!concluido)
                            }
                            style={[
                              styles.checkButton,
                              concluido && styles.checkButtonConcluido,
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color={concluido ? '#FFFFFF' : '#9CA3AF'}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    {/* Rating */}
                    <View style={styles.ratingContainer}>
                      <StarRating
                        rating={avaliacoes[aula.id] || 0}
                        onChange={(nota) => onAvaliarAula(aula.id, nota)}
                        size={20}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
  },
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: getInterFont('700'),
  },
  progressoBadge: {
    backgroundColor: '#7A34FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressoTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: getInterFont('700'),
  },
  aulasList: {
    gap: 12,
  },
  aulaItem: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  aulaHeaderSelecionada: {
    backgroundColor: '#7A34FF',
  },
  aulaHeaderConcluida: {
    backgroundColor: '#FFFFFF',
  },
  aulaNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#8B5CF6',
  },
  aulaNumeroSelecionada: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  aulaNumeroCompleta: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  aulaNumeroTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: getInterFont('600'),
  },
  aulaNumeroTextoSelecionada: {
    color: '#7A34FF',
  },
  aulaNome: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    fontFamily: getInterFont('500'),
  },
  aulaNomeSelecionada: {
    color: '#FFFFFF',
  },
  aulaNomeConcluida: {
    color: '#333',
  },
  expandIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aulaConteudo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    gap: 12,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoTitulo: {
    flex: 1,
  },
  videoTexto: {
    fontSize: 13,
    color: '#666',
    fontFamily: getInterFont(),
  },
  videoTextoAtual: {
    color: '#7A34FF',
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonConcluido: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  ratingContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
    marginTop: 8,
  },
});














