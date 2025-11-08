import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';

const { width } = Dimensions.get('window');

export default function NovaSenhaScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalSucesso, setModalSucesso] = useState(false);

  function validarSenha(senha: string): string | null {
    if (senha.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres.';
    }
    return null;
  }

  async function handleDefinirSenha() {
    try {
      setLoading(true);
      setErro(null);

      if (!senha.trim()) {
        setErro('Por favor, informe sua nova senha.');
        setLoading(false);
        return;
      }

      const erroValidacao = validarSenha(senha);
      if (erroValidacao) {
        setErro(erroValidacao);
        setLoading(false);
        return;
      }

      if (!confirmarSenha.trim()) {
        setErro('Por favor, confirme sua senha.');
        setLoading(false);
        return;
      }

      if (senha !== confirmarSenha) {
        setErro('As senhas não coincidem. Por favor, verifique.');
        setLoading(false);
        return;
      }

      if (!token) {
        setErro('Token inválido. Por favor, solicite um novo link de redefinição.');
        setLoading(false);
        return;
      }

      await api.post('/mobile/v1/auth/reset-password/confirm', {
        token,
        senha,
      });

      setModalSucesso(true);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 400) {
        setErro('Dados inválidos. Verifique sua senha.');
      } else if (status === 401 || status === 403) {
        setErro('Token inválido ou expirado. Solicite um novo link de redefinição.');
      } else if (e?.code === 'ECONNABORTED' || e?.code === 'ERR_NETWORK') {
        setErro('Sem conexão com o servidor. Verifique sua internet.');
      } else {
        setErro('Não foi possível definir a nova senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleIrParaLogin() {
    setModalSucesso(false);
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header com logo e botão voltar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingHorizontal: 20, paddingBottom: 20 }}>
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

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={{
          fontSize: 14,
          color: '#666666',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Redefinição de senha
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'padding' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
        style={{ flex: 1, paddingHorizontal: 24 }}
      >
        {/* Título */}
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: '#333333',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          Crie sua nova senha
        </Text>

        {/* Campo Nova Senha */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Crie sua senha"
              placeholderTextColor="#999999"
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              autoCorrect={false}
              value={senha}
              onChangeText={(text) => {
                setSenha(text);
                setErro(null);
              }}
              returnKeyType="next"
              style={{
                backgroundColor: '#FFFFFF',
                height: 50,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingRight: 50,
                color: '#000000',
                fontSize: 16,
                borderWidth: 1,
                borderColor: erro ? '#b00020' : '#E0E0E0',
              }}
            />
            <Pressable
              onPress={() => setMostrarSenha((v) => !v)}
              style={{
                position: 'absolute',
                right: 16,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color="#FF5FDB"
              />
            </Pressable>
          </View>
        </View>

        {/* Campo Confirmar Senha */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Confirmar Nova Senha"
              placeholderTextColor="#999999"
              secureTextEntry={!mostrarConfirmarSenha}
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmarSenha}
              onChangeText={(text) => {
                setConfirmarSenha(text);
                setErro(null);
              }}
              onSubmitEditing={handleDefinirSenha}
              returnKeyType="go"
              style={{
                backgroundColor: '#FFFFFF',
                height: 50,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingRight: 50,
                color: '#000000',
                fontSize: 16,
                borderWidth: 1,
                borderColor: erro ? '#b00020' : '#E0E0E0',
              }}
            />
            <Pressable
              onPress={() => setMostrarConfirmarSenha((v) => !v)}
              style={{
                position: 'absolute',
                right: 16,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={mostrarConfirmarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color="#FF5FDB"
              />
            </Pressable>
          </View>
        </View>

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

        {/* Botão Definir Nova Senha */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleDefinirSenha}
          disabled={loading || !senha.trim() || !confirmarSenha.trim()}
          style={{
            height: 50,
            borderRadius: 12,
            backgroundColor: '#14b8a6',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading || !senha.trim() || !confirmarSenha.trim() ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: 16,
            }}>
              Definir nova senha
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Modal de Sucesso */}
      <Modal
        visible={modalSucesso}
        animationType="slide"
        transparent={true}
        onRequestClose={handleIrParaLogin}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 24,
            paddingHorizontal: 24,
            paddingBottom: 40,
            maxHeight: '80%',
          }}>
            {/* Barra superior */}
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: '#E0E0E0',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 24,
            }} />

            {/* Botão fechar */}
            <TouchableOpacity
              onPress={handleIrParaLogin}
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color="#666666" />
            </TouchableOpacity>

            {/* Ícone */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FF5FDB',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 24,
            }}>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 50, height: 50 }}>
                <Ionicons name="shield" size={50} color="#FFFFFF" style={{ position: 'absolute' }} />
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" style={{ marginTop: 2 }} />
              </View>
            </View>

            {/* Título */}
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#333333',
              textAlign: 'center',
              marginBottom: 16,
            }}>
              Sua nova senha foi criada
            </Text>

            {/* Descrição */}
            <Text style={{
              fontSize: 16,
              color: '#666666',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24,
            }}>
              Agora, você pode acessar o Aplicativo e usufruir de todos os nossos recursos.
            </Text>

            {/* Botão Ir para Login */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleIrParaLogin}
              style={{
                height: 50,
                borderRadius: 12,
                backgroundColor: '#14b8a6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: 16,
              }}>
                Ir para Tela de Login
              </Text>
            </TouchableOpacity>

            {/* Indicador inferior */}
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: '#E0E0E0',
              borderRadius: 2,
              alignSelf: 'center',
              marginTop: 24,
            }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

