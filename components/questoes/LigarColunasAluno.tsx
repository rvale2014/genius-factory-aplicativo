// components/questoes/LigarColunasAluno.tsx
import { Check, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

type ItemLigarColunas = {
  ladoA: string;
  imagemA?: string | null;
  ladoB: string;
  imagemB?: string | null;
};

type Props = {
  respondido: boolean;
  ligarColunas: ItemLigarColunas[];
  respostasAluno: { [key: string]: string };
  setRespostasAluno: (respostas: { [key: string]: string }) => void;
  feedbacks?: { [key: string]: boolean };
  corretas?: { [key: string]: number };
};

export default function LigarColunasAluno({
  respondido,
  ligarColunas,
  respostasAluno,
  setRespostasAluno,
  feedbacks,
  corretas,
}: Props) {
  const [colunaA, setColunaA] = useState<ItemLigarColunas[]>([]);
  const [colunaB, setColunaB] = useState<ItemLigarColunas[]>([]);

  // Detecta se deve usar layout vertical (quando textos são longos)
  const useVerticalLayout = useMemo(() => {
    const hasLongText = ligarColunas.some((item) => {
      const textA = item.ladoA?.trim() || '';
      const textB = item.ladoB?.trim() || '';
      return textA.length > 50 || textB.length > 50;
    });
    return hasLongText;
  }, [ligarColunas]);

  useEffect(() => {
    setColunaA(ligarColunas);

    // 1) Reconstrói/recupera a coluna B mantendo a ordem embaralhada salva se existir
    let embaralhadoB: ItemLigarColunas[] = [];
    if (respostasAluno['_colunaB']) {
      try {
        embaralhadoB = JSON.parse(respostasAluno['_colunaB']);
      } catch {
        embaralhadoB = [...ligarColunas].sort(() => Math.random() - 0.5);
      }
    } else {
      embaralhadoB = [...ligarColunas].sort(() => Math.random() - 0.5);
    }
    setColunaB(embaralhadoB);

    // 2) Só inicializa respostas se AINDA não houver nada vindo do pai (evita apagar restauração)
    const jaTemRespostas = respostasAluno && Object.keys(respostasAluno).length > 0;

    if (!jaTemRespostas) {
      const respostasIniciais: { [key: string]: string } = {};
      embaralhadoB.forEach((_, i) => {
        respostasIniciais[String(i)] = '';
      });
      respostasIniciais['_colunaB'] = JSON.stringify(embaralhadoB);
      setRespostasAluno(respostasIniciais);
    }
  }, [ligarColunas]);

  const handleInputChange = (indexB: number, valor: string) => {
    if (respondido) return;
    const novas = { ...respostasAluno, [String(indexB)]: valor };
    setRespostasAluno(novas);
  };

  // Layout Vertical (quando textos são longos)
  if (useVerticalLayout) {
    return (
      <View style={styles.containerVertical}>
        {/* Coluna A */}
        <View style={styles.secaoVertical}>
          <Text style={styles.colunaTitle}>Coluna A</Text>
          {colunaA.map((item, i) => (
            <View key={i} style={styles.itemAVertical}>
              <Text style={styles.numeroA}>({i + 1})</Text>
              {item.imagemA ? (
                <Image source={{ uri: item.imagemA }} style={styles.imagemVertical} resizeMode="contain" />
              ) : (
                <Text style={styles.textoAVertical}>{item.ladoA}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Coluna B */}
        <View style={styles.secaoVertical}>
          <Text style={styles.colunaTitle}>Coluna B</Text>
          {colunaB.map((item, j) => {
            const keyB = String(j);
            const valorCampo = respostasAluno[keyB] ?? '';
            const feedback = feedbacks?.[keyB];

            return (
              <View key={j} style={styles.itemBVertical}>
                <View style={styles.inputWrapperVertical}>
                  <Text style={styles.parentese}>(</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      value={valorCampo}
                      onChangeText={(texto) => handleInputChange(j, texto)}
                      keyboardType="numeric"
                      editable={!respondido}
                      style={[styles.input, respondido && styles.inputDisabled]}
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.parentese}>)</Text>
                </View>

                <View style={styles.conteudoBVertical}>
                  {item.imagemB ? (
                    <Image source={{ uri: item.imagemB }} style={styles.imagemVertical} resizeMode="contain" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
                      <Text
                        style={styles.textoBVertical}
                        textBreakStrategy="simple"
                        lineBreakStrategyIOS="push-out"
                      >
                        {item.ladoB}
                      </Text>
                      {respondido && feedback !== undefined && (
                        <View style={styles.feedbackIcon}>
                          {feedback ? (
                            <Check size={20} color="#15803D" />
                          ) : (
                            <X size={20} color="#B91C1C" />
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // Layout Horizontal (quando textos são curtos)
  return (
    <View style={styles.containerHorizontal}>
      {/* Coluna A */}
      <View style={[styles.coluna, styles.colunaA]}>
        <Text style={styles.colunaTitle}>Coluna A</Text>
        {colunaA.map((item, i) => (
          <View key={i} style={styles.itemA}>
            <Text style={styles.numeroA}>({i + 1})</Text>
            {item.imagemA ? (
              <Image source={{ uri: item.imagemA }} style={styles.imagem} resizeMode="contain" />
            ) : (
              <Text style={styles.textoA}>{item.ladoA}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Coluna B */}
      <View style={[styles.coluna, styles.colunaB]}>
        <Text style={styles.colunaTitle}>Coluna B</Text>
        {colunaB.map((item, j) => {
          const keyB = String(j);
          const valorCampo = respostasAluno[keyB] ?? '';
          const feedback = feedbacks?.[keyB];

          return (
            <View key={j} style={styles.itemB}>
              <View style={styles.inputWrapper}>
                <Text style={styles.parentese}>(</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    value={valorCampo}
                    onChangeText={(texto) => handleInputChange(j, texto)}
                    keyboardType="numeric"
                    editable={!respondido}
                    style={[styles.input, respondido && styles.inputDisabled]}
                    maxLength={2}
                  />
                </View>
                <Text style={styles.parentese}>)</Text>
              </View>

              <View style={styles.conteudoB}>
                {item.imagemB ? (
                  <Image source={{ uri: item.imagemB }} style={styles.imagem} resizeMode="contain" />
                ) : (
                  <Text
                    style={styles.textoB}
                    textBreakStrategy="simple"
                    lineBreakStrategyIOS="push-out"
                  >
                    {item.ladoB}
                  </Text>
                )}

                {respondido && feedback !== undefined && (
                  <View style={styles.feedbackIcon}>
                    {feedback ? (
                      <Check size={20} color="#15803D" />
                    ) : (
                      <X size={20} color="#B91C1C" />
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout Horizontal (textos curtos)
  containerHorizontal: {
    flexDirection: 'row',
    gap: 16,
  },
  coluna: {
    flex: 1,
    gap: 8,
  },
  colunaA: {
    flex: 0.9,
  },
  colunaB: {
    flex: 1.1,
  },
  colunaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  itemA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
  },
  numeroA: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  textoA: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  itemB: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  parentese: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 24,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  inputBox: {
    width: 28,
    height: 24,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#9CA3AF',
  },
  input: {
    textAlign: 'center',
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...Platform.select({
      android: {
        textAlignVertical: 'center' as const,
        includeFontPadding: false,
      },
    }),
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  conteudoB: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textoB: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  imagem: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  feedbackIcon: {
    marginLeft: 4,
  },

  // Layout Vertical (textos longos)
  containerVertical: {
    gap: 24,
  },
  secaoVertical: {
    gap: 8,
  },
  itemAVertical: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  textoAVertical: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  itemBVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  inputWrapperVertical: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  conteudoBVertical: {
    flex: 1,
    gap: 8,
  },
  textoBVertical: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  imagemVertical: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
});