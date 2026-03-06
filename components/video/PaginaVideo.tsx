// components/blocos/video/PaginaVideo.tsx

import React, { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'
import { WebView } from 'react-native-webview'
import { resolveVideoSource } from '@/src/lib/videoUtils'

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
  const resolved = useMemo(() => resolveVideoSource(videoUrl), [videoUrl])

  if (resolved.type === 'webview') {
    return (
      <WebViewVideoPlayer
        url={resolved.url}
        onMarcarConcluida={onMarcarConcluida}
      />
    )
  }

  return (
    <NativeVideoPlayer
      url={resolved.url}
      onMarcarConcluida={onMarcarConcluida}
    />
  )
}

// Player nativo (expo-video) para Cloudflare HLS e MP4
function NativeVideoPlayer({
  url,
  onMarcarConcluida,
}: {
  url: string
  onMarcarConcluida: () => void
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)

  const onMarcarConcluidaRef = useRef(onMarcarConcluida)
  onMarcarConcluidaRef.current = onMarcarConcluida

  const player = useVideoPlayer(url, player => {
    player.loop = false
    player.play()
  })

  React.useEffect(() => {
    if (!player) return

    const subscription = player.addListener('statusChange', () => {
      const status = player.status

      setIsPlaying(player.playing)

      if (status === 'idle' && player.currentTime === player.duration) {
        onMarcarConcluidaRef.current()
      }
      if (status === 'readyToPlay') {
        setIsLoading(false)
      }
      if (status === 'error') {
        setHasError(true)
        setIsLoading(false)
      }
    })

    if (player.status === 'readyToPlay') {
      setIsLoading(false)
    }

    return () => {
      subscription.remove()
    }
  }, [player])

  return (
    <View style={styles.container}>
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

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          O vídeo será marcado como concluído automaticamente ao terminar
        </Text>
      </View>
    </View>
  )
}

// Player WebView para YouTube com botão de marcar concluído
function WebViewVideoPlayer({
  url,
  onMarcarConcluida,
}: {
  url: string
  onMarcarConcluida: () => void
}) {
  const [loading, setLoading] = useState(true)

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.videoWrapper}>
          <WebView
            source={{ uri: url }}
            style={styles.video}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            onLoadEnd={() => setLoading(false)}
          />

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Carregando vídeo...</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={onMarcarConcluida}
        style={styles.marcarConcluidaButton}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
        <Text style={styles.marcarConcluidaText}>Marcar como concluído</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Assista ao vídeo e toque no botão acima para marcar como concluído
        </Text>
      </View>
    </View>
  )
}

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
  marcarConcluidaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
  },
  marcarConcluidaText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
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
