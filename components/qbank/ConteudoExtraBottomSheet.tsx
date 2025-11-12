// components/ConteudoExtraBottomSheet.tsx
import { useQbankAudios } from '@/src/hooks/useQbankAudios';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import AudioPlayerSimple from './AudioPlayerSimple';
import EstatisticasQuestao from './EstatisticasQuestao';
import ForumDuvidasQuestao from './ForumDuvidasQuestao';

type Aba = 'dica' | 'video' | 'texto' | 'forum' | 'estatisticas';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  questaoId: string;
  dica?: string | null;
  comentarioTexto?: string | null;
  comentarioVideoUrl?: string | null;
  respondido: boolean;
  abaInicial?: Aba;
};

export default function ConteudoExtraBottomSheet({
  bottomSheetRef,
  questaoId,
  dica,
  comentarioTexto,
  comentarioVideoUrl,
  respondido,
  abaInicial = 'dica',
}: Props) {


  const { width } = useWindowDimensions();
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  
  const [abaAtiva, setAbaAtiva] = useState<Aba>(abaInicial);
  const [dicaAudioIdx, setDicaAudioIdx] = useState(0);
  const [comentAudioIdx, setComentAudioIdx] = useState(0);

  // Hooks de áudio
  const {
    loading: dicaAudioLoading,
    error: dicaAudioError,
    pages: dicaPages,
    byIndex: dicaByIndex,
    hasAudio: dicaHasAudio,
    totalPages: dicaTotal,
  } = useQbankAudios({ questaoId, kind: 'dica' });

  const {
    loading: comentAudioLoading,
    error: comentAudioError,
    pages: comentPages,
    byIndex: comentByIndex,
    hasAudio: comentHasAudio,
    totalPages: comentTotal,
  } = useQbankAudios({ questaoId, kind: 'comentario' });

  // Verificar quais abas estão disponíveis
  const temDica = Boolean(dica) || dicaHasAudio;
  const temVideo = Boolean(comentarioVideoUrl);
  const temTexto = Boolean(comentarioTexto) || comentHasAudio;
  const temComentarios = temVideo || temTexto;

  const handleChangeAba = useCallback((aba: Aba) => {
    // Bloquear comentários se não respondeu
    if (!respondido && (aba === 'texto' || aba === 'video')) {
      return;
    }
    setAbaAtiva(aba);
  }, [respondido]);

  const renderAbaButton = (
    aba: Aba,
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    disponivel: boolean = true
  ) => {
    const bloqueada = !respondido && (aba === 'texto' || aba === 'video');
    const ativa = abaAtiva === aba;

    return (
      <TouchableOpacity
        key={aba}
        onPress={() => handleChangeAba(aba)}
        disabled={!disponivel || bloqueada}
        style={[
          styles.abaButton,
          ativa && styles.abaButtonAtiva,
          (!disponivel || bloqueada) && styles.abaButtonDisabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={ativa ? '#7C3AED' : bloqueada ? '#D1D5DB' : '#6B7280'}
        />
        <Text
          style={[
            styles.abaLabel,
            ativa && styles.abaLabelAtiva,
            (!disponivel || bloqueada) && styles.abaLabelDisabled,
          ]}
        >
          {label}
        </Text>
        {bloqueada && (
          <Ionicons name="lock-closed" size={14} color="#D1D5DB" />
        )}
      </TouchableOpacity>
    );
  };

  const renderConteudoDica = () => (
    <View style={styles.conteudoContainer}>
      {/* Áudio da Dica */}
      {dicaAudioLoading && (
        <Text style={styles.loadingText}>Carregando áudio...</Text>
      )}
      {dicaAudioError && (
        <Text style={styles.errorText}>Erro: {dicaAudioError}</Text>
      )}
      
      {dicaHasAudio && dicaByIndex[dicaAudioIdx] && (
        <View style={styles.audioSection}>
          <AudioPlayerSimple src={dicaByIndex[dicaAudioIdx]} />
          
          {dicaTotal > 1 && (
            <View style={styles.audioPaginacao}>
              {dicaPages.map((p) => (
                <TouchableOpacity
                  key={p.index}
                  onPress={() => setDicaAudioIdx(p.index)}
                  style={[
                    styles.audioPaginacaoBtn,
                    dicaAudioIdx === p.index && styles.audioPaginacaoBtnAtivo,
                  ]}
                >
                  <Text
                    style={[
                      styles.audioPaginacaoText,
                      dicaAudioIdx === p.index && styles.audioPaginacaoTextAtivo,
                    ]}
                  >
                    Áudio {p.index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* HTML da Dica */}
      {dica ? (
        <RenderHTML
          contentWidth={width - 64}
          source={{ html: dica }}
          baseStyle={styles.htmlBase}
          tagsStyles={{
            p: styles.htmlParagraph,
            strong: styles.htmlStrong,
            em: styles.htmlEm,
          }}
        />
      ) : (
        !dicaAudioLoading && !dicaHasAudio && (
          <Text style={styles.emptyText}>Não há dica disponível.</Text>
        )
      )}
    </View>
  );

  const renderConteudoComentarioTexto = () => (
    <View style={styles.conteudoContainer}>
      {!respondido ? (
        <View style={styles.bloqueadoContainer}>
          <Ionicons name="lock-closed" size={48} color="#D1D5DB" />
          <Text style={styles.bloqueadoText}>
            Responda a questão para liberar os comentários
          </Text>
        </View>
      ) : (
        <>
          {/* Áudio do Comentário */}
          {comentAudioLoading && (
            <Text style={styles.loadingText}>Carregando áudio...</Text>
          )}
          {comentAudioError && (
            <Text style={styles.errorText}>Erro: {comentAudioError}</Text>
          )}
          
          {comentHasAudio && comentByIndex[comentAudioIdx] && (
            <View style={styles.audioSection}>
              <AudioPlayerSimple src={comentByIndex[comentAudioIdx]} />
              
              {comentTotal > 1 && (
                <View style={styles.audioPaginacao}>
                  {comentPages.map((p) => (
                    <TouchableOpacity
                      key={p.index}
                      onPress={() => setComentAudioIdx(p.index)}
                      style={[
                        styles.audioPaginacaoBtn,
                        comentAudioIdx === p.index && styles.audioPaginacaoBtnAtivo,
                      ]}
                    >
                      <Text
                        style={[
                          styles.audioPaginacaoText,
                          comentAudioIdx === p.index && styles.audioPaginacaoTextAtivo,
                        ]}
                      >
                        Áudio {p.index + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* HTML do Comentário */}
          {comentarioTexto ? (
            <RenderHTML
              contentWidth={width - 64}
              source={{ html: comentarioTexto }}
              baseStyle={styles.htmlBase}
              tagsStyles={{
                p: styles.htmlParagraph,
                strong: styles.htmlStrong,
                em: styles.htmlEm,
              }}
            />
          ) : (
            !comentAudioLoading && !comentHasAudio && (
              <Text style={styles.emptyText}>
                Sem comentários em texto/áudio.
              </Text>
            )
          )}
        </>
      )}
    </View>
  );

  const renderConteudoComentarioVideo = () => (
    <View style={styles.conteudoContainer}>
      {!respondido ? (
        <View style={styles.bloqueadoContainer}>
          <Ionicons name="lock-closed" size={48} color="#D1D5DB" />
          <Text style={styles.bloqueadoText}>
            Responda a questão para liberar os comentários
          </Text>
        </View>
      ) : comentarioVideoUrl ? (
        <View style={styles.videoContainer}>
          <Text style={styles.videoPlaceholder}>
            🎥 Vídeo de comentário
          </Text>
          <Text style={styles.videoUrl}>{comentarioVideoUrl}</Text>
          <Text style={styles.videoNote}>
            Nota: Integração com player de vídeo será implementada
          </Text>
        </View>
      ) : (
        <Text style={styles.emptyText}>Sem comentários em vídeo.</Text>
      )}
    </View>
  );

  const renderConteudo = () => {
    switch (abaAtiva) {
      case 'dica':
        return renderConteudoDica();
      case 'texto':
        return renderConteudoComentarioTexto();
      case 'video':
        return renderConteudoComentarioVideo();
      case 'forum':
        return <ForumDuvidasQuestao questaoId={questaoId} />;
      case 'estatisticas':
        return <EstatisticasQuestao questaoId={questaoId} />;
      default:
        return null;
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conteúdo Extra</Text>
        <TouchableOpacity
          onPress={() => bottomSheetRef.current?.close()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Abas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.abasContainer}
      >
        {temDica && renderAbaButton('dica', 'bulb-outline', 'Dica', true)}
        {temTexto && renderAbaButton('texto', 'document-text-outline', 'Texto', true)}
        {temVideo && renderAbaButton('video', 'videocam-outline', 'Vídeo', true)}
        {renderAbaButton('forum', 'chatbubbles-outline', 'Fórum', true)}
        {renderAbaButton('estatisticas', 'stats-chart-outline', 'Estatísticas', true)}
      </ScrollView>

      {/* Conteúdo da aba ativa */}
      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderConteudo()}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  abasContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  abaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  abaButtonAtiva: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C084FC',
  },
  abaButtonDisabled: {
    opacity: 0.5,
  },
  abaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  abaLabelAtiva: {
    color: '#7C3AED',
  },
  abaLabelDisabled: {
    color: '#D1D5DB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  conteudoContainer: {
    padding: 20,
    gap: 16,
  },
  audioSection: {
    gap: 12,
  },
  audioPaginacao: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  audioPaginacaoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  audioPaginacaoBtnAtivo: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  audioPaginacaoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  audioPaginacaoTextAtivo: {
    color: '#FFFFFF',
  },
  htmlBase: {
    fontSize: 14,
    lineHeight: 22,
    color: '#111827',
  },
  htmlParagraph: {
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 22,
    color: '#111827',
  },
  htmlStrong: {
    fontWeight: '700',
  },
  htmlEm: {
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 24,
  },
  bloqueadoContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 48,
  },
  bloqueadoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
  videoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  videoPlaceholder: {
    fontSize: 32,
  },
  videoUrl: {
    fontSize: 12,
    color: '#7C3AED',
    textAlign: 'center',
  },
  videoNote: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});