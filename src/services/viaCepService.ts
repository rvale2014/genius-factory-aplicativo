// src/services/viaCepService.ts
import axios from 'axios';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Busca endereço pelo CEP usando a API ViaCEP
 */
export async function buscarCep(cep: string): Promise<ViaCepResponse | null> {
  try {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return null;
    }

    const response = await axios.get<ViaCepResponse>(
      `https://viacep.com.br/ws/${cepLimpo}/json/`,
      { timeout: 10000 }
    );

    if (response.data.erro) {
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}