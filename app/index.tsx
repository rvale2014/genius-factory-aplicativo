// app/index.tsx
import { Redirect } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { sessionAtom, sessionLoadedAtom } from '../src/state/session';

// Rotas que podem ser acessadas via deep link sem sessão
const DEEP_LINK_ROUTES = ['nova-senha'];

export default function Index() {
  const sessionLoaded = useAtomValue(sessionLoadedAtom);
  const session = useAtomValue(sessionAtom);
  const [deepLinkChecked, setDeepLinkChecked] = useState(false);
  const [hasDeepLink, setHasDeepLink] = useState(false);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        const parsed = Linking.parse(url);
        const path = parsed.path?.replace(/^\//, '') ?? '';
        if (DEEP_LINK_ROUTES.some((route) => path.startsWith(route))) {
          setHasDeepLink(true);
        }
      }
      setDeepLinkChecked(true);
    });
  }, []);

  // Aguarda carregar sessão e verificar deep link
  if (!sessionLoaded || !deepLinkChecked) {
    return <View style={{ flex: 1 }} />;
  }

  // Se há deep link para rota permitida, não redireciona
  // O Expo Router vai resolver a URL automaticamente
  if (hasDeepLink) {
    return <View style={{ flex: 1 }} />;
  }

  // Sessão carregada: redireciona baseado no estado
  if (!session) {
    return <Redirect href="/(auth)/verificar-pin" />;
  }

  if (session.pinParentalPendente) {
    return <Redirect href="/(auth)/verificar-pin" />;
  }

  return <Redirect href="/(app)/dashboard" />;
}