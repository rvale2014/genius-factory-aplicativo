// components/curso/VideoPlayer.tsx

import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { resolveVideoSource } from '@/src/lib/videoUtils';

interface VideoPlayerProps {
  uri: string;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function VideoPlayer({ uri, onEnded, onError }: VideoPlayerProps) {
  const resolved = useMemo(() => resolveVideoSource(uri), [uri]);

  if (resolved.type === 'webview') {
    return <WebViewPlayer url={resolved.url} />;
  }

  return (
    <NativeVideoPlayer uri={resolved.url} onEnded={onEnded} onError={onError} />
  );
}

// Player nativo (expo-video) para Cloudflare HLS e MP4
function NativeVideoPlayer({
  uri,
  onEnded,
  onError,
}: {
  uri: string;
  onEnded?: () => void;
  onError?: (error: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  onEndedRef.current = onEnded;
  onErrorRef.current = onError;

  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
  });

  useEffect(() => {
    if (!player) return;

    setLoading(true);
    setError(null);

    const subscription = player.addListener('statusChange', () => {
      const status = player.status;

      if (status === 'readyToPlay') {
        setLoading(false);
      }

      if (status === 'error') {
        const errorMsg = 'Erro ao reproduzir o vídeo';
        setError(errorMsg);
        setLoading(false);
        onErrorRef.current?.(errorMsg);
      }

      if (status === 'idle' && player.currentTime === player.duration && player.currentTime > 0) {
        onEndedRef.current?.();
      }
    });

    if (player.status === 'readyToPlay') {
      setLoading(false);
    }

    return () => {
      subscription.remove();
    };
  }, [player]);

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
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
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

// Player WebView para YouTube
function WebViewPlayer({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
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
