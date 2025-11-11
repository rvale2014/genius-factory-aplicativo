// components/questoes/QuestaoTabela.tsx
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

/** ========== Tipos compartilhados ========== */
export type ConteudoTabela =
  | { subtipo: 'cruzadinha'; data: ConteudoCruzadinha }
  | { subtipo: 'math_table'; data: ConteudoMathTable };

type PropsTabela = {
  respondido: boolean;
  conteudo: ConteudoTabela | any;
  respostasAluno: any;
  setRespostasAluno: (v: any) => void;
  feedbacks?: any;
};

export default function QuestaoTabela(props: PropsTabela) {
  const { conteudo } = props;

  // Type guards
  const isCruzData = (c: any) =>
    c && Array.isArray(c?.dimensao) && Array.isArray(c?.mascaraAtiva);

  const isMathData = (c: any) =>
    c && Array.isArray(c?.dimensao) && Array.isArray(c?.tabela);

  if (!conteudo) return null;

  // Formato "wrapper" { subtipo, data }
  if (conteudo?.subtipo === 'cruzadinha') {
    const data = conteudo.data ?? conteudo;
    return <CruzadinhaAluno {...props} conteudo={data as ConteudoCruzadinha} />;
  }
  if (conteudo?.subtipo === 'math_table') {
    const data = conteudo.data ?? conteudo;
    return <MathTableAluno {...props} conteudo={data as ConteudoMathTable} />;
  }

  // Formato direto (sem subtipo)
  if (isCruzData(conteudo)) {
    return <CruzadinhaAluno {...props} conteudo={conteudo as ConteudoCruzadinha} />;
  }
  if (isMathData(conteudo)) {
    return <MathTableAluno {...props} conteudo={conteudo as ConteudoMathTable} />;
  }

  return null;
}

/** ========== MATH TABLE ========== */
export type ConteudoMathTable = {
  dimensao: [number, number];
  tabela: (string | number | null)[][];
  regraTexto?: string;
  config?: { permitirDecimais?: boolean; casasDecimais?: number };
};

type PropsMath = {
  respondido: boolean;
  conteudo: ConteudoMathTable;
  respostasAluno: { valores: string[] };
  setRespostasAluno: (v: { valores: string[] }) => void;
  feedbacks?: { corretos: boolean[] };
};

function MathTableAluno({
  respondido,
  conteudo,
  respostasAluno,
  setRespostasAluno,
  feedbacks,
}: PropsMath) {
  const nullPos: Array<{ i: number; j: number }> = [];
  conteudo.tabela.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (cell === null) nullPos.push({ i, j });
    })
  );

  const getVal = (k: number) => {
    const valor = respostasAluno?.valores?.[k];
    return valor || '';
  };

  const setVal = (k: number, valStr: string) => {
    if (respondido) return;
    const valor = valStr.trim() || null;
    const arr = [...(respostasAluno?.valores ?? Array(nullPos.length).fill(null))];
    arr[k] = valor as any;
    setRespostasAluno({ valores: arr });
  };

  let k = 0;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.mathContainer}>
        {conteudo.regraTexto && (
          <Text style={styles.mathRegra}>{conteudo.regraTexto}</Text>
        )}
        <View style={styles.mathTable}>
          {conteudo.tabela.map((row, i) => (
            <View key={i} style={styles.mathRow}>
              {row.map((cell, j) => {
                if (cell === null) {
                  const idx = k++;
                  const ok = feedbacks?.corretos?.[idx];
                  const cellStyle = respondido
                    ? ok === true
                      ? styles.mathCellCorrect
                      : ok === false
                      ? styles.mathCellIncorrect
                      : styles.mathCellDefault
                    : styles.mathCellDefault;

                  return (
                    <View key={j} style={[styles.mathCell, cellStyle]}>
                      <TextInput
                        editable={!respondido}
                        value={getVal(idx)}
                        onChangeText={(text) => setVal(idx, text)}
                        style={styles.mathInput}
                        placeholder="?"
                        placeholderTextColor="#9CA3AF"
                        textAlign="center"
                      />
                    </View>
                  );
                }

                return (
                  <View key={j} style={styles.mathCellFilled}>
                    <Text style={styles.mathCellText}>
                      {typeof cell === 'string' ? cell : cell}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

/** ========== CRUZADINHA ========== */
export type ConteudoCruzadinha = {
  dimensao: [number, number];
  mascaraAtiva: (boolean | null)[][];
  palavras?: any[];
  preenchidasFixas?: { linha: number; coluna: number; letra: string }[];
  respostasBrancas?: { letra: string; linha: number; coluna: number }[];
  perguntas?: {
    id: string;
    enunciado: string;
    slotId?: string;
    dica?: string;
    midiaUrl?: string;
    celulas?: { linha: number; coluna: number }[];
  }[];
};

type PropsCruz = {
  respondido: boolean;
  conteudo: ConteudoCruzadinha;
  respostasAluno: { celulas: (string | null)[][] };
  setRespostasAluno: (v: { celulas: (string | null)[][] }) => void;
  feedbacks?: { corretas: (boolean | null)[][] };
};

function CruzadinhaAluno({
  respondido,
  conteudo,
  respostasAluno,
  setRespostasAluno,
  feedbacks,
}: PropsCruz) {
  const cellConfig = useMemo(() => {
    const cols = conteudo?.dimensao?.[1] ?? 0;

    if (cols >= 15) {
      return {
        size: 20,
        border: 1,
        font: 9,
        lineHeight: 18,
      };
    }

    if (cols >= 9) {
      return {
        size: 24,
        border: 1.1,
        font: 10,
        lineHeight: 20,
      };
    }

    if (cols > 0) {
      return {
        size: 30,
        border: 1.3,
        font: 12,
        lineHeight: 26,
      };
    }

    return {
      size: 26,
      border: 1,
      font: 11,
      lineHeight: 22,
    };
  }, [conteudo?.dimensao]);

  const cellMetricStyle = useMemo(
    () => ({
      width: cellConfig.size,
      height: cellConfig.size,
      borderWidth: cellConfig.border,
    }),
    [cellConfig],
  );

  const inactiveCellMetricStyle = cellMetricStyle;

  const textMetricStyle = useMemo(
    () => ({
      fontSize: cellConfig.font,
      lineHeight: cellConfig.lineHeight,
    }),
    [cellConfig],
  );

  const inputMetricStyle = useMemo(
    () => ({
      fontSize: cellConfig.font,
    }),
    [cellConfig],
  );

  const numeroBadgeStyle = useMemo(() => {
    const diameter = Math.max(14, Math.round(cellConfig.size * 0.5));
    return {
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
    };
  }, [cellConfig.size]);

  const numeroBadgeSpacing = useMemo(() => Math.max(6, Math.round(cellConfig.size * 0.6)), [cellConfig.size]);

  const numeroTextoStyle = useMemo(
    () => ({
      fontSize: Math.max(9, Math.round(cellConfig.font * 0.75)),
    }),
    [cellConfig.font],
  );

  const init = useMemo(() => {
    const L = conteudo?.dimensao?.[0] ?? 0;
    const C = conteudo?.dimensao?.[1] ?? 0;
    if (L <= 0 || C <= 0) return [];

    const base: (string | null)[][] =
      respostasAluno?.celulas ??
      Array.from({ length: L }, (_, i) =>
        Array.from({ length: C }, (_, j) =>
          conteudo?.mascaraAtiva?.[i]?.[j] ? '' : null
        )
      );

    conteudo?.preenchidasFixas?.forEach((f) => {
      if (base[f.linha]?.[f.coluna] !== undefined) {
        base[f.linha][f.coluna] = f.letra;
      }
    });

    return base;
  }, [conteudo, respostasAluno]);

  const setCell = (i: number, j: number, ch: string) => {
    if (respondido) return;
    if (!conteudo.mascaraAtiva[i]?.[j]) return;
    const next = init.map((row) => [...row]);
    next[i][j] = (ch ?? '').slice(0, 1).toUpperCase();
    setRespostasAluno({ celulas: next });
  };

  // Detecta perguntas horizontais e verticais
  const { horizontais, verticais } = useMemo(() => {
    const perguntas = Array.isArray(conteudo?.perguntas) ? conteudo.perguntas : [];

    const resolverOrientacao = (pergunta: any): 'horizontal' | 'vertical' => {
      const orientacaoStr = typeof pergunta?.orientacao === 'string' ? pergunta.orientacao.toLowerCase() : null;
      if (orientacaoStr === 'horizontal' || orientacaoStr === 'vertical') {
        return orientacaoStr;
      }

      const slot = pergunta?.slotId?.toString().toUpperCase?.();
      if (slot?.startsWith('H')) return 'horizontal';
      if (slot?.startsWith('V')) return 'vertical';

      const celulas = Array.isArray(pergunta?.celulas) ? pergunta.celulas : [];
      if (celulas.length >= 2) {
        const [primeira, segunda] = celulas;
        if (
          typeof primeira?.linha === 'number' &&
          typeof segunda?.linha === 'number' &&
          typeof primeira?.coluna === 'number' &&
          typeof segunda?.coluna === 'number'
        ) {
          if (primeira.linha === segunda.linha) return 'horizontal';
          if (primeira.coluna === segunda.coluna) return 'vertical';
        }
      }

      return 'horizontal';
    };

    const horizontaisArr: any[] = [];
    const verticaisArr: any[] = [];
    perguntas.forEach((pergunta) => {
      const orientacao = resolverOrientacao(pergunta);
      if (orientacao === 'horizontal') {
        horizontaisArr.push(pergunta);
      } else {
        verticaisArr.push(pergunta);
      }
    });

    return { horizontais: horizontaisArr, verticais: verticaisArr };
  }, [conteudo?.perguntas]);

  const { mapaNumeros, totalHorizontais } = useMemo(() => {
    const adicionarNumero = (
      destino: Map<string, number[]>,
      celula: { linha: number; coluna: number } | null,
      numero: number,
    ) => {
      if (!celula || typeof celula.linha !== 'number' || typeof celula.coluna !== 'number') return;
      const key = `${celula.linha}-${celula.coluna}`;
      const existente = destino.get(key) ?? [];
      destino.set(key, [...existente, numero]);
    };

    const obterCelulaInicial = (
      pergunta: any,
      orientacao: 'horizontal' | 'vertical',
    ): { linha: number; coluna: number } | null => {
      const celulas = Array.isArray(pergunta?.celulas) ? pergunta.celulas : [];
      if (celulas.length === 0) return null;

      let selecionada: { linha: number; coluna: number } | null = null;
      for (const item of celulas) {
        if (typeof item?.linha !== 'number' || typeof item?.coluna !== 'number') continue;
        if (!selecionada) {
          selecionada = { linha: item.linha, coluna: item.coluna };
          continue;
        }

        if (orientacao === 'horizontal') {
          if (item.linha < selecionada.linha) {
            selecionada = { linha: item.linha, coluna: item.coluna };
            continue;
          }
          if (item.linha === selecionada.linha && item.coluna < selecionada.coluna) {
            selecionada = { linha: item.linha, coluna: item.coluna };
          }
        } else {
          if (item.coluna < selecionada.coluna) {
            selecionada = { linha: item.linha, coluna: item.coluna };
            continue;
          }
          if (item.coluna === selecionada.coluna && item.linha < selecionada.linha) {
            selecionada = { linha: item.linha, coluna: item.coluna };
          }
        }
      }

      return selecionada;
    };

    const map = new Map<string, number[]>();

    horizontais.forEach((pergunta, index) => {
      const celula = obterCelulaInicial(pergunta, 'horizontal');
      adicionarNumero(map, celula, index + 1);
    });

    const inicioVertical = horizontais.length + 1;
    verticais.forEach((pergunta, index) => {
      const celula = obterCelulaInicial(pergunta, 'vertical');
      adicionarNumero(map, celula, inicioVertical + index);
    });

    if (map.size === 0) {
      const grid = Array.isArray(conteudo?.mascaraAtiva) ? conteudo.mascaraAtiva : [];
      const linhas = grid.length;
      const colunas = grid[0]?.length ?? 0;

      let horizontalCount = 0;
      for (let i = 0; i < linhas; i += 1) {
        for (let j = 0; j < colunas; j += 1) {
          const ativo = grid[i]?.[j];
          if (!ativo) continue;
          const inicioHorizontal = (!grid[i]?.[j - 1]) && !!grid[i]?.[j + 1];
          if (inicioHorizontal) horizontalCount += 1;
        }
      }

      let horizontalIndice = 1;
      let verticalIndice = horizontalCount + 1;

      for (let i = 0; i < linhas; i += 1) {
        for (let j = 0; j < colunas; j += 1) {
          const ativo = grid[i]?.[j];
          if (!ativo) continue;

          const inicioHorizontal = (!grid[i]?.[j - 1]) && !!grid[i]?.[j + 1];
          const inicioVertical = (!(grid[i - 1]?.[j])) && !!(grid[i + 1]?.[j]);

          const key = `${i}-${j}`;
          if (inicioHorizontal) {
            const existente = map.get(key) ?? [];
            map.set(key, [...existente, horizontalIndice]);
            horizontalIndice += 1;
          }

          if (inicioVertical) {
            const existente = map.get(key) ?? [];
            map.set(key, [...existente, verticalIndice]);
            verticalIndice += 1;
          }
        }
      }

      if (map.size === 0) {
        return { mapaNumeros: {}, totalHorizontais: horizontalCount };
      }

      return {
        mapaNumeros: Array.from(map.entries()).reduce<Record<string, number[]>>((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {}),
        totalHorizontais: horizontalCount,
      };
    }

    return {
      mapaNumeros: Array.from(map.entries()).reduce<Record<string, number[]>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {}),
      totalHorizontais: horizontais.length,
    };
  }, [conteudo?.mascaraAtiva, horizontais, verticais]);

  const numerosPorCelula = mapaNumeros;
  const totalHorizontaisParaListas = totalHorizontais > 0 ? totalHorizontais : horizontais.length;
  const verticalNumeroInicial = totalHorizontaisParaListas + 1;

  return (
    <ScrollView>
      <View style={styles.cruzContainer}>
        {/* Grid da Cruzadinha */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cruzHorizontalContent}
        >
          <View style={styles.cruzGrid}>
            {init.map((row, i) => (
              <View key={i} style={styles.cruzRow}>
                {row.map((cell, j) => {
                  const active = conteudo.mascaraAtiva[i]?.[j];
                  if (!active)
                    return (
                      <View key={j} style={[styles.cruzCellInactive, inactiveCellMetricStyle]} />
                    );

                  const fixed = conteudo.preenchidasFixas?.some(
                    (f) => f.linha === i && f.coluna === j
                  );
                  const fb = feedbacks?.corretas?.[i]?.[j];
                  const numeros = numerosPorCelula[`${i}-${j}`];

                  let cellStyle = styles.cruzCellDefault;
                  if (respondido) {
                    if (fixed) {
                      cellStyle = styles.cruzCellCorrect;
                    } else if (fb != null) {
                      cellStyle = fb
                        ? styles.cruzCellCorrect
                        : styles.cruzCellIncorrect;
                    }
                  }

                  return (
                    <View key={j} style={[styles.cruzCell, cellMetricStyle, cellStyle]}>
                      {Array.isArray(numeros)
                        ? numeros.map((numero, numeroIdx) => {
                            const horizontal =
                              horizontais.some((pergunta, idx) => idx + 1 === numero) ||
                              (!conteudo?.perguntas && numeroIdx === 0);
                            const offsetLeft = horizontal ? -cellConfig.size * 0.65 : 2 + numeroIdx * numeroBadgeSpacing;
                            const offsetTop = horizontal ? 2 : -cellConfig.size * 0.65;
                            return (
                              <View
                                key={`${numero}-${numeroIdx}`}
                                style={[
                                  styles.cruzNumeroBadge,
                                  numeroBadgeStyle,
                                  {
                                    left: offsetLeft,
                                    top: offsetTop,
                                  },
                                ]}
                              >
                                <Text style={[styles.cruzNumeroTexto, numeroTextoStyle]}>{numero}</Text>
                              </View>
                            );
                          })
                        : null}

                      {fixed ? (
                        <Text style={[styles.cruzCellTextFixed, textMetricStyle]}>{cell}</Text>
                      ) : (
                        <TextInput
                          maxLength={1}
                          editable={!respondido}
                          value={cell ?? ''}
                          onChangeText={(text) => setCell(i, j, text)}
                          style={[styles.cruzInput, inputMetricStyle]}
                          textAlign="center"
                          autoCapitalize="characters"
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Perguntas */}
        {conteudo.perguntas && conteudo.perguntas.length > 0 && (
          <View style={styles.perguntasContainer}>
            {horizontais.length > 0 && (
              <View style={styles.perguntasSecao}>
                <Text style={styles.perguntasTitle}>Horizontais:</Text>
                {horizontais.map((p, idx) => (
                  <View key={p.id || idx} style={styles.perguntaItem}>
                    <Text style={styles.perguntaNumero}>{idx + 1}.</Text>
                    <Text style={styles.perguntaTexto}>
                      {p.enunciado || 'Sem enunciado'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {verticais.length > 0 && (
              <View style={styles.perguntasSecao}>
                <Text style={styles.perguntasTitle}>Verticais:</Text>
                {verticais.map((p, idx) => (
                  <View key={p.id || idx} style={styles.perguntaItem}>
                    <Text style={styles.perguntaNumero}>{verticalNumeroInicial + idx}.</Text>
                    <Text style={styles.perguntaTexto}>
                      {p.enunciado || 'Sem enunciado'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Math Table
  mathContainer: {
    padding: 12,
    gap: 12,
  },
  mathRegra: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
  },
  mathTable: {
    borderWidth: 2,
    borderColor: '#C084FC',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mathRow: {
    flexDirection: 'row',
  },
  mathCell: {
    width: 80,
    height: 48,
    borderWidth: 2,
    borderColor: '#C084FC',
    padding: 4,
    justifyContent: 'center',
  },
  mathCellDefault: {
    backgroundColor: '#FFFFFF',
  },
  mathCellCorrect: {
    backgroundColor: '#D1FAE5',
  },
  mathCellIncorrect: {
    backgroundColor: '#FEE2E2',
  },
  mathCellFilled: {
    width: 80,
    height: 48,
    borderWidth: 2,
    borderColor: '#C084FC',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mathCellText: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  mathInput: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
    height: '100%',
  },

  // Cruzadinha
  cruzContainer: {
    paddingVertical: 4,
    paddingHorizontal: 0,
    gap: 16,
  },
  cruzHorizontalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  cruzGrid: {
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'visible',
    alignSelf: 'center',
    padding: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  cruzRow: {
    flexDirection: 'row',
  },
  cruzCell: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: '#C084FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cruzCellInactive: {
    width: 26,
    height: 26,
    backgroundColor: '#D1D5DB',
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  cruzCellDefault: {
    backgroundColor: '#FFFFFF',
  },
  cruzCellCorrect: {
    backgroundColor: '#D1FAE5',
  },
  cruzCellIncorrect: {
    backgroundColor: '#FEE2E2',
  },
  cruzInput: {
    width: '100%',
    height: '100%',
    fontSize: 10,
    fontWeight: '400',
    color: '#111827',
    textTransform: 'uppercase',
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: 'center',
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center' as const,
      },
    }),
  },
  cruzCellTextFixed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
  cruzNumeroBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#C084FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cruzNumeroTexto: {
    color: '#7C3AED',
    fontWeight: '700',
    textAlign: 'center',
  },

  // Perguntas
  perguntasContainer: {
    marginTop: 16,
    gap: 12,
  },
  perguntasSecao: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  perguntasTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  perguntaItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  perguntaNumero: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  perguntaTexto: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
});