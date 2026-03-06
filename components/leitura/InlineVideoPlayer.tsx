// components/leitura/InlineVideoPlayer.tsx

import { VideoView, useVideoPlayer } from 'expo-video'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { getCloudflareHlsUrl } from '@/src/lib/videoUtils'

interface InlineVideoPlayerProps {
  videoId: string
}

export function InlineVideoPlayer({ videoId }: InlineVideoPlayerProps) {
  const [loading, setLoading] = useState(true)
  const hlsUrl = getCloudflareHlsUrl(videoId)

  const player = useVideoPlayer(hlsUrl, (player) => {
    player.loop = false
    player.muted = false
  })

  useEffect(() => {
    if (!player) return

    const subscription = player.addListener('statusChange', () => {
      if (player.status === 'readyToPlay') {
        setLoading(false)
      }
    })

    if (player.status === 'readyToPlay') {
      setLoading(false)
    }

    return () => {
      subscription.remove()
    }
  }, [player])

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
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 12,
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
  },
})
