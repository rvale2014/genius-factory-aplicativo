// src/services/perfilService.ts

import { api } from '../lib/api';

export interface PerfilData {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  dataNascimento: string | null;
  nickname: string | null;
  foto: string | null;
  avatarId: string | null;
  avatarImageUrl: string | null;
  
  enderecoCep: string | null;
  enderecoRua: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoEstado: string | null;
  
  responsavelNome: string | null;
  responsavelCPF: string | null;
  responsavelEmail: string | null;
  responsavelCelular: string | null;
  responsavelNascimento: string | null;
  responsavelEnderecoCep: string | null;
  responsavelEnderecoRua: string | null;
  responsavelEnderecoNumero: string | null;
  responsavelEnderecoComplemento: string | null;
  responsavelEnderecoBairro: string | null;
  responsavelEnderecoCidade: string | null;
  responsavelEnderecoEstado: string | null;
}

export interface Avatar {
  id: string;
  nome: string;
  imageUrl: string;
  descricao: string | null;
  raridade: number;
}

/**
 * Busca dados do perfil do aluno
 */
export async function obterPerfil(): Promise<PerfilData> {
  const response = await api.get<PerfilData>('/mobile/v1/perfil');
  return response.data;
}

/**
 * Atualiza dados do perfil
 */
export async function atualizarPerfil(data: Partial<PerfilData>): Promise<void> {
  await api.put('/mobile/v1/perfil/editar', data);
}

/**
 * Troca a senha do aluno
 */
export async function trocarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  await api.put('/mobile/v1/perfil/senha', {
    senhaAtual,
    novaSenha,
  });
}

/**
 * Lista avatares disponíveis
 */
export async function listarAvatares(): Promise<Avatar[]> {
  const response = await api.get<Avatar[]>('/mobile/v1/avatars');
  return response.data;
}

/**
 * Atualiza avatar do aluno
 */
export async function atualizarAvatar(avatarId: string | null): Promise<void> {
  await api.post('/mobile/v1/perfil/avatar', { avatarId });
}