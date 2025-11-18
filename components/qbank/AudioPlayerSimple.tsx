// components/AudioPlayerSimple.tsx
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  src: string;
};

export default function AudioPlayerSimple({ src }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const player = useAudioPlayer(src);

  useEffect(() => {
    if (!player) return;

    // Atualiza posição e duração periodicamente
    const interval = setInterval(() => {
      if (player) {
        const currentDuration = player.duration ?? 0;
        const currentPosition = player.currentTime ?? 0;
        
        setDuration(currentDuration * 1000); // Converter segundos para milissegundos
        setPosition(currentPosition * 1000); // Converter segundos para milissegundos
        
        // Detecta quando termina de carregar (tem duração > 0)
        if (currentDuration > 0 && isLoading) {
          setIsLoading(false);
        }
        
        // Se terminou de tocar, resetar
        if (currentDuration > 0 && currentPosition >= currentDuration) {
          player.seekTo(0);
          player.pause();
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [player, isLoading]);

  function handlePlayPause() {
    if (!player) return;

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  function handleStop() {
    if (!player) return;

    player.pause();
    player.seekTo(0);
    setPosition(0);
  }

  const isPlaying = player?.playing ?? false;
  const hasLoaded = duration > 0;

  function formatTime(millis: number) {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={handlePlayPause}
          disabled={isLoading}
          style={styles.playButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#7C3AED" size="small" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#7C3AED"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleStop}
          disabled={!hasLoaded || isLoading}
          style={styles.stopButton}
        >
          <Ionicons
            name="stop"
            size={20}
            color={!hasLoaded ? '#9CA3AF' : '#7C3AED'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C084FC',
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});