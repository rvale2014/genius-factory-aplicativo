import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';

const { width } = Dimensions.get('window');
const isSmall = width < 360;

export default function RecuperarPinScreen(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function validarEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleEnviar() {
    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
      setErro('Por favor, informe o e-mail do responsável.');
      return;
    }

    if (!validarEmail(emailTrimmed)) {
      setErro('Por favor, informe um e-mail válido.');
      return;
    }

    try {
      setLoading(true);
      setErro(null);

      await api.post('/mobile/v1/auth/recuperar-pin-parental', {
        email: emailTrimmed,
      });

      setSucesso(true);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 400) {
        setErro('Informe um e-mail válido.');
      } else if (status === 429) {
        setErro('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
      } else if (e?.code === 'ECONNABORTED' || e?.code === 'ERR_NETWORK') {
        setErro('Sem conexão com o servidor. Verifique sua internet.');
      } else {
        setErro('Não foi possível processar a solicitação. Tente novamente.');
      }
    } finally {
      setLoading(false);
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

      {/* Botão voltar */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

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
            {sucesso ? (
              <>
                <Ionicons
                  name="mail-outline"
                  size={48}
                  color="#14b8a6"
                  style={{ marginBottom: 16 }}
                />

                <Text style={styles.title}>E-mail enviado!</Text>

                <Text style={styles.description}>
                  Se este e-mail estiver cadastrado, um novo PIN parental será gerado e
                  enviado para a caixa de entrada do responsável.
                </Text>

                <Text style={styles.description}>
                  Caso haja mais de um aluno vinculado a este e-mail, será enviado um
                  e-mail com o novo PIN para cada aluno.
                </Text>

                <Text style={[styles.description, { marginTop: 4, fontWeight: '600' }]}>
                  Verifique também a pasta de spam.
                </Text>

                <Pressable
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    styles.cta,
                    pressed && { opacity: 0.9 },
                  ]}
                  android_ripple={{ radius: 260 }}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar para inserir o PIN"
                >
                  <LinearGradient
                    colors={['#14b8a6', '#0d9488']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaGrad}
                  >
                    <Text style={styles.ctaText}>Voltar e inserir o PIN</Text>
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.title}>Recuperar PIN parental</Text>

                <Text style={styles.description}>
                  Informe o e-mail do responsável cadastrado na matrícula. Um novo PIN
                  de acesso será gerado e enviado por e-mail.
                </Text>

                <TextInput
                  placeholder="E-mail do responsável"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErro(null);
                  }}
                  onSubmitEditing={handleEnviar}
                  editable={!loading}
                  style={[
                    styles.input,
                    erro ? styles.inputError : null,
                  ]}
                  accessibilityLabel="E-mail do responsável"
                />

                {!!erro && <Text style={styles.error}>{erro}</Text>}

                <Pressable
                  onPress={handleEnviar}
                  disabled={loading || !email.trim()}
                  style={({ pressed }) => [
                    styles.cta,
                    (loading || !email.trim()) && styles.ctaDisabled,
                    pressed && email.trim() && { opacity: 0.9 },
                  ]}
                  android_ripple={{ radius: 260 }}
                  accessibilityRole="button"
                  accessibilityLabel="Enviar e-mail de recuperação"
                >
                  <LinearGradient
                    colors={
                      email.trim()
                        ? ['#14b8a6', '#0d9488']
                        : ['#9ca3af', '#6b7280']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaGrad}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.ctaText}>Enviar</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12011b' },
  blob: { position: 'absolute' },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
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
  input: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  inputError: {
    borderColor: '#FFD0D0',
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
    marginBottom: 16,
    fontSize: 14,
  },
});
