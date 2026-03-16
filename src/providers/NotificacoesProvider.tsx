// src/providers/NotificacoesProvider.tsx
import Constants from 'expo-constants';
import type { EventSubscription } from 'expo-modules-core';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { sessionAtom, sessionLoadedAtom } from '../state/session';
import { notificacoesNaoLidasAtom } from '../state/notificacoes';
import { registrarTokenPush, contarNaoLidas } from '../services/notificacoesService';

// Imports lazy — módulos nativos podem não estar disponíveis no dev client atual
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
  console.warn('[Notificacoes] Módulos nativos não disponíveis. Rebuild necessário.');
}

// Configurar comportamento de notificações em foreground (só se módulo disponível)
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // Silencioso — módulo pode não ter suporte nativo ainda
  }
}

function getProjectId(): string | undefined {
  return (Constants as any)?.expoConfig?.extra?.eas?.projectId;
}

/**
 * Componente interno que só roda quando o aluno está autenticado.
 * Gerencia: permissão push, registro de token, listeners de notificação.
 */
function NotificacoesManager() {
  const router = useRouter();
  const setNaoLidas = useSetAtom(notificacoesNaoLidasAtom);
  const notificationListener = useRef<EventSubscription | undefined>(undefined);
  const responseListener = useRef<EventSubscription | undefined>(undefined);

  useEffect(() => {
    // Se módulos nativos não disponíveis, apenas carrega contagem
    if (!Notifications) {
      carregarNaoLidas();
      return;
    }

    // 1. Registrar push token
    registrarToken();

    // 2. Carregar contagem inicial de não-lidas
    carregarNaoLidas();

    // 3. Listener: notificação recebida em foreground → incrementa badge
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      carregarNaoLidas();
    });

    // 4. Listener: tap na notificação → navega para rota
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const dados = response.notification.request.content.data;
      if (dados?.route && typeof dados.route === 'string') {
        try {
          router.push(dados.route as any);
        } catch {
          // Rota inválida — ignora silenciosamente
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function registrarToken() {
    try {
      if (!Notifications || !Device) return;

      // Verifica se é dispositivo físico (push não funciona no emulador)
      if (!Device.isDevice) {
        return;
      }

      // Pede permissão
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }

      // Configura canal padrão no Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Padrão',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF5FDB',
        });
      }

      // Obtém o Expo Push Token
      const projectId = getProjectId();
      if (!projectId) {
        console.warn('[Notificacoes] projectId não encontrado no app.config');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const plataforma = Platform.OS === 'ios' ? 'ios' : 'android';

      // Envia ao backend
      await registrarTokenPush(tokenData.data, plataforma);
    } catch (error) {
      // Falha de push nunca deve travar o app
      console.warn('[Notificacoes] Erro ao registrar token:', error);
    }
  }

  async function carregarNaoLidas() {
    try {
      const count = await contarNaoLidas();
      setNaoLidas(count);
    } catch {
      // Silencioso — API pode ainda não estar implementada no backend
    }
  }

  return null;
}

/**
 * Provider de notificações. Renderiza o manager apenas quando o aluno está autenticado.
 * Deve ser colocado dentro do JotaiProvider no _layout.tsx.
 */
export function NotificacoesProvider() {
  const session = useAtomValue(sessionAtom);
  const sessionLoaded = useAtomValue(sessionLoadedAtom);

  // Só inicializa quando a sessão carregou e o aluno está logado
  if (!sessionLoaded || !session?.accessToken) {
    return null;
  }

  return <NotificacoesManager />;
}
