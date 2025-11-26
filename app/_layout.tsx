// app/_layout.tsx
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Slot, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Provider as JotaiProvider, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadSession, sessionAtom, sessionLoadedAtom } from '../src/state/session';

// Previne que a splash screen desapareça automaticamente
SplashScreen.preventAutoHideAsync();

function Bootstrap({ onSessionLoaded }: { onSessionLoaded: () => void }) {
  const setSession = useSetAtom(sessionAtom);
  const setSessionLoaded = useSetAtom(sessionLoadedAtom);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    (async () => {
      try {
        const session = await loadSession();
        setSession(session);
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setSessionLoaded(true);
        onSessionLoaded();
      }
    })();
  }, [setSession, setSessionLoaded, onSessionLoaded]);

  return null;
}

function SplashController({ fontsReady, sessionReady }: { fontsReady: boolean; sessionReady: boolean }) {
  const segments = useSegments();
  const splashHidden = useRef(false);

  // Verifica se está em uma rota válida (não no index)
  const inValidRoute = segments[0] === '(auth)' || segments[0] === '(app)';

  useEffect(() => {
    if (fontsReady && sessionReady && inValidRoute && !splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }
  }, [fontsReady, sessionReady, inValidRoute, segments]);

  return null;
}

export default function RootLayout() {
  const [sessionReady, setSessionReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    'Inter': Inter_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    'PlusJakartaSans': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const fontsReady = fontsLoaded || fontError !== null;

  return (
    <JotaiProvider>
      <Bootstrap onSessionLoaded={() => setSessionReady(true)} />
      <SplashController fontsReady={fontsReady} sessionReady={sessionReady} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
      </GestureHandlerRootView>
    </JotaiProvider>
  );
}