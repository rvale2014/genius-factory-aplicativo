// components/curso/ForumDuvidasAula.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { api } from '../../src/lib/api';

type DuvidaItem = {
  id: string;
  titulo: string | null;
  corpo: string;
  status: 'ABERTA' | 'RESPONDIDA' | 'ARQUIVADA';
  visibilidade: 'PUBLICO' | 'PRIVADO';
  createdAt: string;
  respostaOficialId: string | null;
  _count: { respostas: number };
  aluno: {
    id: string;
    nome?: string | null;
    foto?: string | null;
    avatar?: { imageUrl: string } | null;
  };
};

type RespostaItem = {
  id: string;
  corpo: string;
  createdAt: string;
  ehOficial: boolean;
  autorAluno?: {
    id: string;
    nome?: string | null;
    foto?: string | null;
    avatar?: { imageUrl?: string | null } | null;
  } | null;
  autorUsuario?: {
    id: string;
    nome?: string | null;
    foto?: string | null;
  } | null;
};

interface ForumDuvidasAulaProps {
  aulaId: string;
}

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

export function ForumDuvidasAula({ aulaId }: ForumDuvidasAulaProps) {
  const { width } = useWindowDimensions();
  const [itens, setItens] = useState<DuvidaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form
  const [novoCorpo, setNovoCorpo] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Respostas
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [respostas, setRespostas] = useState<Record<string, RespostaItem[]>>({});
  const [loadingResp, setLoadingResp] = useState<Record<string, boolean>>({});
  const [erroResp, setErroResp] = useState<Record<string, string | null>>({});

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const url = `/mobile/v1/forum/aulas/${encodeURIComponent(aulaId)}?page=${page}&pageSize=${pageSize}`;

      const response = await api.get(url);
      const data = response.data;

      setItens(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.erro || e?.message || 'Erro inesperado';
      setErro(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [aulaId, page, pageSize]);

  useEffect(() => {
    if (aulaId) {
      setPage(1);
    }
  }, [aulaId]);

  useEffect(() => {
    if (aulaId) carregar();
  }, [aulaId, page, carregar]);

  const criarDuvida = useCallback(async () => {
    try {
      if (!novoCorpo.trim()) return;
      setSalvando(true);
      const response = await api.post(`/mobile/v1/forum/aulas/${encodeURIComponent(aulaId)}`, {
        titulo: null,
        corpo: novoCorpo.trim(),
        visibilidade: 'PRIVADO',
      });
      const data = response.data;

      // Prepend otimista
      setItens((prev) => [data as DuvidaItem, ...prev]);
      setTotal((t) => t + 1);
      setNovoCorpo('');
    } catch (e: any) {
      const errorMessage = e?.response?.data?.erro || e?.message || 'Erro ao criar dúvida';
      alert(errorMessage);
    } finally {
      setSalvando(false);
    }
  }, [aulaId, novoCorpo]);

  const carregarRespostas = useCallback(async (duvidaId: string) => {
    if (respostas[duvidaId]?.length) return; // já carregou
    try {
      setLoadingResp((prev) => ({ ...prev, [duvidaId]: true }));
      setErroResp((prev) => ({ ...prev, [duvidaId]: null }));
      const response = await api.get(
        `/mobile/v1/forum/duvidas/${encodeURIComponent(duvidaId)}/respostas`
      );
      const data = response.data;
      setRespostas((prev) => ({ ...prev, [duvidaId]: data.items || [] }));
    } catch (e: any) {
      const errorMessage = e?.response?.data?.erro || e?.message || 'Erro ao carregar respostas';
      setErroResp((prev) => ({
        ...prev,
        [duvidaId]: errorMessage,
      }));
    } finally {
      setLoadingResp((prev) => ({ ...prev, [duvidaId]: false }));
    }
  }, [respostas]);

  const toggleExpand = useCallback(
    (duvidaId: string) => {
      setExpanded((prev) => {
        const aberto = !prev[duvidaId];
        if (aberto) carregarRespostas(duvidaId);
        return { ...prev, [duvidaId]: aberto };
      });
    },
    [carregarRespostas]
  );

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'RESPONDIDA':
        return { bg: '#7A34FF', text: '#FFFFFF' };
      case 'ARQUIVADA':
        return { bg: '#F3F4F6', text: '#6B7280' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return 'Aberta';
      case 'RESPONDIDA':
        return 'Respondida';
      case 'ARQUIVADA':
        return 'Arquivada';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Formulário de nova dúvida */}
      <View style={styles.formContainer}>
        <TextInput
          value={novoCorpo}
          onChangeText={setNovoCorpo}
          placeholder="Escreva sua dúvida..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          style={styles.textInput}
          textAlignVertical="top"
        />
        <View style={styles.formActions}>
          <TouchableOpacity
            onPress={criarDuvida}
            disabled={salvando || !novoCorpo.trim()}
            style={[
              styles.submitButton,
              (salvando || !novoCorpo.trim()) && styles.submitButtonDisabled,
            ]}
          >
            <Text style={styles.submitButtonText}>
              {salvando ? 'Enviando...' : '+ Enviar dúvida'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de dúvidas */}
      {erro && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7A34FF" />
          <Text style={styles.loadingText}>Carregando dúvidas...</Text>
        </View>
      ) : itens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Ainda não há dúvidas nesta aula.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {itens.map((d) => {
            const statusStyle = getStatusBadgeStyle(d.status);
            const isExpanded = expanded[d.id];

            return (
              <View key={d.id} style={styles.duvidaCard}>
                {/* Header da dúvida */}
                <View style={styles.duvidaHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(d.aluno?.nome || '?').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.duvidaHeaderInfo}>
                    <View style={styles.duvidaHeaderRow}>
                      <Text style={styles.alunoNome}>
                        {d.aluno?.nome || 'Aluno'}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: statusStyle.text },
                          ]}
                        >
                          {getStatusLabel(d.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.duvidaData}>
                      {formatarData(d.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Corpo da dúvida */}
                <View style={styles.duvidaCorpoContainer}>
                  <RenderHTML
                    contentWidth={width - 80}
                    source={{ html: d.corpo || '<p></p>' }}
                    baseStyle={styles.duvidaCorpo}
                    tagsStyles={{
                      p: styles.htmlParagraphDuvida,
                      strong: styles.htmlStrong,
                      em: styles.htmlEm,
                      ul: styles.htmlList,
                      li: styles.htmlListItemDuvida,
                    }}
                  />
                </View>

                {/* Info e ação */}
                <View style={styles.duvidaFooter}>
                  <Text style={styles.duvidaInfo}>
                    {d._count.respostas} resposta(s)
                    {d.respostaOficialId ? ' • com resposta oficial' : ''}
                  </Text>

                  {d._count.respostas > 0 && (
                    <TouchableOpacity onPress={() => toggleExpand(d.id)}>
                      <Text style={styles.expandButton}>
                        {isExpanded ? 'Ocultar respostas' : 'Ver respostas'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Thread de respostas */}
                {isExpanded && (
                  <View style={styles.respostasContainer}>
                    {loadingResp[d.id] && (
                      <View style={styles.loadingRespContainer}>
                        <ActivityIndicator size="small" color="#7A34FF" />
                        <Text style={styles.loadingRespText}>
                          Carregando respostas...
                        </Text>
                      </View>
                    )}

                    {erroResp[d.id] && (
                      <Text style={styles.erroRespText}>{erroResp[d.id]}</Text>
                    )}

                    {(respostas[d.id] || []).map((r) => {
                      const isProf = Boolean(r.autorUsuario);
                      const isOficial = r.ehOficial;
                      const autorNome =
                        r.autorUsuario?.nome || r.autorAluno?.nome || '—';

                      return (
                        <View
                          key={r.id}
                          style={[
                            styles.respostaCard,
                            isOficial
                              ? styles.respostaOficial
                              : isProf
                              ? styles.respostaProfessor
                              : styles.respostaAluno,
                          ]}
                        >
                          <View style={styles.respostaHeader}>
                            <Text style={styles.respostaTipo}>
                              {isProf ? 'Professor' : 'Aluno'}
                            </Text>
                            <Text style={styles.respostaAutor}>
                              • {autorNome}
                            </Text>
                            <Text style={styles.respostaData}>
                              {formatarData(r.createdAt)}
                            </Text>
                          </View>

                          <View style={styles.respostaCorpoContainer}>
                            <RenderHTML
                              contentWidth={width - 80}
                              source={{ html: r.corpo || '<p></p>' }}
                              baseStyle={styles.respostaCorpo}
                              tagsStyles={{
                                p: styles.htmlParagraph,
                                strong: styles.htmlStrong,
                                em: styles.htmlEm,
                                ul: styles.htmlList,
                                li: styles.htmlListItem,
                              }}
                            />
                          </View>

                          {isOficial && (
                            <View style={styles.oficialBadge}>
                              <Ionicons
                                name="checkmark-circle"
                                size={12}
                                color="#16A34A"
                              />
                              <Text style={styles.oficialText}>
                                Resposta oficial
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {!loadingResp[d.id] &&
                      (respostas[d.id]?.length ?? 0) === 0 && (
                        <Text style={styles.semRespostasText}>
                          Sem respostas ainda.
                        </Text>
                      )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Paginação */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              >
                <Text style={styles.paginationButtonText}>Anterior</Text>
              </TouchableOpacity>

              <Text style={styles.paginationInfo}>
                Página {page} de {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
              >
                <Text style={styles.paginationButtonText}>Próxima</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    minHeight: 70,
    fontFamily: getInterFont('400'),
    color: '#111827',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#7A34FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: getInterFont('400'),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
  listContainer: {
    gap: 12,
  },
  duvidaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  duvidaHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  avatarContainer: {
    paddingTop: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7A34FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  duvidaHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  duvidaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alunoNome: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: getInterFont('600'),
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: getInterFont('500'),
  },
  duvidaData: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
  duvidaCorpoContainer: {
    marginBottom: 8,
  },
  duvidaCorpo: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
    fontFamily: getInterFont('400'),
    textAlign: 'justify',
  },
  respostaCorpoContainer: {
    marginBottom: 0,
  },
  duvidaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duvidaInfo: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
  expandButton: {
    fontSize: 11,
    color: '#7A34FF',
    fontWeight: '500',
    fontFamily: getInterFont('500'),
  },
  respostasContainer: {
    marginTop: 12,
    gap: 8,
  },
  loadingRespContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingRespText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
  erroRespText: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: getInterFont('400'),
  },
  respostaCard: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
  },
  respostaOficial: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    marginLeft: 16,
  },
  respostaProfessor: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E9D5FF',
  },
  respostaAluno: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  respostaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  respostaTipo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    fontFamily: getInterFont('600'),
  },
  respostaAutor: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
  respostaData: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 'auto',
    fontFamily: getInterFont('400'),
  },
  respostaCorpo: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    fontFamily: getInterFont('400'),
    textAlign: 'justify',
  },
  htmlParagraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontFamily: getInterFont('400'),
    marginVertical: 4,
    textAlign: 'justify',
  },
  htmlParagraphDuvida: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
    fontFamily: getInterFont('400'),
    marginVertical: 4,
    textAlign: 'justify',
  },
  htmlStrong: {
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  htmlEm: {
    fontStyle: 'italic',
  },
  htmlList: {
    marginVertical: 8,
    paddingLeft: 20,
  },
  htmlListItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontFamily: getInterFont('400'),
    marginVertical: 2,
  },
  htmlListItemDuvida: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
    fontFamily: getInterFont('400'),
    marginVertical: 2,
  },
  oficialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  oficialText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: getInterFont('600'),
  },
  semRespostasText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    fontFamily: getInterFont('400'),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 13,
    color: '#374151',
    fontFamily: getInterFont('500'),
  },
  paginationInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: getInterFont('400'),
  },
});