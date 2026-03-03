import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Image as RNImage, type ImageStyle, type StyleProp } from 'react-native';
import { api } from '../src/lib/api';
import { getBaseUrl } from '../src/lib/baseUrl';

const placeholderImage = require('../assets/images/logo_genius.webp');

interface CachedImageProps {
  uri: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: any;
}

export function CachedImage({
  uri,
  style,
  contentFit = 'cover',
  placeholder,
}: CachedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    setImageError(false);
    setIsRenewing(false);

    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
      setFinalUrl(null);
      return;
    }

    const processedUri = uri.trim();

    if (processedUri.startsWith('http://') || processedUri.startsWith('https://')) {
      try {
        const url = new URL(processedUri);
        setFinalUrl(url.toString());
      } catch {
        setFinalUrl(processedUri);
      }
    } else if (processedUri.startsWith('/')) {
      const baseUrl = getBaseUrl().replace('/api', '');
      setFinalUrl(`${baseUrl}${processedUri}`);
    } else {
      setFinalUrl(null);
    }
  }, [uri]);

  const renewToken = async (firebaseUrl: string) => {
    try {
      setIsRenewing(true);
      const response = await api.get('/mobile/v1/image-proxy', {
        params: { url: firebaseUrl },
      });
      if (response.data?.url) {
        setFinalUrl(response.data.url);
        setImageError(false);
      } else {
        setImageError(true);
      }
    } catch {
      setImageError(true);
    } finally {
      setIsRenewing(false);
    }
  };

  if (!finalUrl || (imageError && !isRenewing) || isRenewing) {
    const fallback = placeholder ?? placeholderImage;
    return <RNImage source={fallback} style={style} resizeMode="cover" />;
  }

  return (
    <Image
      source={{ uri: finalUrl }}
      style={style}
      contentFit={contentFit}
      cachePolicy="disk"
      transition={{ duration: 200 }}
      onError={(e) => {
        const errorMsg = (e as any)?.error || 'Unknown error';
        const is403 =
          typeof errorMsg === 'string' &&
          (errorMsg.includes('403') || errorMsg.includes('Forbidden'));

        if (is403 && finalUrl.includes('firebasestorage.googleapis.com')) {
          renewToken(finalUrl);
        } else {
          setImageError(true);
        }
      }}
    />
  );
}
