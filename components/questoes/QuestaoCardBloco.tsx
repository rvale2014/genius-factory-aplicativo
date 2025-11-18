// components/blocos/questoes/QuestaoCardBloco.tsx (VERSÃO INTEGRADA)

import { QuestaoCard } from '@/components/questoes/QuestaoCard'
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

type Props = {
  questao: any
  blocoId: string
  trilhaId: string
  caminhoId: string
  atividadeId: string
  onMarcarConcluida: () => void
}

export const QuestaoCardBloco = React.memo(function QuestaoCardBloco({
  questao,
  blocoId,
  trilhaId,
  caminhoId,
  atividadeId,
  onMarcarConcluida,
}: Props) {
  // Usar ref para evitar dependência de onMarcarConcluida no useEffect
  const onMarcarConcluidaRef = useRef(onMarcarConcluida)
  
  // Atualizar ref quando callback mudar
  useEffect(() => {
    onMarcarConcluidaRef.current = onMarcarConcluida
  }, [onMarcarConcluida])

  // Monitora quando a questão é respondida via AsyncStorage
  useEffect(() => {
    let foiMarcada = false // Evita chamar múltiplas vezes

    const verificarResposta = async () => {
      if (foiMarcada) return // Já foi marcada, não precisa verificar mais
      
      try {
        const chave = `@geniusfactory:resposta-bloco-${blocoId}-${questao.id}`
        const raw = await AsyncStorage.getItem(chave)
        
        if (raw) {
          const dados = JSON.parse(raw)
          if (dados?.respondido === true && !foiMarcada) {
            foiMarcada = true
            onMarcarConcluidaRef.current()
          }
        }
      } catch (error) {
        console.warn('[QuestaoCardBloco] Erro ao verificar resposta:', error)
      }
    }

    // Verifica inicialmente
    verificarResposta()

    // Verifica periodicamente (caso o QuestaoCard atualize o AsyncStorage)
    const interval = setInterval(verificarResposta, 1000)

    return () => {
      clearInterval(interval)
      foiMarcada = false
    }
  }, [blocoId, questao.id])

  return (
    <View style={styles.container}>
      <QuestaoCard questao={questao} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})