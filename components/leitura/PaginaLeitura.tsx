// components/blocos/leitura/PaginaLeitura.tsx

import React, { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import RenderHTML from '@/components/shared/RenderHTMLWithLatex'
import type { CustomBlockRenderer } from 'react-native-render-html'
import { HTMLElementModel, HTMLContentModel } from '@native-html/transient-render-engine'
import { AudioPlayerMobile } from './AudioPlayerMobile'
import { InlineVideoPlayer } from './InlineVideoPlayer'
import { isCloudflareVideoId } from '@/src/lib/videoUtils'

type Props = {
  htmlFragmento: string
  atividadeId: string
  atividadeTitulo: string
  audioUrl?: string | null
  onMarcarConcluida: () => void
  onAudioEnded?: () => void
}

/**
 * Pré-processa HTML para converter <div class="gf-inline-video"> em tag customizado
 */
function preprocessHtml(html: string): string {
  return html.replace(
    /<div[^>]*class="gf-inline-video"[^>]*data-video-id="([^"]*)"[^>]*>[\s\S]*?<\/div>/g,
    '<gf-inline-video data-video-id="$1"></gf-inline-video>'
  ).replace(
    /<div[^>]*data-video-id="([^"]*)"[^>]*class="gf-inline-video"[^>]*>[\s\S]*?<\/div>/g,
    '<gf-inline-video data-video-id="$1"></gf-inline-video>'
  )
}

const customHTMLElementModels = {
  'gf-inline-video': HTMLElementModel.fromCustomModel({
    tagName: 'gf-inline-video',
    contentModel: HTMLContentModel.block,
  }),
}

const InlineVideoRenderer: CustomBlockRenderer = ({ tnode }) => {
  const videoId = tnode.attributes?.['data-video-id']
  if (!videoId || !isCloudflareVideoId(videoId)) return null
  return <InlineVideoPlayer videoId={videoId} />
}

const renderers = {
  'gf-inline-video': InlineVideoRenderer,
}

export function PaginaLeitura({
  htmlFragmento,
  atividadeId,
  atividadeTitulo,
  audioUrl,
  onMarcarConcluida,
  onAudioEnded,
}: Props) {
  const { width } = useWindowDimensions()

  // Ref estável para o callback — evita re-disparar o useEffect quando a
  // referência do callback muda (inline function recriada a cada render do pai)
  const onMarcarConcluidaRef = useRef(onMarcarConcluida)
  onMarcarConcluidaRef.current = onMarcarConcluida

  // Marca como concluída quando a página é visualizada (uma vez por página)
  useEffect(() => {
    onMarcarConcluidaRef.current()
  }, [htmlFragmento, atividadeId])

  const contentWidth = useMemo(() => {
    return Math.min(width, 600) - 32
  }, [width])

  const htmlSource = useMemo(() => ({
    html: htmlFragmento?.trim()
      ? preprocessHtml(htmlFragmento)
      : '<p>Conteúdo indisponível.</p>',
  }), [htmlFragmento])

  const tagsStyles = useMemo(() => ({
    body: styles.body,
    p: styles.paragraph,
    h1: styles.h1,
    h2: styles.h2,
    h3: styles.h3,
    strong: styles.strong,
    b: styles.strong,
    em: styles.em,
    i: styles.em,
    ul: styles.ul,
    ol: styles.ol,
    li: styles.li,
    blockquote: styles.blockquote,
    code: styles.code,
    pre: styles.pre,
    a: styles.link,
  }), [])

  const defaultTextProps = useMemo(() => ({ selectable: true }), [])
  const systemFonts = useMemo(() => ['Inter-Regular', 'Inter-Medium', 'Inter-Bold'], [])

  return (
    <View style={styles.container}>
      {/* Player de áudio (se disponível) */}
      {audioUrl && (
        <View style={styles.audioContainer}>
          <AudioPlayerMobile
            audioUrl={audioUrl}
            onEnded={onAudioEnded}
          />
        </View>
      )}

      {/* Card de leitura */}
      <View style={styles.card}>
        <RenderHTML
          contentWidth={contentWidth}
          source={htmlSource}
          baseStyle={styles.baseText}
          defaultTextProps={defaultTextProps}
          tagsStyles={tagsStyles}
          systemFonts={systemFonts}
          customHTMLElementModels={customHTMLElementModels}
          renderers={renderers}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  audioContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  baseText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#111827',
  },
  paragraph: {
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 24,
    color: '#111827',
    textAlign: 'justify',
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 10,
    fontFamily: 'Inter-Bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 14,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  strong: {
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  em: {
    fontStyle: 'italic',
    color: '#374151',
  },
  ul: {
    marginBottom: 12,
    paddingLeft: 16,
  },
  ol: {
    marginBottom: 12,
    paddingLeft: 16,
  },
  li: {
    marginBottom: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    paddingLeft: 16,
    marginVertical: 12,
    fontStyle: 'italic',
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
  },
  code: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: 'Courier',
    color: '#DC2626',
  },
  pre: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  link: {
    color: '#7C3AED',
    textDecorationLine: 'underline',
  },
})
