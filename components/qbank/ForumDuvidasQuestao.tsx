// components/ForumDuvidasQuestao.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
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
  texto: string;
  autor: string;
  data: string;
  respostas: number;
};

export default function ForumDuvidasQuestao({ questaoId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duvidas, setDuvidas] = useState<Duvida[]>([]);
  const [novaDuvida, setNovaDuvida] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetchDuvidas();
  }, [questaoId]);

  async function fetchDuvidas() {
    setLoading(true);
    setError(null);

    try {
      // TODO: Substituir pela sua API real quando estiver pronta
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/qbank/forum/duvidas?questaoId=${questaoId}`
      );

      if (!response.ok) {
        throw new Error('Falha ao carregar dúvidas');
      }

      const data = await response.json();
      setDuvidas(Array.isArray(data?.duvidas) ? data.duvidas : []);
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
      // TODO: Substituir pela sua API real quando estiver pronta
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/qbank/forum/duvidas`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questaoId,
            texto: novaDuvida.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao enviar dúvida');
      }

      setNovaDuvida('');
      await fetchDuvidas();
    } catch (err) {
      console.error('Erro ao enviar dúvida:', err);
    } finally {
      setEnviando(false);
    }
  }

  function renderDuvida({ item }: { item: Duvida }) {
    return (
      <View style={styles.duvidaCard}>
        <View style={styles.duvidaHeader}>
          <Ionicons name="person-circle-outline" size={20} color="#7C3AED" />
          <Text style={styles.duvidaAutor}>{item.autor}</Text>
          <Text style={styles.duvidaData}>{item.data}</Text>
        </View>
        
        <Text style={styles.duvidaTexto}>{item.texto}</Text>
        
        <View style={styles.duvidaFooter}>
          <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
          <Text style={styles.duvidaRespostas}>
            {item.respostas} {item.respostas === 1 ? 'resposta' : 'respostas'}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
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