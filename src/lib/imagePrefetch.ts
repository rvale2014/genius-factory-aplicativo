// src/lib/imagePrefetch.ts
// Utilitário para pré-carregar imagens das páginas do bloco

import { Image } from 'expo-image'

type PaginaInfo = {
  tipo: 'leitura' | 'video' | 'questoes' | 'simulado'
  atividadeIndex: number
  paginaInterna: number
  html: string
  audioUrl?: string | null
}

const IMG_SRC_REGEX = /<img[^>]+src=["']([^"']+)["']/gi

/**
 * Extrai URLs de imagens de um fragmento HTML
 */
export function extrairImagensDoHtml(html: string): string[] {
  if (!html) return []
  const urls: string[] = []
  let match: RegExpExecArray | null
  const regex = new RegExp(IMG_SRC_REGEX.source, 'gi')
  while ((match = regex.exec(html)) !== null) {
    const url = match[1]?.trim()
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      urls.push(url)
    }
  }
  return urls
}

/**
 * Extrai todas as URLs de imagens de uma página
 */
export function extrairImagensDaPagina(
  pagina: PaginaInfo,
  questoesMap: Record<string, any>,
): string[] {
  if (pagina.tipo === 'leitura') {
    return extrairImagensDoHtml(pagina.html)
  }

  if (pagina.tipo === 'questoes') {
    const questaoId = pagina.html
    const questao = questoesMap[questaoId]
    if (!questao) return []

    const urls: string[] = []

    // Imagens do enunciado (HTML)
    if (questao.enunciado) {
      urls.push(...extrairImagensDoHtml(questao.enunciado))
    }

    // Imagem principal da questão
    if (questao.imagemUrl) {
      urls.push(questao.imagemUrl)
    }

    // Imagens das alternativas (array)
    if (Array.isArray(questao.imagensAlternativas)) {
      questao.imagensAlternativas.forEach((url: string | null) => {
        if (url && typeof url === 'string') urls.push(url)
      })
    }

    // Imagens no conteúdo estruturado (selecao multipla, ligar colunas, etc)
    if (questao.conteudo) {
      try {
        const conteudo = typeof questao.conteudo === 'string'
          ? JSON.parse(questao.conteudo)
          : questao.conteudo

        if (Array.isArray(conteudo.alternativas)) {
          conteudo.alternativas.forEach((alt: any) => {
            if (alt?.imagemUrl) urls.push(alt.imagemUrl)
            if (alt?.imagem) urls.push(alt.imagem)
          })
        }

        if (Array.isArray(conteudo.colunasA)) {
          conteudo.colunasA.forEach((item: any) => {
            if (item?.imagemA) urls.push(item.imagemA)
          })
        }
        if (Array.isArray(conteudo.colunasB)) {
          conteudo.colunasB.forEach((item: any) => {
            if (item?.imagemB) urls.push(item.imagemB)
          })
        }

        if (Array.isArray(conteudo.itens)) {
          conteudo.itens.forEach((item: any) => {
            if (item?.imagem) urls.push(item.imagem)
            if (item?.imagemUrl) urls.push(item.imagemUrl)
          })
        }
      } catch {
        // Ignora erro de parse
      }
    }

    return urls.filter(u => u.startsWith('http://') || u.startsWith('https://'))
  }

  return []
}

/**
 * Faz prefetch de imagens para o cache do expo-image (fire-and-forget)
 */
function prefetchImagens(urls: string[]): void {
  if (!urls || urls.length === 0) return
  const unique = [...new Set(urls)]
  Image.prefetch(unique, 'disk').catch(() => {})
}

/**
 * Extrai e faz prefetch de uma lista de páginas
 */
export function prefetchPaginas(paginas: PaginaInfo[], questoesMap: Record<string, any>): void {
  const urls: string[] = []
  for (const p of paginas) {
    urls.push(...extrairImagensDaPagina(p, questoesMap))
  }
  prefetchImagens(urls)
}

/**
 * Prefetch escalonado de todas as páginas em background.
 * Processa em lotes de BATCH_SIZE, com intervalo entre lotes.
 * Retorna função de cancelamento.
 */
export function prefetchPaginasEmBackground(
  paginas: PaginaInfo[],
  questoesMap: Record<string, any>,
  startIndex: number,
): () => void {
  const BATCH_SIZE = 3
  const INTERVALO_MS = 500
  let cancelado = false
  const timeouts: ReturnType<typeof setTimeout>[] = []

  const paginasRestantes = paginas.filter((_, i) => i >= startIndex)

  for (let i = 0; i < paginasRestantes.length; i += BATCH_SIZE) {
    const delay = (i / BATCH_SIZE) * INTERVALO_MS
    const lote = paginasRestantes.slice(i, i + BATCH_SIZE)

    const timeoutId = setTimeout(() => {
      if (cancelado) return
      prefetchPaginas(lote, questoesMap)
    }, delay)

    timeouts.push(timeoutId)
  }

  return () => {
    cancelado = true
    timeouts.forEach(t => clearTimeout(t))
  }
}
