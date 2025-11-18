// components/blocos/video/PaginaVideo.tsx

import React, { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// ❌ REMOVER: import { Video, ResizeMode } from 'expo-av'
// ✅ ADICIONAR:
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'

type Props = {
  videoUrl: string
  atividadeTitulo: string
  onMarcarConcluida: () => void
}

export function PaginaVideo({
  videoUrl,
  atividadeTitulo,
  onMarcarConcluida,
}: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // ✅ NOVO: useVideoPlayer do expo-video
  const player = useVideoPlayer(videoUrl, player => {
    player.loop = false
    player.play()
  })

  // Marca como concluída quando o vídeo terminar
  React.useEffect(() => {
    if (!player) return

    const subscription = player.addListener('statusChange', () => {
      const status = player.status
      
      if (status === 'idle' && player.currentTime === player.duration) {
        // Vídeo terminou
        onMarcarConcluida()
      }
      if (status === 'readyToPlay' && isLoading) {
        setIsLoading(false)
      }
      if (status === 'error') {
        setHasError(true)
        setIsLoading(false)
      }
    })

    // Verifica status inicial
    if (player.status === 'readyToPlay') {
      setIsLoading(false)
    }

    return () => {
      subscription.remove()
    }
  }, [player, onMarcarConcluida, isLoading])

  // Se é URL do YouTube, usa WebView (fallback)
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')

  if (isYouTube) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.youtubeContainer}>
            <Text style={styles.youtubeText}>
              Vídeos do YouTube não são suportados diretamente no app.
            </Text>
            <Text style={styles.youtubeSubtext}>
              Abra no navegador: {videoUrl}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Card de vídeo */}
      <View style={styles.card}>
        <View style={styles.videoWrapper}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Carregando vídeo...</Text>
            </View>
          )}

          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#B91C1C" />
              <Text style={styles.errorText}>
                Não foi possível carregar o vídeo
              </Text>
            </View>
          ) : (
            <VideoView
              player={player}
              style={styles.video}
              nativeControls
              contentFit="contain"
            />
          )}
        </View>

        {/* Controles customizados (opcional) */}
        {!hasError && !isLoading && (
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => {
                if (player.playing) {
                  player.pause()
                  setIsPlaying(false)
                } else {
                  player.play()
                  setIsPlaying(true)
                }
              }}
              style={styles.playButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <Text style={styles.controlsText}>
              {isPlaying ? 'Pausar' : 'Reproduzir'}
            </Text>
          </View>
        )}
      </View>

      {/* Footer com instruções */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ℹ️ O vídeo será marcado como concluído automaticamente ao terminar
        </Text>
      </View>
    </View>
  )
}

// Estilos permanecem iguais
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    gap: 12,
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  youtubeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
    gap: 8,
  },
  youtubeText: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  youtubeSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  footer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  footerText: {
    fontSize: 13,
    color: '#1E40AF',
    fontFamily: 'Inter-Regular',
  },
})