// src/lib/videoUtils.ts — Utilitário de detecção e conversão de URLs de vídeo

const CF_CUSTOMER_CODE = process.env.EXPO_PUBLIC_CF_CUSTOMER_CODE || ''

/**
 * Verifica se a string é um Cloudflare Stream ID (32 caracteres hexadecimais)
 */
export function isCloudflareVideoId(value: string): boolean {
  return /^[a-f0-9]{32}$/.test(value)
}

/**
 * Converte um Cloudflare Stream ID para URL HLS reproduzível nativamente
 */
export function getCloudflareHlsUrl(videoId: string): string {
  return `https://customer-${CF_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/manifest/video.m3u8`
}

/**
 * Verifica se é URL do YouTube
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/embed)/.test(url)
}

/**
 * Extrai embed URL do YouTube para uso em WebView
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  let videoId: string | null = null

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?.*v=([^&]+)/)
  if (watchMatch) videoId = watchMatch[1]

  // youtu.be/VIDEO_ID
  if (!videoId) {
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
    if (shortMatch) videoId = shortMatch[1]
  }

  // youtube.com/embed/VIDEO_ID
  if (!videoId) {
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/)
    if (embedMatch) videoId = embedMatch[1]
  }

  if (!videoId) return null
  return `https://www.youtube.com/embed/${videoId}?playsinline=1`
}

export type ResolvedVideoSource = {
  type: 'native' | 'webview'
  url: string
}

/**
 * Resolve a URL final para o player de vídeo.
 * - CF Stream ID → HLS nativo
 * - YouTube → WebView embed
 * - Outro → nativo (MP4/direto)
 */
export function resolveVideoSource(source: string): ResolvedVideoSource {
  if (!source) return { type: 'native', url: '' }

  const trimmed = source.trim()

  // Cloudflare Stream ID (32 hex chars)
  if (isCloudflareVideoId(trimmed)) {
    return { type: 'native', url: getCloudflareHlsUrl(trimmed) }
  }

  // YouTube
  if (isYouTubeUrl(trimmed)) {
    const embedUrl = getYouTubeEmbedUrl(trimmed)
    if (embedUrl) {
      return { type: 'webview', url: embedUrl }
    }
  }

  // URL direta (MP4, etc.)
  return { type: 'native', url: trimmed }
}
