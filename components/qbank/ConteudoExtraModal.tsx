// components/ConteudoExtraModal.tsx
import { useQbankAudios } from '@/src/hooks/useQbankAudios';
import { Ionicons } from '@expo/vector-icons';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AudioPlayerSimple from './AudioPlayerSimple';
import EstatisticasQuestao from './EstatisticasQuestao';
import ForumDuvidasQuestao from './ForumDuvidasQuestao';

type Aba = 'dica' | 'texto' | 'forum' | 'estatisticas';

type Props = {
  questaoId: string;
  dica?: string | null;
  comentarioTexto?: string | null;
  comentarioVideoUrl?: string | null;
  respondido: boolean;
};

export type ConteudoExtraModalRef = {
  open: (aba?: Aba) => void;
  close: () => void;
};

const ConteudoExtraModal = forwardRef<ConteudoExtraModalRef, Props>(
  (
    {
      questaoId,
      dica,
      comentarioTexto,
      comentarioVideoUrl,
      respondido,
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets();
    const { height, width } = useWindowDimensions();
    
    // ✅ CORRIGIDO: Modal sempre ocupa 90% da altura
    const sheetHeight = useMemo(
      () => Math.round(height * 0.9),
      [height],
    );

    const [visible, setVisible] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState<Aba>('dica');
    const [dicaAudioIdx, setDicaAudioIdx] = useState(0);
    const [comentAudioIdx, setComentAudioIdx] = useState(0);
    const [shouldFetchAudios, setShouldFetchAudios] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        open: (aba?: Aba) => {
          if (aba) {
            setAbaAtiva(aba);
          }
          setShouldFetchAudios(true);
          setVisible(true);
        },
        close: () => {
          setVisible(false);
        },
      }),
      [questaoId],
    );

    const {
      loading: dicaAudioLoading,
      error: dicaAudioError,
      pages: dicaPages,
      byIndex: dicaByIndex,
      hasAudio: dicaHasAudio,
      totalPages: dicaTotal,
    } = useQbankAudios({ questaoId, kind: 'dica', enabled: shouldFetchAudios });

    const {
      loading: comentAudioLoading,
      error: comentAudioError,
      pages: comentPages,
      byIndex: comentByIndex,
      hasAudio: comentHasAudio,
      totalPages: comentTotal,
    } = useQbankAudios({ questaoId, kind: 'comentario', enabled: shouldFetchAudios });

    const temDica = Boolean(dica) || dicaHasAudio;
    const temTexto = Boolean(comentarioTexto) || comentHasAudio;

    // Memoizar contentWidth para evitar recálculos
    const contentWidth = useMemo(() => width - 48, [width]);

    // Memoizar props do RenderHTML para evitar rerenders desnecessários
    const tagsStylesHTML = useMemo(() => ({
      p: styles.htmlParagraph,
      strong: styles.htmlStrong,
      em: styles.htmlEm,
    }), []);

    const htmlSourceDica = useMemo(() => ({
      html: dica || '',
    }), [dica]);

    const htmlSourceComentario = useMemo(() => ({
      html: comentarioTexto || '',
    }), [comentarioTexto]);

    const handleChangeAba = useCallback((aba: Aba) => {
      // ✅ Permitir mudança de aba, mas bloquear conteúdo se não respondido
      setAbaAtiva(aba);
    }, []);

    // ✅ CORRIGIDO: Renderizar botão com flexWrap e melhor layout
    const renderAbaButton = (
      aba: Aba,
      label: string,
      disponivel: boolean = true,
    ) => {
      const bloqueada = !respondido && aba === 'texto';
      const ativa = abaAtiva === aba;

      return (
        <TouchableOpacity
          key={aba}
          onPress={() => handleChangeAba(aba)}
          disabled={!disponivel}
          style={[
            styles.abaButton,
            ativa && styles.abaButtonAtiva,
            !disponivel && styles.abaButtonDisabled,
          ]}
          activeOpacity={0.85}
        >
          <View style={styles.abaButtonContent}>
            <Text
              style={[
                styles.abaLabel,
                ativa && styles.abaLabelAtiva,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {bloqueada && (
              <Ionicons name="lock-closed" size={12} color="#94A3B8" />
            )}
          </View>
        </TouchableOpacity>
      );
    };

    const renderConteudoDica = () => (
      <View style={styles.conteudoContainer}>
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

        {dica ? (
          <RenderHTML
            contentWidth={contentWidth}
            source={htmlSourceDica}
            baseStyle={styles.htmlBase}
            tagsStyles={tagsStylesHTML}
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
              Responda essa questão para liberar os comentários
            </Text>
          </View>
        ) : (
          <>
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

            {comentarioTexto ? (
              <RenderHTML
                contentWidth={contentWidth}
                source={htmlSourceComentario}
                baseStyle={styles.htmlBase}
                tagsStyles={tagsStylesHTML}
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

    const renderConteudo = () => {
      switch (abaAtiva) {
        case 'dica':
          return renderConteudoDica();
        case 'texto':
          return renderConteudoComentarioTexto();
        case 'forum':
          return <ForumDuvidasQuestao questaoId={questaoId} />;
        case 'estatisticas':
          return <EstatisticasQuestao questaoId={questaoId} />;
        default:
          return null;
      }
    };

    const handleClose = () => {
      setVisible(false);
    };

    return (
      <Modal
        transparent
        animationType="slide"
        visible={visible}
        onRequestClose={handleClose}
        statusBarTranslucent  // ✅ ADICIONAR
      >
        {/* ✅ CORRIGIDO: Overlay sem paddingBottom */}
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          
          {/* ✅ CORRIGIDO: Container com altura fixa de 90% */}
          <View
            style={[
              styles.container,
              {
                height: sheetHeight,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            <View style={styles.dragIndicator} />

            <View style={styles.header}>
              <Text style={styles.headerTitle}>Informações</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <View style={styles.abasContainer}>
              <View style={styles.abasBar}>
                {renderAbaButton('dica', 'Dicas', temDica)}
                {renderAbaButton('texto', 'Comentários', temTexto)}
                {renderAbaButton('forum', 'Dúvidas', true)}
                {renderAbaButton('estatisticas', 'Estatísticas', true)}
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {renderConteudo()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

ConteudoExtraModal.displayName = 'ConteudoExtraModal';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    // ✅ REMOVIDO: paddingBottom
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    overflow: 'hidden',
    width: '100%',
    // ✅ NOTA: height agora vem inline do componente
  },
  dragIndicator: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  abasContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  abasBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  abaButton: {
    flex: 1,
    paddingVertical: 10,  // ✅ AUMENTADO para acomodar ícone
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    minHeight: 40,  // ✅ ADICIONAR altura mínima
  },
  abaButtonAtiva: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  abaButtonDisabled: {
    opacity: 0.4,
  },
  // ✅ NOVO: Container para texto + ícone
  abaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexWrap: 'wrap',  // ✅ Permite quebra se necessário
  },
  abaLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#475569',
    textAlign: 'center',
    flexShrink: 1,  // ✅ Permite encolher se necessário
  },
  abaLabelAtiva: {
    color: '#312E81',
  },
  abaLabelDisabled: {
    color: '#CBD5F5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  conteudoContainer: {
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
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  audioPaginacaoText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-SemiBold',
  },
  audioPaginacaoTextAtivo: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  htmlBase: {
    fontSize: 15,
    lineHeight: 22,
    color: '#0F172A',
    fontFamily: 'Inter-Medium',
    textAlign: 'justify',
  },
  htmlParagraph: {
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#0F172A',
    fontFamily: 'Inter-Medium',
    textAlign: 'justify',
  },
  htmlStrong: {
    fontFamily: 'Inter-SemiBold',
  },
  htmlEm: {
    fontStyle: 'italic',
    fontFamily: 'Inter-Medium',
  },
  loadingText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: 'Inter-Medium',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 24,
    fontFamily: 'Inter-Medium',
  },
  bloqueadoContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 48,
  },
  bloqueadoText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    maxWidth: '80%',
  },
  videoContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  videoPlaceholder: {
    fontSize: 32,
    fontFamily: 'Inter-SemiBold',
  },
  videoUrl: {
    fontSize: 12,
    color: '#6366F1',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  videoNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
});

export default ConteudoExtraModal;

