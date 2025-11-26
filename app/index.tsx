// app/index.tsx
import { Redirect } from 'expo-router';
import { useAtomValue } from 'jotai';
import { View } from 'react-native';
import { sessionAtom, sessionLoadedAtom } from '../src/state/session';

export default function Index() {
  const sessionLoaded = useAtomValue(sessionLoadedAtom);
  const session = useAtomValue(sessionAtom);

  // Enquanto a sessão não foi carregada, não renderiza nada
  // A splash screen continua visível
  if (!sessionLoaded) {
    return <View style={{ flex: 1 }} />;
  }

  // Sessão carregada: redireciona baseado no estado
  if (session) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}