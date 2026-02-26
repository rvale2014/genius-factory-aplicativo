// app.config.ts
import type { ExpoConfig } from '@expo/config-types';
import 'dotenv/config';

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,

  name: 'Genius Factory',
  slug: 'genius-factory-aplicativo',
  scheme: 'geniusfactory',
  version: '1.0.2',

  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },

  icon: './assets/images/icon.png',

  plugins: [
    'expo-splash-screen',
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
        // Configurações do expo-audio (opcional)
      },
    ],
  ],

  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: 'a006cfa6-28a4-499a-bf02-9315c59c9383',
    },
  },

  ios: {
    bundleIdentifier: 'com.geniusfactory.app',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: 'com.geniusfactory.app',
    versionCode: 6,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
  },
});