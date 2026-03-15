import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import {
  pinTemporarioAtom,
  saveSession,
  sessionAtom,
} from '../../src/state/session';

const { width } = Dimensions.get('window');
const isSmall = width < 360;
const PIN_LENGTH = 6;

export default function VerificarPinScreen(): React.ReactElement {
  const router = useRouter();
  const { pinIncorreto, erroServidor } = useLocalSearchParams<{ pinIncorreto?: string; erroServidor?: string }>();
  const session = useAtomValue(sessionAtom);
  const setSession = useSetAtom(sessionAtom);
  const setPinTemporario = useSetAtom(pinTemporarioAtom);

  // Modo: se há sessão com pinParentalPendente, é pós-login
  const isPosLogin = !!session?.accessToken && !!session?.pinParentalPendente;

  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(
    pinIncorreto
      ? 'O PIN informado anteriormente estava incorreto. Peça ao responsável para inserir o PIN correto.'
      : erroServidor
        ? 'Não foi possível verificar o PIN. Tente novamente.'
        : null,
  );
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const pin = digits.join('');
  const isComplete = pin.length === PIN_LENGTH;

  function handleDigitChange(index: number, value: string) {
    // Aceita apenas dígitos numéricos
    const digit = value.replace(/[^0-9]/g, '');
    if (!digit && value !== '') return;

    const newDigits = [...digits];

    if (digit.length > 1) {
      // Colou múltiplos dígitos
      const pastedDigits = digit.split('');
      for (let i = 0; i < pastedDigits.length && index + i < PIN_LENGTH; i++) {
        newDigits[index + i] = pastedDigits[i];
      }
      setDigits(newDigits);
      const nextIndex = Math.min(index + pastedDigits.length, PIN_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newDigits[index] = digit;
      setDigits(newDigits);
      if (digit && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    setErro(null);
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function clearFields() {
    setDigits(Array(PIN_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  }

  async function handleConfirmar() {
    if (!isComplete) return;

    if (isPosLogin) {
      // Modo pós-login: chama API direto
      try {
        setLoading(true);
        setErro(null);
        await api.post('/mobile/v1/auth/verificar-pin-parental', { pin });

        // Sucesso: atualiza sessão sem pendente
        const updatedSession = {
          accessToken: session!.accessToken,
          refreshToken: session!.refreshToken,
        };
        await saveSession(updatedSession);
        setSession(updatedSession);
        router.replace('/(app)/dashboard');
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 403) {
          setErro('PIN incorreto. Verifique e tente novamente.');
          clearFields();
        } else if (status === 401) {
          // Refresh falhou — sessão expirada, volta ao fluxo completo
          setSession(null);
          router.replace('/(auth)/verificar-pin');
        } else if (status === 429) {
          setErro('Muitas tentativas incorretas. Entre em contato com o suporte.');
        } else if (e?.code === 'ECONNABORTED' || e?.code === 'ERR_NETWORK') {
          setErro('Sem conexão com o servidor. Verifique sua internet.');
        } else {
          setErro('Não foi possível verificar o PIN. Tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Modo pré-login: guarda PIN e vai para login
      setPinTemporario(pin);
      router.push('/(auth)/login');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#FF5FDB', '#7A34FF']}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
        style={[
          styles.blob,
          {
            width: 380,
            height: 380,
            borderRadius: 190,
            top: 220,
            left: width * 0.15,
            opacity: 0.35,
          },
        ]}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
        style={[
          styles.blob,
          {
            width: 280,
            height: 280,
            borderRadius: 140,
            top: 300,
            left: width * 0.35,
            opacity: 0.3,
          },
        ]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require('../../assets/images/logo_genius.webp')}
            resizeMode="contain"
            style={styles.logo}
          />

          <View style={styles.card}>
            <Text style={styles.title}>Autorização do Responsável</Text>

            <Text style={styles.description}>
              Este aplicativo é destinado a alunos de 9 a 12 anos e requer a autorização do
              pai, da mãe ou de um responsável legal.
            </Text>

            <Text style={styles.description}>
              Para continuar, o responsável deve inserir o PIN de acesso enviado
              por e-mail no momento da matrícula.
            </Text>

            <View style={styles.otpRow}>
              {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) => handleDigitChange(index, value)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(index, nativeEvent.key)
                  }
                  keyboardType="number-pad"
                  maxLength={index === 0 ? PIN_LENGTH : 1}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                  ]}
                  textContentType="oneTimeCode"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  accessibilityLabel={`Dígito ${index + 1} do PIN`}
                  selectTextOnFocus
                />
              ))}
            </View>

            <Pressable
              onPress={handleConfirmar}
              disabled={!isComplete || loading}
              style={({ pressed }) => [
                styles.cta,
                (!isComplete || loading) && styles.ctaDisabled,
                pressed && isComplete && { opacity: 0.9 },
              ]}
              android_ripple={{ radius: 260 }}
              accessibilityRole="button"
              accessibilityLabel="Confirmar PIN"
            >
              <LinearGradient
                colors={
                  isComplete ? ['#14b8a6', '#0d9488'] : ['#9ca3af', '#6b7280']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Confirmar</Text>
                )}
              </LinearGradient>
            </Pressable>

            {!!erro && <Text style={styles.error}>{erro}</Text>}

            <Pressable
              onPress={() => router.push('/(auth)/recuperar-pin')}
              style={({ pressed }) => [
                { marginTop: 16, padding: 4 },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="link"
              accessibilityLabel="Esqueci o PIN parental"
            >
              <Text style={styles.forgotPin}>Esqueci o PIN parental</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12011b' },
  blob: { position: 'absolute' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: isSmall ? 60 : 80,
    paddingBottom: 80,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5,
    height: width * 0.25,
    tintColor: '#FFFFFF',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 24,
  },
  otpInput: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  otpInputFilled: {
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  cta: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: {
    color: '#FFD0D0',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  forgotPin: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
