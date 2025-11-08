import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../src/lib/api';

const { width } = Dimensions.get('window');

export default function RedefinirSenhaScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async function handleContinuar() {
    try {
      setLoading(true);
      setErro(null);
      setSucesso(false);

      if (!email.trim()) {
        setErro('Por favor, informe seu e-mail.');
        setLoading(false);
        return;
      }

      if (!validarEmail(email.trim())) {
        setErro('Por favor, informe um e-mail válido.');
        setLoading(false);
        return;
      }

      await api.post('/mobile/v1/auth/reset-password', { email: email.trim() });

      setSucesso(true);
      Alert.alert(
        'E-mail enviado',
        'Enviamos um e-mail com as instruções para redefinir sua senha. Verifique sua caixa de entrada.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setErro('E-mail não encontrado. Verifique se o e-mail está correto.');
      } else if (status === 400) {
        setErro('Dados inválidos. Verifique o e-mail informado.');
      } else if (e?.code === 'ECONNABORTED' || e?.code === 'ERR_NETWORK') {
        setErro('Sem conexão com o servidor. Verifique sua internet.');
      } else {
        setErro('Não foi possível enviar o e-mail. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviar() {
    if (!email.trim() || !validarEmail(email.trim())) {
      setErro('Por favor, informe um e-mail válido antes de reenviar.');
      return;
    }
    await handleContinuar();
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header com logo e botão voltar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FF5FDB" />
        </TouchableOpacity>
        
        <View style={{ flex: 1, alignItems: 'center', marginRight: 32 }}>
          <Image
            source={require('../../assets/images/genius-factory-logo.webp')}
            resizeMode="contain"
            style={{
              width: width * 0.4,
              height: width * 0.15,
            }}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'padding' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        {/* Título */}
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: '#333333',
          textAlign: 'center',
          marginBottom: 12,
          fontFamily: 'Inter',
        }}>
          Redefinir senha
        </Text>

        {/* Instrução */}
        <Text style={{
          fontSize: 16,
          color: '#666666',
          textAlign: 'center',
          marginBottom: 32,
          fontFamily: 'Inter',
        }}>
          Digite o e-mail cadastrado para receber as instruções de redefinição de senha
        </Text>

        {/* Campo E-mail */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#999999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          showSoftInputOnFocus={true}
          returnKeyType="send"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErro(null);
          }}
          onSubmitEditing={handleContinuar}
          editable={!loading}
          style={{
            backgroundColor: '#FFFFFF',
            height: 50,
            borderRadius: 12,
            paddingHorizontal: 16,
            color: '#000000',
            fontSize: 16,
            fontFamily: 'Inter',
            borderWidth: 1,
            borderColor: erro ? '#b00020' : '#E0E0E0',
            marginBottom: 24,
          }}
        />

        {/* Mensagem de erro */}
        {erro && (
          <Text style={{
            color: '#b00020',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 16,
            paddingHorizontal: 16,
          }}>
            {erro}
          </Text>
        )}

        {/* Mensagem de sucesso */}
        {sucesso && (
          <Text style={{
            color: '#14b8a6',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 16,
            paddingHorizontal: 16,
          }}>
            E-mail enviado com sucesso!
          </Text>
        )}

        {/* Botão Continuar */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleContinuar}
          disabled={loading || !email.trim()}
          style={{
            height: 50,
            borderRadius: 12,
            backgroundColor: '#14b8a6',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            opacity: loading || !email.trim() ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: 16,
              fontFamily: 'Inter',
            }}>
              Enviar e-mail
            </Text>
          )}
        </TouchableOpacity>

        {/* Link Reenviar código */}
        <TouchableOpacity
          onPress={handleReenviar}
          disabled={loading || !email.trim()}
          style={{ alignItems: 'center', opacity: loading || !email.trim() ? 0.5 : 1 }}
        >
          <Text style={{
            color: '#666666',
            fontSize: 14,
            fontFamily: 'Inter',
          }}>
            Reenviar e-mail
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

