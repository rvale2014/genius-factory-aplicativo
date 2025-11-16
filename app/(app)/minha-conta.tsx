// app/(app)/minha-conta.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Camera, Eye, EyeOff, Lock, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  atualizarAvatar,
  atualizarPerfil,
  Avatar,
  listarAvatares,
  obterPerfil,
  PerfilData,
  trocarSenha,
} from '../../src/services/perfilService';

const placeholderImage = require('../../assets/images/logo_genius.webp');

function getInterFont(fontWeight?: string | number): string {
  if (!fontWeight) return 'Inter-Regular';
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight) : fontWeight;
  if (weight >= 700) return 'Inter-Bold';
  if (weight >= 600) return 'Inter-SemiBold';
  if (weight >= 500) return 'Inter-Medium';
  return 'Inter-Regular';
}

type ModoEdicao = {
  pessoais: boolean;
  acesso: boolean;
  responsavel: boolean;
  endereco: boolean;
};

export default function MinhaContaScreen() {
  const router = useRouter();
  const [data, setData] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modoEdicao, setModoEdicao] = useState<ModoEdicao>({
    pessoais: false,
    acesso: false,
    responsavel: false,
    endereco: false,
  });

  // Estados dos campos editáveis
  const [formData, setFormData] = useState<Partial<PerfilData>>({});

  // Modal de avatar
  const [modalAvatarAberto, setModalAvatarAberto] = useState(false);
  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [avatarSelecionado, setAvatarSelecionado] = useState<string | null>(null);
  const [carregandoAvatares, setCarregandoAvatares] = useState(false);

  // Modal de senha
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Carregar perfil
  useEffect(() => {
    async function carregarPerfil() {
      try {
        setLoading(true);
        setErro(null);
        const perfil = await obterPerfil();
        setData(perfil);
        setFormData(perfil);
      } catch (e: any) {
        console.error('Erro ao carregar perfil:', e);
        setErro('Não foi possível carregar os dados do perfil.');
      } finally {
        setLoading(false);
      }
    }

    carregarPerfil();
  }, []);

  // Salvar edição
  const handleSalvar = async (secao: keyof ModoEdicao) => {
    try {
      await atualizarPerfil(formData);
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
      setModoEdicao((prev) => ({ ...prev, [secao]: false }));
      
      // Recarregar perfil
      const perfil = await obterPerfil();
      setData(perfil);
      setFormData(perfil);
    } catch (e: any) {
      console.error('Erro ao salvar:', e);
      Alert.alert('Erro', 'Não foi possível salvar os dados.');
    }
  };

  // Cancelar edição
  const handleCancelar = (secao: keyof ModoEdicao) => {
    setFormData(data || {});
    setModoEdicao((prev) => ({ ...prev, [secao]: false }));
  };

  // Abrir modal de avatar
  const handleAbrirModalAvatar = async () => {
    setModalAvatarAberto(true);
    if (avatares.length === 0) {
      setCarregandoAvatares(true);
      try {
        const lista = await listarAvatares();
        setAvatares(lista);
      } catch (e) {
        console.error('Erro ao carregar avatares:', e);
      } finally {
        setCarregandoAvatares(false);
      }
    }
  };

  // Salvar avatar
  const handleSalvarAvatar = async () => {
    if (!avatarSelecionado) {
      Alert.alert('Atenção', 'Selecione um avatar.');
      return;
    }

    try {
      await atualizarAvatar(avatarSelecionado);
      Alert.alert('Sucesso', 'Avatar atualizado!');
      setModalAvatarAberto(false);
      
      // Recarregar perfil
      const perfil = await obterPerfil();
      setData(perfil);
      setFormData(perfil);
    } catch (e: any) {
      console.error('Erro ao salvar avatar:', e);
      Alert.alert('Erro', 'Não foi possível salvar o avatar.');
    }
  };

  // Remover avatar
  const handleRemoverAvatar = async () => {
    try {
      await atualizarAvatar(null);
      Alert.alert('Sucesso', 'Avatar removido!');
      
      // Recarregar perfil
      const perfil = await obterPerfil();
      setData(perfil);
      setFormData(perfil);
    } catch (e: any) {
      console.error('Erro ao remover avatar:', e);
      Alert.alert('Erro', 'Não foi possível remover o avatar.');
    }
  };

  // Trocar senha
  const handleTrocarSenha = async () => {
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      await trocarSenha(senhaAtual, novaSenha);
      Alert.alert('Sucesso', 'Senha atualizada com sucesso!');
      setModalSenhaAberto(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (e: any) {
      console.error('Erro ao trocar senha:', e);
      Alert.alert('Erro', e.response?.data?.error || 'Não foi possível trocar a senha.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5FDB" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (erro || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#b00020" />
          <Text style={styles.errorText}>{erro || 'Erro ao carregar dados'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const imagemPerfil = data.avatarImageUrl || data.foto;
  const initials = data.nome
    ? data.nome
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'A';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(app)/dashboard')}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color="#EB1480" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha conta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleAbrirModalAvatar}>
            {imagemPerfil ? (
              <Image source={{ uri: imagemPerfil }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Seção Informações Pessoais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.iconContainer}>
                <User size={16} color="#7A34FF" />
              </View>
              <Text style={styles.sectionTitle}>Informações pessoais</Text>
            </View>
            {modoEdicao.pessoais ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelar('pessoais')}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => handleSalvar('pessoais')}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setModoEdicao((prev) => ({ ...prev, pessoais: true }))}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nome completo</Text>
            {modoEdicao.pessoais ? (
              <TextInput
                style={styles.input}
                value={formData.nome ?? ''}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, nome: text }))}
              />
            ) : (
              <View style={styles.fieldValue}>
                <Text style={styles.fieldValueText}>{data.nome}</Text>
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CPF</Text>
            {modoEdicao.pessoais ? (
              <TextInput
                style={styles.input}
                value={formData.cpf ?? ''}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, cpf: text }))}
                keyboardType="numeric"
              />
            ) : (
              <View style={styles.fieldValue}>
                <Text style={styles.fieldValueText}>{data.cpf || '-'}</Text>
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Data de nascimento</Text>
            {modoEdicao.pessoais ? (
              <TextInput
                style={styles.input}
                value={formData.dataNascimento ?? ''}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, dataNascimento: text }))}
                placeholder="AAAA-MM-DD"
              />
            ) : (
              <View style={styles.fieldValue}>
                <Text style={styles.fieldValueText}>
                  {data.dataNascimento
                    ? new Date(data.dataNascimento).toLocaleDateString('pt-BR')
                    : '-'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Seção Dados de Acesso */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.iconContainer}>
                <Lock size={16} color="#7A34FF" />
              </View>
              <Text style={styles.sectionTitle}>Dados de acesso</Text>
            </View>
            <View style={styles.buttonRow}>
              {modoEdicao.acesso ? (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelar('acesso')}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => handleSalvar('acesso')}
                  >
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setModoEdicao((prev) => ({ ...prev, acesso: true }))}
                  >
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.changePasswordButton}
                    onPress={() => setModalSenhaAberto(true)}
                  >
                    <Text style={styles.changePasswordButtonText}>Trocar Senha</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nickname</Text>
            {modoEdicao.acesso ? (
              <TextInput
                style={styles.input}
                value={formData.nickname ?? ''}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, nickname: text }))}
              />
            ) : (
              <View style={styles.fieldValue}>
                <Text style={styles.fieldValueText}>{data.nickname || '-'}</Text>
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            {modoEdicao.acesso ? (
              <TextInput
                style={styles.input}
                value={formData.email ?? ''}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <View style={styles.fieldValue}>
                <Text style={styles.fieldValueText}>{data.email}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Avatar */}
      <Modal
        visible={modalAvatarAberto}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalAvatarAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolher Avatar</Text>
              <TouchableOpacity onPress={() => setModalAvatarAberto(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {carregandoAvatares ? (
              <ActivityIndicator size="large" color="#7A34FF" />
            ) : (
              <ScrollView contentContainerStyle={styles.avatarsGrid}>
                {avatares.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      avatarSelecionado === avatar.id && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setAvatarSelecionado(avatar.id)}
                  >
                    <Image
                      source={{ uri: avatar.imageUrl }}
                      style={styles.avatarOptionImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.avatarOptionName} numberOfLines={1}>
                      {avatar.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.removeAvatarButton} onPress={handleRemoverAvatar}>
                <Text style={styles.removeAvatarButtonText}>Remover Avatar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveAvatarButton} onPress={handleSalvarAvatar}>
                <Text style={styles.saveAvatarButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Trocar Senha */}
      <Modal
        visible={modalSenhaAberto}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalSenhaAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trocar Senha</Text>
              <TouchableOpacity onPress={() => setModalSenhaAberto(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordFields}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Senha atual</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.passwordTextInput}
                    value={senhaAtual}
                    onChangeText={setSenhaAtual}
                    secureTextEntry={!mostrarSenhaAtual}
                  />
                  <TouchableOpacity onPress={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}>
                    {mostrarSenhaAtual ? (
                      <EyeOff size={20} color="#999" />
                    ) : (
                      <Eye size={20} color="#999" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nova senha</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.passwordTextInput}
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    secureTextEntry={!mostrarNovaSenha}
                  />
                  <TouchableOpacity onPress={() => setMostrarNovaSenha(!mostrarNovaSenha)}>
                    {mostrarNovaSenha ? (
                      <EyeOff size={20} color="#999" />
                    ) : (
                      <Eye size={20} color="#999" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirmar nova senha</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.passwordTextInput}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry={!mostrarConfirmarSenha}
                  />
                  <TouchableOpacity onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}>
                    {mostrarConfirmarSenha ? (
                      <EyeOff size={20} color="#999" />
                    ) : (
                      <Eye size={20} color="#999" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.changePasswordSubmitButton} onPress={handleTrocarSenha}>
              <Text style={styles.changePasswordSubmitButtonText}>Atualizar Senha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#b00020',
    textAlign: 'center',
    fontFamily: getInterFont('400'),
  },
  retryButton: {
    backgroundColor: '#FF5FDB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: getInterFont('600'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: getInterFont('700'),
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(122, 52, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    fontFamily: getInterFont('700'),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    fontFamily: getInterFont('600'),
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: getInterFont('600'),
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FF5FDB',
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: getInterFont('600'),
  },
  changePasswordButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FF5FDB',
  },
  changePasswordButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: getInterFont('600'),
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
    fontFamily: getInterFont('500'),
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    fontFamily: getInterFont('400'),
  },
  fieldValue: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldValueText: {
    fontSize: 14,
    color: '#666',
    fontFamily: getInterFont('400'),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    fontFamily: getInterFont('700'),
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  avatarOption: {
    width: 80,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 8,
  },
  avatarOptionSelected: {
    borderColor: '#7A34FF',
    backgroundColor: '#F3F0FF',
  },
  avatarOptionImage: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  avatarOptionName: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    fontFamily: getInterFont('500'),
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  removeAvatarButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  removeAvatarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: getInterFont('600'),
  },
  saveAvatarButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  saveAvatarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: getInterFont('600'),
  },
  passwordFields: {
    marginBottom: 20,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: getInterFont('400'),
  },
  changePasswordSubmitButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF5FDB',
    alignItems: 'center',
  },
  changePasswordSubmitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: getInterFont('600'),
  },
});