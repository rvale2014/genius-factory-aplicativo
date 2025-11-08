// app.config.ts
import type { ExpoConfig } from '@expo/config-types';
import 'dotenv/config';

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,
  name: 'Genius Factory',
  slug: 'genius-factory-aplicativo',
  scheme: 'geniusfactory', // URL scheme para deep linking
  extra: {
    apiPort: process.env.EXPO_PUBLIC_API_PORT, // 3000 do seu .env
    // opcional: apiUrl fixa -> process.env.EXPO_PUBLIC_API_URL
  },
  ios: {
    bundleIdentifier: 'com.geniusfactory.app',
    // Para Universal Links (opcional, mas recomendado)
    // associatedDomains: ['applinks:seudominio.com'],
  },
  android: {
    package: 'com.geniusfactory.app',
    // Para App Links (opcional, mas recomendado)
    // intentFilters: [
    //   {
    //     action: 'VIEW',
    //     data: [
    //       {
    //         scheme: 'https',
    //         host: 'seudominio.com',
    //         pathPrefix: '/reset-password',
    //       },
    //     ],
    //     category: ['BROWSABLE', 'DEFAULT'],
    //   },
    // ],
  },
});