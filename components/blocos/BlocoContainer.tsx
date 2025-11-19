// components/blocos/BlocoContainer.tsx

import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { invalidarCacheCaminho } from '../../src/services/caminhoService'
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

  console.log('📦 BlocoContainer montado!')
  console.log('   Parâmetros recebidos:', { id, caminhoId, blocoId })

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
  const [paginasComErro, setPaginasComErro] = useState<number[]>([])

  // Conquistas
  const [conquistasDesbloqueadas, setConquistasDesbloqueadas] = useState<any[]>([])
  const [modalConquistaAberto, setModalConquistaAberto] = useState(false)

  // Encerrando bloco
  const [encerrando, setEncerrando] = useState(false)

  // Referência para rastrear última página (detectar direção da navegação)
  const [ultimaPaginaVisitada, setUltimaPaginaVisitada] = useState<number | null>(null)
  
  // Ref para o ScrollView (para controlar scroll ao topo)
  const scrollViewRef = useRef<ScrollView>(null)

  // 2. Restaurar posição do AsyncStorage
  const [posicaoRestaurada, setPosicaoRestaurada] = useState<number | null>(null)
  
  // Ref para rastrear se o carregamento inicial já foi feito
  const initialLoadedRef = useRef(false)
  
  async function restaurarPosicao(blocoId: string, totalPaginas: number, paginasInfo: PaginaInfo[], questoesMap: Record<string, any>) {
    try {
      // PRIMEIRO: Verificar se o bloco está em modo "refazer"
      const refazerKey = `@geniusfactory:refazer-bloco-${blocoId}`;
      const emModoRefazer = await AsyncStorage.getItem(refazerKey);
      
      console.log(`[BlocoContainer.restaurarPosicao] 🔍 Modo refazer: ${emModoRefazer}`);
      
      // Se está em modo refazer, NÃO restaura nada - começa do zero
      if (emModoRefazer === 'true') {
        console.log(`[BlocoContainer.restaurarPosicao] 🔄 Bloco em modo REFAZER - iniciando do zero`);
        console.log(`[BlocoContainer.restaurarPosicao] 📊 Setando ${totalPaginas} páginas como não concluídas`);
        
        // ✅ CRÍTICO: Remove a flag IMEDIATAMENTE após detectar
        // Isso permite que navegações futuras restaurem estados salvos NESTA sessão
        await AsyncStorage.removeItem(refazerKey);
        console.log(`[BlocoContainer.restaurarPosicao] ✅ Flag de refazer removida - navegações futuras restaurarão estados`);
        
        setPaginasConcluidas(Array.from({ length: totalPaginas }, () => false));
        setPosicaoRestaurada(0);
        return;
      }
      
      console.log(`[BlocoContainer.restaurarPosicao] ➡️ Modo normal - tentando restaurar estado`);
      
      const posKey = `@geniusfactory:pos-bloco-${blocoId}`;
      const doneKey = `@geniusfactory:done-bloco-${blocoId}`;
  
      const [posRaw, doneRaw] = await Promise.all([
        AsyncStorage.getItem(posKey),
        AsyncStorage.getItem(doneKey),
      ]);
  
      // Inicializar paginasConcluidas como array vazio primeiro
      const concluidas = Array.from({ length: totalPaginas }, () => false);
      
      // Verificar se há evidência de progresso REAL neste bloco
      let temProgressoReal = false;
  
      // PRIMEIRO: Verificar TODAS as páginas de questões para garantir que questões com estado salvo sejam marcadas
      for (let i = 0; i < totalPaginas; i++) {
        const pagina = paginasInfo[i];
        if (pagina?.tipo === 'questoes') {
          const questaoId = pagina.html;
          const questao = questoesMap[questaoId];
          if (questao) {
            const questaoEstadoKey = `@geniusfactory:questao-estado-${blocoId}-${questaoId}`;
            const questaoMarcadaKey = `@geniusfactory:marcada-${blocoId}-${questaoId}`;
            const [estadoRaw, marcadaRaw] = await Promise.all([
              AsyncStorage.getItem(questaoEstadoKey),
              AsyncStorage.getItem(questaoMarcadaKey),
            ]);
            
            if (estadoRaw || marcadaRaw) {
              try {
                if (estadoRaw) {
                  const estado = JSON.parse(estadoRaw);
                  if (estado?.feedback?.status === "ok") {
                    concluidas[i] = true;
                    temProgressoReal = true;
                  }
                } else if (marcadaRaw) {
                  concluidas[i] = true;
                  temProgressoReal = true;
                }
              } catch (e) {
                // Ignora erros de parse
              }
            }
          }
        }
      }
  
      // SEGUNDO: Verificar se há dados salvos no array "done" para páginas de leitura/vídeo
      if (doneRaw) {
        try {
          const done = JSON.parse(doneRaw);
          for (let i = 0; i < totalPaginas && i < done.length; i++) {
            if (concluidas[i]) continue;
            
            if (done[i]) {
              const pagina = paginasInfo[i];
              if (pagina?.tipo !== 'questoes') {
                concluidas[i] = false;
              }
            }
          }
        } catch (e) {
          console.warn('[restaurarPosicao] Erro ao processar done:', e);
        }
      }
  
      // Só restaura posição se houver evidência de progresso real neste bloco
      if (temProgressoReal && posRaw) {
        const posRawNum = parseInt(posRaw, 10);
        if (!isNaN(posRawNum)) {
          const pos = Math.max(0, Math.min(posRawNum, totalPaginas - 1));
          setPosicaoRestaurada(pos);
        } else {
          setPosicaoRestaurada(0);
        }
      } else {
        setPosicaoRestaurada(0);
      }
  
      setPaginasConcluidas(concluidas);
    } catch (error) {
      console.warn('[restaurarPosicao] Erro:', error);
      setPaginasConcluidas(Array.from({ length: totalPaginas }, () => false));
      setPosicaoRestaurada(0);
    }
  }

  // Aplicar posição restaurada quando paginas estiver pronto
  useEffect(() => {
    if (posicaoRestaurada !== null && paginas.length > 0) {
      const posValida = Math.max(0, Math.min(posicaoRestaurada, paginas.length - 1))
      setPaginaAtual(posValida)
      setUltimaPaginaVisitada(posValida)
      setPosicaoRestaurada(null) // Reset para evitar re-aplicar
    }
  }, [posicaoRestaurada, paginas.length])

  // Função de carregamento dos dados do bloco
  const carregarDados = useCallback(async (silencioso = false) => {
    if (!id || !caminhoId || !blocoId) {
      console.error('❌ IDs faltando:', { id, caminhoId, blocoId })
      return
    }

    try {
      console.log('🔄 Iniciando carregamento do bloco...', silencioso ? '(silencioso)' : '')
      console.log('   IDs:', { id, caminhoId, blocoId })
      
      if (!silencioso) {
        setLoading(true)
      }
      
      console.log('📡 Chamando obterBloco...')

      // Busca dados do bloco
      const dados = await obterBloco(id, caminhoId, blocoId)
      console.log('✅ Dados recebidos:', dados)

      setAtividades(dados.atividades)
      setCaminho(dados.caminho)
      setTrilhaNome(dados.trilha?.nome || '')
      console.log('📝 Atividades:', dados.atividades.length)

      // Busca questões em lote
      const todasQuestoesIds = dados.atividades
        .filter(a => a.tipo === 'questoes')
        .flatMap(a => a.questaoIds || [])

      console.log('❓ Total de questões:', todasQuestoesIds.length)

      let questoesMapaFinal: Record<string, any> = {}
      if (todasQuestoesIds.length > 0) {
        console.log('📡 Buscando questões...')
        const questoes = await buscarQuestoesLote(todasQuestoesIds)
        console.log('✅ Questões recebidas:', questoes.length)
        questoes.forEach(q => {
          questoesMapaFinal[q.id] = q
        })
        setQuestoesMap(questoesMapaFinal)
      }

      // Gera páginas navegáveis
      console.log('📄 Gerando páginas...')
      const paginasGeradas = gerarPaginas(dados.atividades)
      console.log('✅ Páginas geradas:', paginasGeradas.length)
      setPaginas(paginasGeradas)

      // Restaura posição do AsyncStorage (agora com verificações individuais)
      console.log('💾 Restaurando posição...')
      await restaurarPosicao(blocoId, paginasGeradas.length, paginasGeradas, questoesMapaFinal)
      console.log('✅ Carregamento concluído!')
    } catch (error: any) {
      console.error('❌ ERRO ao carregar bloco:', error)
      console.error('   Mensagem:', error.message)
      console.error('   Stack:', error.stack)
      if (!silencioso) {
        Alert.alert('Erro', error.message || 'Não foi possível carregar o bloco')
        router.back()
      }
    } finally {
      if (!silencioso) {
        setLoading(false)
      }
    }
  }, [id, caminhoId, blocoId, router])

  // 1. Carregar dados do bloco (carregamento inicial)
  useEffect(() => {
    carregarDados(false)
    initialLoadedRef.current = true
  }, [carregarDados])

  // Recarregar dados quando a tela ganha foco (silenciosamente)
  useFocusEffect(
    useCallback(() => {
      if (initialLoadedRef.current) {
        console.log('👁️ BlocoContainer ganhou foco - recarregando dados...')
        carregarDados(true)
      }
    }, [carregarDados])
  )

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

  // 4.1. Persistir páginas com erro
  useEffect(() => {
    if (!blocoId) return

    const erroKey = `@geniusfactory:erro-bloco-${blocoId}`
    AsyncStorage.setItem(erroKey, JSON.stringify(paginasComErro))
  }, [paginasComErro, blocoId])

  // 4.2. Verificar questões erradas no AsyncStorage
  useEffect(() => {
    if (!blocoId || paginas.length === 0) return

    const verificarErros = async () => {
      // Sempre recalcula verificando todas as questões para garantir que está atualizado
      // Isso é necessário porque quando uma questão é respondida, o estado pode mudar
      const erros: number[] = []
      
      for (let i = 0; i < paginas.length; i++) {
        const pagina = paginas[i]
        if (pagina.tipo === 'questoes') {
          const questaoId = pagina.html
          const estadoKey = `@geniusfactory:questao-estado-${blocoId}-${questaoId}`
          
          try {
            const estadoRaw = await AsyncStorage.getItem(estadoKey)
            if (estadoRaw) {
              const estado = JSON.parse(estadoRaw)
              // Se o feedback indica que foi errada (acertou === false)
              if (estado.feedback?.status === 'ok' && estado.feedback.acertou === false) {
                erros.push(i)
              }
            }
          } catch (error) {
            // Ignora erros de parsing
          }
        }
      }
      
      setPaginasComErro(erros)
    }

    // Adiciona um pequeno delay para garantir que o AsyncStorage foi atualizado
    const timeoutId = setTimeout(() => {
      verificarErros()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [blocoId, paginas, paginasConcluidas])

  // 5. Marcar página como concluída
  const marcarConcluida = useCallback((index: number) => {
    setPaginasConcluidas(prev => {
      if (prev[index]) return prev // Já concluída
      const next = [...prev]
      next[index] = true
      return next
    })
    
    // Verifica se a página tem erro após marcar como concluída
    // Isso garante que o círculo seja atualizado imediatamente
    const verificarErroPagina = async () => {
      if (index < paginas.length) {
        const pagina = paginas[index]
        if (pagina.tipo === 'questoes') {
          const questaoId = pagina.html
          const estadoKey = `@geniusfactory:questao-estado-${blocoId}-${questaoId}`
          
          try {
            const estadoRaw = await AsyncStorage.getItem(estadoKey)
            if (estadoRaw) {
              const estado = JSON.parse(estadoRaw)
              if (estado.feedback?.status === 'ok' && estado.feedback.acertou === false) {
                setPaginasComErro(prev => {
                  if (prev.includes(index)) return prev
                  return [...prev, index]
                })
              }
            }
          } catch (error) {
            // Ignora erros
          }
        }
      }
    }
    
    // Aguarda um pouco para garantir que o AsyncStorage foi atualizado
    setTimeout(verificarErroPagina, 200)
  }, [blocoId, paginas])

  // 6. Rastrear última página visitada e fazer scroll para o topo ao mudar de página
  useEffect(() => {
    if (ultimaPaginaVisitada === null) {
      setUltimaPaginaVisitada(paginaAtual)
    } else {
      setUltimaPaginaVisitada(paginaAtual)
      // Faz scroll para o topo quando a página muda
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }
  }, [paginaAtual, ultimaPaginaVisitada])
  
  // Nota: Leitura e vídeo agora marcam automaticamente:
  // - Leitura: marca quando é visualizada (PaginaLeitura.tsx)
  // - Vídeo: marca quando termina (PaginaVideo.tsx)

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

      // Remove a flag de "refazer" se existir, pois o bloco foi concluído novamente
      await AsyncStorage.removeItem(`@geniusfactory:refazer-bloco-${blocoId}`)

      // Invalida o cache do caminho para garantir dados atualizados
      await invalidarCacheCaminho(id, caminhoId)
      
      if (data.novasConquistas?.length > 0) {
        setConquistasDesbloqueadas(data.novasConquistas)
        setModalConquistaAberto(true)
      } else {
        // Navega direto para o caminho
        await limparPersistencia(blocoId)
        router.replace(`/trilhas/${id}/caminhos/${caminhoId}`)
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível encerrar o bloco')
    } finally {
      setEncerrando(false)
    }
  }, [podeEncerrar, blocoId, id, caminhoId, router])

  // 10. Garantir que paginaAtual seja válida e sincronizar se necessário
  useEffect(() => {
    if (paginas.length > 0) {
      const paginaAtualValida = Math.max(0, Math.min(paginaAtual, paginas.length - 1))
      if (paginaAtual !== paginaAtualValida) {
        setPaginaAtual(paginaAtualValida)
      }
    }
  }, [paginas.length, paginaAtual])

  // Loading state - aguarda dados estarem prontos
  if (loading || paginas.length === 0 || atividades.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Carregando bloco...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Garantir que paginaAtual seja válida para renderização
  const paginaAtualValida = Math.max(0, Math.min(paginaAtual, paginas.length - 1))
  const paginaInfo = paginas[paginaAtualValida]
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
          onPress={() => router.replace(`/trilhas/${id}/caminhos/${caminhoId}`)}
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
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de navegação com círculos */}
        <BarraNavegacaoPaginas
          totalPaginas={paginas.length}
          paginaAtual={paginaAtual}
          paginasConcluidas={paginasConcluidas}
          paginasComErro={paginasComErro}
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
          onMarcarConcluida={() => marcarConcluida(paginaAtualValida)}
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
          // Remove a flag de "refazer" se existir, pois o bloco foi concluído novamente
          await AsyncStorage.removeItem(`@geniusfactory:refazer-bloco-${blocoId}`)
          await limparPersistencia(blocoId)
          // Cache já foi invalidado no handleEncerrar
          router.replace(`/trilhas/${id}/caminhos/${caminhoId}`)
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