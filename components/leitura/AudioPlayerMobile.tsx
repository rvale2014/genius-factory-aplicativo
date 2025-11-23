// components/leitura/AudioPlayerMobile.tsx

import { Ionicons } from '@expo/vector-icons'
import { useAudioPlayer } from 'expo-audio'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  audioUrl: string
  autoPlay?: boolean
  onEnded?: () => void
}

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function AudioPlayerMobile({ audioUrl, autoPlay = false, onEnded }: Props) {
  const player = useAudioPlayer(audioUrl)
  const [isLoading, setIsLoading] = useState(true)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [hasEnded, setHasEnded] = useState(false)

  // Reseta estado quando o audioUrl muda
  useEffect(() => {
    setIsLoading(true)
    setPosition(0)
    setDuration(0)
    setHasEnded(false)
  }, [audioUrl])

  // Atualiza posição e duração periodicamente
  useEffect(() => {
    if (!player) return

    const interval = setInterval(() => {
      if (player) {
        const currentDuration = player.duration ?? 0
        const currentPosition = player.currentTime ?? 0
        
        // Converte segundos para milissegundos
        const durationMs = currentDuration * 1000
        const positionMs = currentPosition * 1000
        
        setDuration(durationMs)
        setPosition(positionMs)
        
        // Detecta quando termina de carregar
        if (currentDuration > 0 && isLoading) {
          setIsLoading(false)
        }
        
        // Detecta quando termina de tocar
        if (currentDuration > 0 && currentPosition >= currentDuration && player.playing && !hasEnded) {
          setHasEnded(true)
          onEnded?.()
        }
      }
    }, 100)

    return () => {
      clearInterval(interval)
    }
  }, [player, isLoading, hasEnded, onEnded])

  // Auto-play quando configurado
  useEffect(() => {
    if (player && autoPlay && !isLoading && !player.playing) {
      player.play()
    }
  }, [player, autoPlay, isLoading])

  // Nota: expo-audio não suporta playback rate diretamente na versão atual
  // A funcionalidade de cyclePlaybackRate é mantida apenas na UI

  const togglePlayPause = () => {
    if (!player) return

    try {
      if (player.playing) {
        player.pause()
      } else {
        player.play()
        setHasEnded(false)
      }
    } catch (error) {
      console.error('Erro ao alternar play/pause:', error)
    }
  }

  const seekTo = (value: number) => {
    if (!player || duration <= 0) return

    try {
      const newPositionMs = (value / 100) * duration
      const newPositionSeconds = newPositionMs / 1000
      player.seekTo(newPositionSeconds)
      setHasEnded(false)
    } catch (error) {
      console.error('Erro ao buscar posição:', error)
    }
  }

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    setPlaybackRate(rates[nextIndex])
  }

  const isPlaying = player?.playing ?? false

  const progress = duration > 0 ? (position / duration) * 100 : 0

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Botão Play/Pause */}
      <TouchableOpacity
        onPress={togglePlayPause}
        style={styles.playButton}
        activeOpacity={0.7}
      >
      <Ionicons
        name={isPlaying ? 'pause' : 'play'}
        size={16}
        color="#FFFFFF"
      />
      </TouchableOpacity>

      {/* Barra de progresso e tempo */}
      <View style={styles.progressContainer}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Slider customizado (usando View + TouchableOpacity) */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${progress}%` }]} />
          </View>
          <TouchableOpacity
            style={[styles.sliderThumb, { left: `${progress}%` }]}
            onPress={(e) => {
              // Calcula posição relativa do toque
              const { locationX } = e.nativeEvent
              const percentage = (locationX / 300) * 100 // Ajuste conforme largura
              seekTo(percentage)
            }}
          />
        </View>
      </View>

      {/* Botão de velocidade */}
      <TouchableOpacity
        onPress={cyclePlaybackRate}
        style={styles.rateButton}
        activeOpacity={0.7}
      >
        <Text style={styles.rateText}>{playbackRate}x</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  sliderContainer: {
    height: 14,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#E9D5FF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  sliderThumb: {
    position: 'absolute',
    width: 10,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
    marginLeft: -5,
  },
  rateButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rateText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
})