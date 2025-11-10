// components/questoes/BlocoRapidoAluno.tsx
import { Check, X } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ItemBlocoRapido = {
  pergunta: string;
  imagem?: string;
  imagemUrl?: string;
  respostasAceitas: string[];
};

type Props = {
  respondido: boolean;
  blocoRapido: ItemBlocoRapido[];
  respostasAluno: string[];
  setRespostasAluno: (respostas: string[]) => void;
  feedbacks?: boolean[];
};

const norm = (s: string) =>
  (s ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const TRUE_SET = new Set(['v', 'verdadeiro', 'true', 't', '1']);
const FALSE_SET = new Set(['f', 'falso', 'false', '0']);

function itemEhVF(item: ItemBlocoRapido) {
  const vals = (item.respostasAceitas ?? []).map(norm);
  if (vals.length === 0) return false;
  const allTrue = vals.every((v) => TRUE_SET.has(v));
  const allFalse = vals.every((v) => FALSE_SET.has(v));
  return allTrue || allFalse;
}

function questaoEhVF(itens: ItemBlocoRapido[]) {
  if (!Array.isArray(itens) || itens.length === 0) return false;
  return itens.every(itemEhVF);
}

export default function BlocoRapidoAluno({
  respondido,
  blocoRapido,
  respostasAluno,
  setRespostasAluno,
  feedbacks,
}: Props) {
  const ehVF = questaoEhVF(blocoRapido);

  const setResposta = (index: number, valor: string) => {
    const novas = [...respostasAluno];
    novas[index] = valor;
    setRespostasAluno(novas);
  };

  // --- MODO V/F ---
  if (ehVF) {
    return (
      <View style={styles.container}>
        {blocoRapido.map((item, index) => {
          const valor = norm(respostasAluno[index] || '');
          const fb = feedbacks?.[index];
          const isV = valor === 'v';
          const isF = valor === 'f';
          const img = item.imagem ?? item.imagemUrl;

          return (
            <View key={index} style={styles.itemVF}>
              {img ? (
                <Image source={{ uri: img }} style={styles.imagemVF} resizeMode="contain" />
              ) : (
                <Text style={styles.perguntaVF}>{item.pergunta}</Text>
              )}

              <View style={styles.vfButtonsContainer}>
                <View style={styles.vfButtons}>
                  <TouchableOpacity
                    disabled={respondido}
                    onPress={() => setResposta(index, 'v')}
                    style={[
                      styles.vfButton,
                      styles.vfButtonV,
                      isV && styles.vfButtonVActive,
                      respondido && !isV && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={[styles.vfButtonText, isV && styles.vfButtonTextActive]}>V</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={respondido}
                    onPress={() => setResposta(index, 'f')}
                    style={[
                      styles.vfButton,
                      styles.vfButtonF,
                      isF && styles.vfButtonFActive,
                      respondido && !isF && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={[styles.vfButtonText, isF && styles.vfButtonTextActive]}>F</Text>
                  </TouchableOpacity>
                </View>

                {fb === true && <Check size={20} color="#15803D" />}
                {fb === false && <X size={20} color="#B91C1C" />}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // --- MODO TEXTO LIVRE ---
  return (
    <View style={styles.containerTexto}>
      {blocoRapido.map((item, index) => {
        const img = item.imagem ?? item.imagemUrl;
        const fb = feedbacks?.[index];

        return (
          <View key={index} style={styles.itemTexto}>
            {img ? (
              <Image source={{ uri: img }} style={styles.imagemTexto} resizeMode="contain" />
            ) : (
              <Text style={styles.perguntaTexto}>{item.pergunta}</Text>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                value={respostasAluno[index] || ''}
                onChangeText={(text) => setResposta(index, text)}
                editable={!respondido}
                style={[styles.input, respondido && styles.inputDisabled]}
                placeholder="?"
                placeholderTextColor="#9CA3AF"
                textAlign="center"
              />

              {fb === true && <Check size={16} color="#15803D" />}
              {fb === false && <X size={16} color="#B91C1C" />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  itemVF: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagemVF: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  perguntaVF: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  vfButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vfButtons: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  vfButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vfButtonV: {
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  vfButtonF: {},
  vfButtonVActive: {
    backgroundColor: '#14B8A6',
  },
  vfButtonFActive: {
    backgroundColor: '#EC4899',
  },
  vfButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  vfButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  containerTexto: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemTexto: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  imagemTexto: {
    width: '100%',
    height: 80,
    borderRadius: 8,
  },
  perguntaTexto: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
});