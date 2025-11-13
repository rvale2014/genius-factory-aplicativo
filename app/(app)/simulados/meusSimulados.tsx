// app/(app)/simulados/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Clock, FileText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obterSimulados, type SimuladoItem } from '../../../src/services/simuladosService';

// Helper para obter o nome correto da fonte Inter baseado no fontWeight
function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

// Formata a data para exibição
function formatarData(dataISO: string): string {
  const data = new Date(dataISO);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export default function MeusSimuladosScreen() {
  const router = useRouter();
  const [simulados, setSimulados] = useState<SimuladoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    carregarSimulados();
  }, []);

  async function carregarSimulados() {
    try {
      setLoading(true);
      setErro(null);
      const dados = await obterSimulados();
      setSimulados(dados.simulados);
      setIsEmpty(dados.isEmpty);
    } catch (e: any) {
      console.error('Erro ao carregar simulados:', e);
      setErro('Não foi possível carregar os simulados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleSimuladoPress(simulado: SimuladoItem) {
    if (simulado.status === 'CONCLUIDO') {
      router.push(`/simulados/${simulado.id}/resultado`);
    } else {
      router.push(`/simulados/${simulado.id}/resolver`);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'PAUSADO':
        return '#FF9800';
      case 'CONCLUIDO':
        return '#14b8a6';
      case 'NAO_INICIADO':
        return '#666';
      default:
        return '#666';
    }
  }

  function getStatusIcon(status: string): any {
    switch (status) {
      case 'PAUSADO':
        return 'pause-circle';
      case 'CONCLUIDO':
        return 'checkmark-circle';
      case 'NAO_INICIADO':
        return 'time-outline';
      default:
        return 'time-outline';
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus Simulados</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando simulados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (erro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus Simulados</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#b00020" />
          <Text style={styles.errorText}>{erro}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={carregarSimulados}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus Simulados</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <FileText size={64} color="#E0E0E0" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Nenhum simulado encontrado</Text>
          <Text style={styles.emptyText}>
            Você ainda não iniciou nenhum simulado. Comece agora para testar seus conhecimentos!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Simulados</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {simulados.map((simulado) => (
          <TouchableOpacity
            key={simulado.id}
            style={styles.simuladoCard}
            onPress={() => handleSimuladoPress(simulado)}
            activeOpacity={0.7}
          >
            <View style={styles.simuladoHeader}>
              <Text style={styles.simuladoNome}>{simulado.nome}</Text>
              <View style={styles.simuladoDateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.simuladoData}>{formatarData(simulado.data)}</Text>
              </View>
            </View>

            <View style={styles.simuladoBody}>
              <View style={styles.simuladoInfoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="document-text-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    {simulado.progresso.respondidas}/{simulado.progresso.total}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#14b8a6" />
                  <Text style={styles.infoText}>{simulado.acertos} acertos</Text>
                </View>
              </View>

              {simulado.tempoDecorrido && (
                <View style={styles.tempoContainer}>
                  <Clock size={16} color="#FF9800" strokeWidth={2} />
                  <Text style={styles.tempoText}>{simulado.tempoDecorrido}</Text>
                </View>
              )}

              <View style={styles.simuladoFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(simulado.status)}15` },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(simulado.status)}
                    size={14}
                    color={getStatusColor(simulado.status)}
                  />
                  <Text
                    style={[styles.statusText, { color: getStatusColor(simulado.status) }]}
                  >
                    {simulado.statusExibicao ||
                      (simulado.status === 'PAUSADO' ? 'Em Andamento' : 'Status')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSimuladoPress(simulado)}
                >
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#b00020',
    textAlign: 'center',
    fontFamily: getInterFont('400'),
  },
  retryButton: {
    backgroundColor: '#FF5FDB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    fontFamily: getInterFont('700'),
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: getInterFont('400'),
  },
  simuladoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  simuladoHeader: {
    marginBottom: 12,
  },
  simuladoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    fontFamily: getInterFont('600'),
  },
  simuladoDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  simuladoData: {
    fontSize: 12,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  simuladoBody: {
    gap: 12,
  },
  simuladoInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  tempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tempoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9800',
    fontFamily: getInterFont('700'),
  },
  simuladoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});