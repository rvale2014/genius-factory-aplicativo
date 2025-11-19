// components/blocos/PaginaRenderer.tsx

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { PaginaLeitura } from '../leitura/PaginaLeitura'
import { QuestaoCardBloco } from '../questoes/QuestaoCardBloco'
import { PaginaVideo } from '../video/PaginaVideo'

type PaginaInfo = {
  tipo: 'leitura' | 'video' | 'questoes'
  atividadeIndex: number
  paginaInterna: number
  html: string // Para leitura: fragmento HTML | Para video: URL | Para questoes: questaoId
}

type Atividade = {
  id: string
  titulo: string
  tipo: 'leitura' | 'video' | 'questoes'
  conteudoTexto?: string | null
  videoUrl?: string | null
  questaoIds?: string[]
}

type Props = {
  pagina: PaginaInfo
  atividade: Atividade
  questoesMap: Record<string, any>
  blocoId: string
  trilhaId: string
  caminhoId: string
  onMarcarConcluida: () => void
}

export function PaginaRenderer({
  pagina,
  atividade,
  questoesMap,
  blocoId,
  trilhaId,
  caminhoId,
  onMarcarConcluida,
}: Props) {
  // Leitura
  if (pagina.tipo === 'leitura' && atividade.conteudoTexto) {
    return (
      <PaginaLeitura
        key={`leitura-${pagina.html}-${atividade.id}`}
        htmlFragmento={pagina.html}
        atividadeId={atividade.id}
        atividadeTitulo={atividade.titulo}
        onMarcarConcluida={onMarcarConcluida}
      />
    )
  }

  // Vídeo
  if (pagina.tipo === 'video' && atividade.videoUrl) {
    return (
      <PaginaVideo
        videoUrl={pagina.html} // pagina.html contém a URL do vídeo
        atividadeTitulo={atividade.titulo}
        onMarcarConcluida={onMarcarConcluida}
      />
    )
  }

  // Questões
  if (pagina.tipo === 'questoes' && atividade.questaoIds) {
    const questaoId = pagina.html // pagina.html contém o questaoId
    const questao = questoesMap[questaoId]

    if (!questao) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Questão não encontrada</Text>
        </View>
      )
    }

    return (
      <QuestaoCardBloco
        key={`questao-${questao.id}`}
        questao={questao}
        blocoId={blocoId}
        trilhaId={trilhaId}
        caminhoId={caminhoId}
        atividadeId={atividade.id}
        onMarcarConcluida={onMarcarConcluida}
      />
    )
  }

  // Fallback
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Tipo de página não suportado</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#B91C1C',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
})