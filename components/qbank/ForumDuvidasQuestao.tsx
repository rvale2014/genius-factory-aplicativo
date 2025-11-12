// components/ForumDuvidasQuestao.tsx
import { api } from '@/src/lib/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  questaoId: string;
};

type Duvida = {
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

export default function ForumDuvidasQuestao({ questaoId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duvidas, setDuvidas] = useState<Duvida[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [novaDuvida, setNovaDuvida] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetchDuvidas();
  }, [questaoId, page]);

  async function fetchDuvidas() {
    setLoading(true);
    setError(null);
  
    try {
      const { data } = await api.get('/mobile/v1/qbank/forum/duvidas', {
        params: {
          questaoId,
          page: 1,
          pageSize: 10,
        },
      });
      
      setDuvidas(Array.isArray(data?.items) ? data.items : []);
      setTotal(data?.total || 0);
      setTotal(data?.total || 0);
    } catch (err) {
      setError('Não foi possível carregar as dúvidas.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviarDuvida() {
    if (!novaDuvida.trim()) return;
  
    setEnviando(true);
    try {
      await api.post('/mobile/v1/qbank/forum/duvidas', {
        questaoId,
        corpo: novaDuvida.trim(),
        titulo: null,
        visibilidade: 'PRIVADO',
      });
  
      setNovaDuvida('');
      await fetchDuvidas();
    } catch (err) {
      console.error('Erro ao enviar dúvida:', err);
    } finally {
      setEnviando(false);
    }
  }

  function renderDuvida({ item }: { item: Duvida }) {
    // ✅ Formatar data
    const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // ✅ Avatar do aluno
    const avatarUrl = item.aluno?.foto || item.aluno?.avatar?.imageUrl;
    const nomeAluno = item.aluno?.nome || 'Aluno';
    const inicialAluno = nomeAluno.charAt(0).toUpperCase();

    return (
      <View style={styles.duvidaCard}>
        <View style={styles.duvidaHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{inicialAluno}</Text>
            </View>
          )}
          <Text style={styles.duvidaAutor}>{nomeAluno}</Text>
          <Text style={styles.duvidaData}>{dataFormatada}</Text>
        </View>
        
        <Text style={styles.duvidaTexto}>{item.corpo}</Text>
        
        <View style={styles.duvidaFooter}>
          <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
          <Text style={styles.duvidaRespostas}>
            {item._count.respostas} {item._count.respostas === 1 ? 'resposta' : 'respostas'}
          </Text>
          
          {item.status === 'RESPONDIDA' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Respondida</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7C3AED" />
        <Text style={styles.loadingText}>Carregando dúvidas...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={24} color="#7C3AED" />
        <Text style={styles.title}>Fórum de Dúvidas</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : duvidas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="help-circle-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            Nenhuma dúvida ainda. Seja o primeiro a perguntar!
          </Text>
        </View>
      ) : (
        <FlatList
          data={duvidas}
          renderItem={renderDuvida}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            total > duvidas.length ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => setPage((p) => p + 1)}
              >
                <Text style={styles.loadMoreText}>Carregar mais</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          value={novaDuvida}
          onChangeText={setNovaDuvida}
          placeholder="Digite sua dúvida..."
          multiline
          maxLength={500}
          style={styles.input}
        />
        
        <TouchableOpacity
          onPress={handleEnviarDuvida}
          disabled={!novaDuvida.trim() || enviando}
          style={[
            styles.sendButton,
            (!novaDuvida.trim() || enviando) && styles.sendButtonDisabled,
          ]}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  duvidaCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  duvidaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  duvidaAutor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  duvidaData: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  duvidaTexto: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  duvidaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  duvidaRespostas: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    marginLeft: 'auto',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  loadMoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});