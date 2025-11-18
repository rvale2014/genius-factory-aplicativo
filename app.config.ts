// app.config.ts
import type { ExpoConfig } from '@expo/config-types';
import 'dotenv/config';

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,
  name: 'Genius Factory',
  slug: 'genius-factory-aplicativo',
  scheme: 'geniusfactory',
  
  // ✅ CORRETO: Cada plugin em sua própria entrada
  plugins: [
    [
      'expo-video',
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: false,
      },
    ],
    [
      'expo-audio',
      {
        // Configurações do expo-audio
        // (pode deixar vazio para usar padrões)
      },
    ],
  ],
  
  extra: {
    apiPort: process.env.EXPO_PUBLIC_API_PORT,
  },
  
  ios: {
    bundleIdentifier: 'com.geniusfactory.app',
  },
  
  android: {
    package: 'com.geniusfactory.app',
  },
});