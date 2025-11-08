// app/_layout.tsx
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Provider as JotaiProvider, useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { loadSession, sessionAtom } from '../src/state/session';

function BootSession({ onReady }: { onReady: () => void }) {
  const router = useRouter();
  const segments = useSegments();
  const session = useAtomValue(sessionAtom);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => { 
      try {
        await loadSession();
        setLoaded(true);
        // Aguarda um pouco para garantir que as rotas estão prontas
        setTimeout(() => {
          setReady(true);
          onReady();
        }, 100);
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        setLoaded(true);
        setReady(true);
        onReady();
      }
    })();
  }, [onReady]);

  useEffect(() => {
    if (!loaded || !ready) return;
    
    // Aguarda um frame para garantir que o router está pronto
    const timer = setTimeout(() => {
      try {
        const inAuth = segments[0] === '(auth)';
        const inApp  = segments[0] === '(app)';
        const hasSegment = segments.length > 0;

        // Se não há segmento definido (rota inicial), redireciona baseado na sessão
        if (!hasSegment) {
          if (session) {
            router.replace('/(app)/dashboard');
          } else {
            router.replace('/(auth)/login');
          }
          return;
        }

        // Redirecionamentos baseados em sessão
        // Não redireciona se já está na rota correta
        const currentRoute = segments.length > 1 ? (segments as string[])[1] : undefined;
        if (!session && inApp && currentRoute !== 'login') {
          router.replace('/(auth)/login');
        }
        if (session && inAuth && currentRoute !== 'dashboard') {
          router.replace('/(app)/dashboard');
        }
      } catch (error) {
        console.error('Erro ao redirecionar:', error);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [session, segments, router, loaded, ready]);

  return null;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  
  // Carrega a fonte Inter usando @expo-google-fonts/inter
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Mapeia também para nomes mais simples
    'Inter': Inter_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Se houver erro ao carregar fontes, continua sem elas (usa fonte do sistema)
  const fontsReady = fontsLoaded || fontError !== null;

  return (
    <JotaiProvider>
      <BootSession onReady={() => setReady(true)} />
      {ready && fontsReady ? (
        <Slot />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#12011b' }}>
          <ActivityIndicator size="large" color="#7A34FF" />
        </View>
      )}
    </JotaiProvider>
  );
}


