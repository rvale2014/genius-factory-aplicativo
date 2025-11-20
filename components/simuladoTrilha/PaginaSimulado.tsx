// components/simuladoTrilha/PaginaSimulado.tsx
import { api } from '@/src/lib/api'; // ✅ CORRIGIDO
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type SimuladoMeta = {
  id: string
  titulo: string
  trilhaId: string
  caminhoId: string
  blocoId: string
  tempoMinutos: number
  totalQuestoes: number
  distribuicao: Array<{
    materiaId: string
    nome: string
    quantidade: number
  }>
  status: 'nao_iniciado' | 'em_andamento' | 'concluido'
  simuladoId: string | null
}

type Props = {
  atividadeId: string
  trilhaId: string
  caminhoId: string
  blocoId: string
  atividadeTitulo: string
  onMarcarConcluida: () => void
}

export function PaginaSimulado({
  atividadeId,
  trilhaId,
  caminhoId,
  blocoId,
  atividadeTitulo,
  onMarcarConcluida,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [iniciando, setIniciando] = useState(false)
  const [meta, setMeta] = useState<SimuladoMeta | null>(null)

  useEffect(() => {
    carregarMetadados()
  }, [atividadeId, trilhaId])

  async function carregarMetadados() {
    try {
      setLoading(true)
      
      // ✅ Usa api.get (token JWT automático)
      const { data } = await api.get<SimuladoMeta>(
        `/mobile/v1/trilhas/${trilhaId}/simulados/${atividadeId}`
      )
      
      setMeta(data)
    } catch (error: any) {
      console.error('[PaginaSimulado] Erro ao carregar:', error)
      Alert.alert('Erro', error?.response?.data?.error || 'Não foi possível carregar o simulado')
    } finally {
      setLoading(false)
    }
  }

  async function handleIniciar() {
    if (!meta) return

    try {
      setIniciando(true)

      // Inicia o simulado (idempotente - se já iniciado, retorna o mesmo ID)
      const { data } = await api.post<{ simuladoId: string; message: string }>(
        `/mobile/v1/trilhas/${trilhaId}/simulados/${atividadeId}/iniciar`
      )

      const { simuladoId } = data

      // ✅ SEMPRE salva/atualiza o contexto (mesmo se for retomada)
      const contexto = {
        trilhaId,
        caminhoId,
        blocoId,
        atividadeId,
      }
      
      console.log('[PaginaSimulado] Salvando contexto:', {
        simuladoId,
        contexto,
      })

      await AsyncStorage.setItem(
        `@geniusfactory:simulado-contexto-${simuladoId}`,
        JSON.stringify(contexto)
      )

      // ✅ VERIFICA se foi salvo corretamente
      const verificacao = await AsyncStorage.getItem(`@geniusfactory:simulado-contexto-${simuladoId}`)
      console.log('[PaginaSimulado] Contexto verificado:', verificacao)

      // Navega para a tela de resolver
      router.push(`/simulados/${simuladoId}/resolver`)
    } catch (error: any) {
      console.error('[PaginaSimulado] Erro ao iniciar:', error)
      Alert.alert('Erro', error?.response?.data?.error || 'Não foi possível iniciar o simulado')
    } finally {
      setIniciando(false)
    }
  }

  function formatTempo(minutos: number) {
    const h = Math.floor(minutos / 60)
      .toString()
      .padStart(2, '0')
    const m = (minutos % 60).toString().padStart(2, '0')
    return `${h}:${m}:00`
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Carregando simulado...</Text>
      </View>
    )
  }

  if (!meta) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Simulado não encontrado</Text>
      </View>
    )
  }

  const textoBotao =
    meta.status === 'concluido'
      ? 'Revisar'
      : meta.status === 'em_andamento'
      ? 'Continuar'
      : 'Iniciar'

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Card de Informações */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="school" size={20} color="#E91E63" />
          </View>
          <Text style={styles.title}>{atividadeTitulo}</Text>
        </View>

        <Text style={styles.description}>
          Este simulado funciona como uma prova de verdade!
        </Text>

        <Text style={styles.descriptionText}>
          Você terá um tempo máximo para resolver e só{' '}
          <Text style={styles.bold}>uma chance</Text> de responder. No final,
          sua pontuação será calculada com base no número de acertos.
          Capriche! 😉🧠✨
        </Text>

        <Text style={styles.descriptionText}>
          Você pode pausar o simulado a qualquer momento e continuar depois.
        </Text>

        {/* Informações do Simulado */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Tempo</Text>
            </View>
            <Text style={styles.infoValue}>{formatTempo(meta.tempoMinutos)}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="document-text-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Questões</Text>
            </View>
            <Text style={styles.infoValue}>{meta.totalQuestoes}</Text>
          </View>
        </View>

        {/* Distribuição por Matéria */}
        {meta.distribuicao.length > 0 && (
          <View style={styles.distribuicaoSection}>
            <Text style={styles.distribuicaoTitle}>Distribuição por matéria</Text>
            {meta.distribuicao.map((item) => (
              <View key={item.materiaId} style={styles.materiaRow}>
                <Text style={styles.materiaNome}>{item.nome}</Text>
                <View style={styles.materiaBadge}>
                  <Text style={styles.materiaBadgeText}>
                    {item.quantidade} {item.quantidade === 1 ? 'questão' : 'questões'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Botão de Ação */}
        <TouchableOpacity
          style={[styles.button, iniciando && styles.buttonDisabled]}
          onPress={handleIniciar}
          disabled={iniciando}
          activeOpacity={0.8}
        >
          {iniciando ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>{textoBotao}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#B91C1C',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontFamily: 'Inter-Bold',
  },
  infoSection: {
    marginTop: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#374151',
    fontFamily: 'Inter-Medium',
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  distribuicaoSection: {
    marginTop: 20,
    gap: 10,
  },
  distribuicaoTitle: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  materiaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  materiaNome: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  materiaBadge: {
    backgroundColor: '#E0E7FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  materiaBadgeText: {
    fontSize: 12,
    color: '#4F46E5',
    fontFamily: 'Inter-SemiBold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#30C58E',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: '#30C58E',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
})