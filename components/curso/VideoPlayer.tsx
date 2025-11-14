// components/curso/VideoPlayer.tsx

import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from 'react-native';

interface VideoPlayerProps {
  uri: string;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function VideoPlayer({ uri, onEnded, onError }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [uri]);

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);

    if (playbackStatus.isLoaded) {
      setLoading(false);

      // Vídeo terminou
      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
        onEnded?.();
      }
    } else if (playbackStatus.error) {
      const errorMsg = `Erro ao reproduzir: ${playbackStatus.error}`;
      setError(errorMsg);
      setLoading(false);
      onError?.(errorMsg);
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current || !status) return;

    try {
      if (status.isLoaded) {
        if (status.isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
      }
    } catch (err) {
      console.error('Erro ao alternar play/pause:', err);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#b00020" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        shouldPlay={false}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Carregando vídeo...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  errorText: {
    color: '#b00020',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});














