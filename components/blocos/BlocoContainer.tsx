// components/blocos/BlocoContainer.tsx

import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { buscarQuestoesLote, concluirBloco, obterBloco } from '../../src/services/blocoService'
import { BarraNavegacaoPaginas } from './BarraNavegacaoPaginas'
import { ModalConquistas } from './ModalConquistas'
import { PaginaRenderer } from './PaginaRenderer'

type PaginaInfo = {
  tipo: 'leitura' | 'video' | 'questoes'
  atividadeIndex: number
  paginaInterna: number
  html: string
}

export function BlocoContainer() {
  const { id, caminhoId, blocoId } = useLocalSearchParams<{
    id: string
    caminhoId: string
    blocoId: string
  }>()
  const router = useRouter()

  // Estados principais
  const [loading, setLoading] = useState(true)
  const [atividades, setAtividades] = useState<any[]>([])
  const [questoesMap, setQuestoesMap] = useState<Record<string, any>>({} as Record<string, any>)
  const [caminho, setCaminho] = useState<any>(null)
  const [trilhaNome, setTrilhaNome] = useState('')

  // Paginação
  const [paginas, setPaginas] = useState<PaginaInfo[]>([])
  const [paginaAtual, setPaginaAtual] = useState(0)
  const [paginasConcluidas, setPaginasConcluidas] = useState<boolean[]>([])

  // Conquistas
  const [conquistasDesbloqueadas, setConquistasDesbloqueadas] = useState<any[]>([])
  const [modalConquistaAberto, setModalConquistaAberto] = useState(false)

  // Encerrando bloco
  const [encerrando, setEncerrando] = useState(false)

  // Referência para rastrear última página (detectar direção da navegação)
  const [ultimaPaginaVisitada, setUltimaPaginaVisitada] = useState<number | null>(null)

  // 1. Carregar dados do bloco
  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true)

        // Busca dados do bloco
        const dados = await obterBloco(id, caminhoId, blocoId)

        setAtividades(dados.atividades)
        setCaminho(dados.caminho)
        setTrilhaNome(dados.trilha?.nome || '')

        // Busca questões em lote
        const todasQuestoesIds = dados.atividades
          .filter(a => a.tipo === 'questoes')
          .flatMap(a => a.questaoIds || [])

        if (todasQuestoesIds.length > 0) {
          const questoes = await buscarQuestoesLote(todasQuestoesIds)
          const mapa: Record<string, any> = {}
          questoes.forEach(q => {
            mapa[q.id] = q
          })
          setQuestoesMap(mapa)
        }

        // Gera páginas navegáveis
        const paginasGeradas = gerarPaginas(dados.atividades)
        setPaginas(paginasGeradas)

        // Restaura posição do AsyncStorage
        await restaurarPosicao(blocoId, paginasGeradas.length)
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Não foi possível carregar o bloco')
        router.back()
      } finally {
        setLoading(false)
      }
    }

    if (id && caminhoId && blocoId) {
      carregar()
    }
  }, [id, caminhoId, blocoId, router])

  // 2. Restaurar posição do AsyncStorage
  async function restaurarPosicao(blocoId: string, totalPaginas: number) {
    try {
      const posKey = `@geniusfactory:pos-bloco-${blocoId}`
      const doneKey = `@geniusfactory:done-bloco-${blocoId}`

      const [posRaw, doneRaw] = await Promise.all([
        AsyncStorage.getItem(posKey),
        AsyncStorage.getItem(doneKey),
      ])

      const pos = posRaw ? parseInt(posRaw, 10) : 0
      const done = doneRaw ? JSON.parse(doneRaw) : []

      if (pos >= 0 && pos < totalPaginas) {
        setPaginaAtual(pos)
        setUltimaPaginaVisitada(pos)
      }

      setPaginasConcluidas(
        Array.from({ length: totalPaginas }, (_, i) => Boolean(done[i]))
      )
    } catch (error) {
      console.warn('[restaurarPosicao] Erro:', error)
    }
  }

  // 3. Persistir posição no AsyncStorage
  useEffect(() => {
    if (!blocoId || paginas.length === 0) return

    const posKey = `@geniusfactory:pos-bloco-${blocoId}`
    AsyncStorage.setItem(posKey, String(paginaAtual))
  }, [paginaAtual, blocoId, paginas.length])

  // 4. Persistir páginas concluídas
  useEffect(() => {
    if (!blocoId || paginasConcluidas.length === 0) return

    const doneKey = `@geniusfactory:done-bloco-${blocoId}`
    AsyncStorage.setItem(doneKey, JSON.stringify(paginasConcluidas))
  }, [paginasConcluidas, blocoId])

  // 5. Marcar página como concluída
  const marcarConcluida = useCallback((index: number) => {
    setPaginasConcluidas(prev => {
      if (prev[index]) return prev // Já concluída
      const next = [...prev]
      next[index] = true
      return next
    })
  }, [])

  // 6. Auto-marcar leitura/vídeo como concluída ao avançar
  useEffect(() => {
    if (ultimaPaginaVisitada === null) {
      setUltimaPaginaVisitada(paginaAtual)
      return
    }

    // Se avançou (novo índice > anterior)
    if (paginaAtual > ultimaPaginaVisitada) {
      const paginaAnterior = paginas[ultimaPaginaVisitada]
      if (paginaAnterior && (paginaAnterior.tipo === 'leitura' || paginaAnterior.tipo === 'video')) {
        marcarConcluida(ultimaPaginaVisitada)
      }
    }

    setUltimaPaginaVisitada(paginaAtual)
  }, [paginaAtual, paginas, ultimaPaginaVisitada, marcarConcluida])

  // 7. Navegação
  const avancar = useCallback(() => {
    if (paginaAtual < paginas.length - 1) {
      setPaginaAtual(paginaAtual + 1)
    }
  }, [paginaAtual, paginas.length])

  const voltar = useCallback(() => {
    if (paginaAtual > 0) {
      setPaginaAtual(paginaAtual - 1)
    }
  }, [paginaAtual])

  // 8. Verificar se pode encerrar
  const podeEncerrar = useMemo(() => {
    // Todas as páginas devem estar concluídas
    return paginasConcluidas.every(c => c)
  }, [paginasConcluidas])

  // 9. Encerrar bloco
  const handleEncerrar = useCallback(async () => {
    if (!podeEncerrar) {
      Alert.alert(
        'Atenção',
        'Você precisa completar todas as atividades antes de encerrar o bloco'
      )
      return
    }

    try {
      setEncerrando(true)

      const data = await concluirBloco(blocoId)

      if (data.novasConquistas?.length > 0) {
        setConquistasDesbloqueadas(data.novasConquistas)
        setModalConquistaAberto(true)
      } else {
        // Navega direto para o caminho
        await limparPersistencia(blocoId)
        router.push(`/trilhas/${id}/caminhos/${caminhoId}`)
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível encerrar o bloco')
    } finally {
      setEncerrando(false)
    }
  }, [podeEncerrar, blocoId, id, caminhoId, router])

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Carregando bloco...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const paginaInfo = paginas[paginaAtual]
  const atividade = atividades[paginaInfo?.atividadeIndex]

  if (!paginaInfo || !atividade) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Página não encontrada</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header com título e botão voltar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {atividade.titulo}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de navegação com círculos */}
        <BarraNavegacaoPaginas
          totalPaginas={paginas.length}
          paginaAtual={paginaAtual}
          paginasConcluidas={paginasConcluidas}
          onIrParaPagina={setPaginaAtual}
        />

        {/* Renderiza a página atual */}
        <PaginaRenderer
          pagina={paginaInfo}
          atividade={atividade}
          questoesMap={questoesMap}
          blocoId={blocoId}
          trilhaId={id}
          caminhoId={caminhoId}
          onMarcarConcluida={() => marcarConcluida(paginaAtual)}
        />

        {/* Botões de navegação */}
        <View style={styles.navegacao}>
          {paginaAtual > 0 && (
            <TouchableOpacity
              onPress={voltar}
              style={styles.botaoNavegacao}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={16} color="#7C3AED" />
              <Text style={styles.botaoNavegacaoTexto}>Anterior</Text>
            </TouchableOpacity>
          )}

          {paginaAtual < paginas.length - 1 ? (
            <TouchableOpacity
              onPress={avancar}
              style={[styles.botaoNavegacao, styles.botaoProxima]}
              activeOpacity={0.8}
            >
              <Text style={styles.botaoNavegacaoTexto}>Próxima</Text>
              <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleEncerrar}
              disabled={!podeEncerrar || encerrando}
              style={[
                styles.botaoEncerrar,
                (!podeEncerrar || encerrando) && styles.botaoEncerrarDisabled,
              ]}
              activeOpacity={0.8}
            >
              {encerrando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.botaoEncerrarTexto}>Encerrar Bloco</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal de conquistas */}
      <ModalConquistas
        visible={modalConquistaAberto}
        conquistas={conquistasDesbloqueadas}
        onClose={async () => {
          setModalConquistaAberto(false)
          await limparPersistencia(blocoId)
          router.push(`/trilhas/${id}/caminhos/${caminhoId}`)
        }}
      />
    </SafeAreaView>
  )
}

// ========================================
// HELPERS
// ========================================

/**
 * Gera páginas navegáveis a partir das atividades
 */
function gerarPaginas(atividades: any[]): PaginaInfo[] {
  const paginas: PaginaInfo[] = []

  atividades.forEach((atividade, idx) => {
    if (atividade.tipo === 'leitura' && atividade.conteudoTexto) {
      // Por enquanto, uma página por atividade de leitura
      // TODO: Dividir em múltiplas páginas se necessário
      paginas.push({
        tipo: 'leitura',
        atividadeIndex: idx,
        paginaInterna: 0,
        html: atividade.conteudoTexto,
      })
    } else if (atividade.tipo === 'video' && atividade.videoUrl) {
      paginas.push({
        tipo: 'video',
        atividadeIndex: idx,
        paginaInterna: 0,
        html: atividade.videoUrl,
      })
    } else if (atividade.tipo === 'questoes' && atividade.questaoIds) {
      atividade.questaoIds.forEach((questaoId: string, i: number) => {
        paginas.push({
          tipo: 'questoes',
          atividadeIndex: idx,
          paginaInterna: i,
          html: questaoId,
        })
      })
    }
  })

  return paginas
}

/**
 * Limpa persistência do AsyncStorage
 */
async function limparPersistencia(blocoId: string) {
  try {
    await AsyncStorage.multiRemove([
      `@geniusfactory:pos-bloco-${blocoId}`,
      `@geniusfactory:done-bloco-${blocoId}`,
    ])
  } catch (error) {
    console.warn('[limparPersistencia] Erro:', error)
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
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
  navegacao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  botaoNavegacao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
  },
  botaoProxima: {
    marginLeft: 'auto',
  },
  botaoNavegacaoTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    fontFamily: 'Inter-SemiBold',
  },
  botaoEncerrar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#30C58E',
    marginLeft: 'auto',
  },
  botaoEncerrarDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  botaoEncerrarTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
})