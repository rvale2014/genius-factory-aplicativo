import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import { saveSession, sessionAtom } from '../../src/state/session';

const { width } = Dimensions.get('window');
const isSmall = width < 360;

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const setSession = useSetAtom(sessionAtom);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin() {
    try {
      setLoading(true);
      setErro(null);

      if (!email.trim() || !senha.trim()) {
        setErro('Por favor, preencha todos os campos.');
        setLoading(false);
        return;
      }

      const res = await api.post('/mobile/v1/auth/login', { email, senha });
      const { accessToken, refreshToken } = res.data;

      if (!accessToken || !refreshToken) {
        setErro('Resposta inválida do servidor.');
        setLoading(false);
        return;
      }

      await saveSession({ accessToken, refreshToken });
      setSession({ accessToken, refreshToken });

      router.replace('/(app)/home');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setErro('E-mail ou senha incorretos.');
      } else if (status === 400) {
        setErro('Dados inválidos. Verifique os campos.');
      } else if (e?.code === 'ECONNABORTED' || e?.code === 'ERR_NETWORK') {
        setErro('Sem conexão com o servidor. Verifique sua internet.');
      } else {
        setErro('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fundo degradê principal (rosa -> roxo) */}
      <LinearGradient
        colors={['#FF5FDB', '#7A34FF']}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blobs suaves como imagens (em vez de filter: blur) */}
      {/* Se quiser, substitua por imagens já desfocadas exportadas do Figma */}
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


      {/* Logo Genius */}
      <Image
        source={require('../../assets/images/logo_genius.webp')}
        resizeMode="contain"
        style={{
          position: 'absolute',
          width: width * 0.6,
          height: width * 0.3,
          alignSelf: 'center',
          top: isSmall ? 120 : 140,
          tintColor: '#FFFFFF',
          opacity: 1,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Campo E-mail */}
            <TextInput
              placeholder="E-mail"
              placeholderTextColor="#999999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              style={styles.input}
              accessibilityLabel="Campo de e-mail"
            />

            {/* Campo Senha */}
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="Senha"
                placeholderTextColor="#999999"
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                autoComplete="password"
                value={senha}
                onChangeText={setSenha}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
                style={[styles.input, { paddingRight: 50 }]}
                accessibilityLabel="Campo de senha"
              />
              <Pressable
                onPress={() => setMostrarSenha((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                style={styles.eye}
                android_ripple={{ radius: 18, borderless: true }}
              >
                <Ionicons
                  name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#FF5FDB"
                />
              </Pressable>
            </View>

            {/* Botão Entrar */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
              android_ripple={{ radius: 260 }}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
            >
              <LinearGradient
                colors={['#14b8a6', '#0d9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGrad}
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.ctaText}>Entrar</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Link Esqueci minha senha */}
            <Pressable
              onPress={() => router.push('/(auth)/redefinir-senha')}
              accessibilityRole="button"
              accessibilityLabel="Esqueci minha senha"
              style={({ pressed }) => [{ marginTop: 8 }, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.link}>Esqueci minha senha</Text>
            </Pressable>

            {/* Erro */}
            {!!erro && <Text style={styles.error}>{erro}</Text>}
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
    paddingTop: isSmall ? 280 : 300,
    paddingBottom: 80,
  },
  form: { gap: 16 },
  input: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#000000',
    fontSize: 16,
    // fontFamily: 'Inter', // use apenas se estiver carregada globalmente
  },
  eye: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cta: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    marginTop: 4,
  },
  ctaGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
  link: { color: '#FFFFFF', textAlign: 'center', fontSize: 14 },
  error: { color: '#FFD0D0', textAlign: 'center', marginTop: 4 },
});
