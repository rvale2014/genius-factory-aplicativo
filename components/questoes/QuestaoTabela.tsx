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

type SlotDetectado = {
  linha: number;
  coluna: number;
  direcao: 'horizontal' | 'vertical';
  celulas: Array<{ linha: number; coluna: number }>;
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

  const slotsDetectados = useMemo<SlotDetectado[]>(() => {
    const mask = Array.isArray(conteudo?.mascaraAtiva) ? conteudo.mascaraAtiva : [];
    const rows = mask.length;
    if (rows === 0) return [];
    const cols = mask[0]?.length ?? 0;
    if (cols === 0) return [];

    const res: SlotDetectado[] = [];

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const active = !!mask[r]?.[c];
        const leftBlocked = c === 0 || !mask[r]?.[c - 1];
        if (!active || !leftBlocked) continue;

        let cc = c;
        const celulas: Array<{ linha: number; coluna: number }> = [];
        while (cc < cols && !!mask[r]?.[cc]) {
          celulas.push({ linha: r, coluna: cc });
          cc += 1;
        }

        if (celulas.length >= 2) {
          res.push({
            linha: r,
            coluna: c,
            direcao: 'horizontal',
            celulas,
          });
        }
      }
    }

    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        const active = !!mask[r]?.[c];
        const topBlocked = r === 0 || !mask[r - 1]?.[c];
        if (!active || !topBlocked) continue;

        let rr = r;
        const celulas: Array<{ linha: number; coluna: number }> = [];
        while (rr < rows && !!mask[rr]?.[c]) {
          celulas.push({ linha: rr, coluna: c });
          rr += 1;
        }

        if (celulas.length >= 2) {
          res.push({
            linha: r,
            coluna: c,
            direcao: 'vertical',
            celulas,
          });
        }
      }
    }

    return res;
  }, [conteudo?.mascaraAtiva]);

  const {
    mapaNumeros,
    totalHorizontais,
    perguntasOrdenadas,
    numeroDirecoes,
  } = useMemo(() => {
    const map = new Map<string, number[]>();
    const numeroDirecaoMap = new Map<number, 'horizontal' | 'vertical'>();
    const horizontaisSlots = slotsDetectados.filter((slot) => slot.direcao === 'horizontal');
    const verticaisSlots = slotsDetectados.filter((slot) => slot.direcao === 'vertical');
    const perguntas = Array.isArray(conteudo?.perguntas) ? conteudo.perguntas : [];
    const perguntasUsadas = new Set<number>();

    const resolverOrientacaoPergunta = (pergunta: any): 'horizontal' | 'vertical' | null => {
      const orientacaoStr =
        typeof pergunta?.orientacao === 'string' ? pergunta.orientacao.toLowerCase() : null;
      if (orientacaoStr === 'horizontal' || orientacaoStr === 'vertical') {
        return orientacaoStr;
      }

      const slot = pergunta?.slotId?.toString?.().toUpperCase?.();
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

      return null;
    };

    const obterInicioPergunta = (
      pergunta: any,
      direcao: 'horizontal' | 'vertical',
    ): { linha: number; coluna: number } | null => {
      const celulas = Array.isArray(pergunta?.celulas) ? pergunta.celulas : [];
      if (celulas.length === 0) return null;

      return celulas.reduce(
        (acc: { linha: number; coluna: number } | null, atual: { linha?: number; coluna?: number }) => {
        if (typeof atual?.linha !== 'number' || typeof atual?.coluna !== 'number') return acc;
        if (!acc) {
          return { linha: atual.linha, coluna: atual.coluna };
        }

        if (direcao === 'horizontal') {
          if (atual.linha < acc.linha) return { linha: atual.linha, coluna: atual.coluna };
          if (atual.linha === acc.linha && atual.coluna < acc.coluna) {
            return { linha: atual.linha, coluna: atual.coluna };
          }
          return acc;
        }

        if (atual.linha < acc.linha) return { linha: atual.linha, coluna: atual.coluna };
        if (atual.linha === acc.linha && atual.coluna < acc.coluna) {
          return { linha: atual.linha, coluna: atual.coluna };
        }
        return acc;
        },
        null,
      );
    };

    const encontrarPerguntaParaSlot = (
      slot: SlotDetectado,
      direcao: 'horizontal' | 'vertical',
    ):
      | {
          pergunta: any;
          indice: number;
        }
      | null => {
      for (let idx = 0; idx < perguntas.length; idx += 1) {
        if (perguntasUsadas.has(idx)) continue;
        const pergunta = perguntas[idx];
        const orientacaoPergunta = resolverOrientacaoPergunta(pergunta);
        if (orientacaoPergunta && orientacaoPergunta !== direcao) continue;
        const inicio = obterInicioPergunta(pergunta, direcao);
        if (inicio && inicio.linha === slot.linha && inicio.coluna === slot.coluna) {
          return { pergunta, indice: idx };
        }
      }
      return null;
    };

    const consumirPrimeiraPerguntaDisponivel = (
      direcao: 'horizontal' | 'vertical',
    ):
      | {
          pergunta: any;
          indice: number;
        }
      | null => {
      for (let idx = 0; idx < perguntas.length; idx += 1) {
        if (perguntasUsadas.has(idx)) continue;
        const pergunta = perguntas[idx];
        const orientacaoPergunta = resolverOrientacaoPergunta(pergunta);
        if (orientacaoPergunta && orientacaoPergunta !== direcao) continue;
        perguntasUsadas.add(idx);
        return { pergunta, indice: idx };
      }
      return null;
    };

    const perguntasComNumero: any[] = [];

    horizontaisSlots.forEach((slot, index) => {
      const numero = index + 1;
      const key = `${slot.linha}-${slot.coluna}`;
      const existente = map.get(key) ?? [];
      map.set(key, [...existente, numero]);
      numeroDirecaoMap.set(numero, 'horizontal');

      const match = encontrarPerguntaParaSlot(slot, 'horizontal');
      if (match) {
        perguntasUsadas.add(match.indice);
        perguntasComNumero.push({
          ...match.pergunta,
          numero,
          direcao: 'horizontal' as const,
        });
      } else {
        const fallback = consumirPrimeiraPerguntaDisponivel('horizontal');
        if (fallback) {
          perguntasComNumero.push({
            ...fallback.pergunta,
            numero,
            direcao: 'horizontal' as const,
          });
        } else {
          perguntasComNumero.push({
            numero,
            direcao: 'horizontal' as const,
          });
        }
      }
    });

    const inicioVertical = horizontaisSlots.length + 1;
    verticaisSlots.forEach((slot, index) => {
      const numero = inicioVertical + index;
      const key = `${slot.linha}-${slot.coluna}`;
      const existente = map.get(key) ?? [];
      map.set(key, [...existente, numero]);
      numeroDirecaoMap.set(numero, 'vertical');

      const match = encontrarPerguntaParaSlot(slot, 'vertical');
      if (match) {
        perguntasUsadas.add(match.indice);
        perguntasComNumero.push({
          ...match.pergunta,
          numero,
          direcao: 'vertical' as const,
        });
      } else {
        const fallback = consumirPrimeiraPerguntaDisponivel('vertical');
        if (fallback) {
          perguntasComNumero.push({
            ...fallback.pergunta,
            numero,
            direcao: 'vertical' as const,
          });
        } else {
          perguntasComNumero.push({
            numero,
            direcao: 'vertical' as const,
          });
        }
      }
    });

    const mapaNumerosObj = Array.from(map.entries()).reduce<Record<string, number[]>>(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {},
    );

    const numeroDirecoesObj = Array.from(
      numeroDirecaoMap.entries(),
    ).reduce<Record<number, 'horizontal' | 'vertical'>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

    // Garante ordenação crescente pelo número atribuído
    perguntasComNumero.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));

    return {
      mapaNumeros: mapaNumerosObj,
      totalHorizontais: horizontaisSlots.length,
      perguntasOrdenadas: perguntasComNumero,
      numeroDirecoes: numeroDirecoesObj,
    };
  }, [slotsDetectados, conteudo?.perguntas]);

  const numerosPorCelula = mapaNumeros;
  const numeroDirecoesPorNumero = numeroDirecoes;
  const perguntasHorizontais = useMemo(
    () =>
      Array.isArray(perguntasOrdenadas)
        ? perguntasOrdenadas.filter((p) => p.direcao === 'horizontal')
        : [],
    [perguntasOrdenadas],
  );
  const perguntasVerticais = useMemo(
    () =>
      Array.isArray(perguntasOrdenadas)
        ? perguntasOrdenadas.filter((p) => p.direcao === 'vertical')
        : [],
    [perguntasOrdenadas],
  );

  return (
    <ScrollView>
      <View style={styles.cruzContainer}>
        {/* Grid da Cruzadinha */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cruzHorizontalContent}
        >
          <View
            style={[
              styles.cruzGrid,
              {
                paddingTop: numeroBadgeSpacing,
                paddingLeft: numeroBadgeSpacing,
                paddingRight: numeroBadgeSpacing,
              },
            ]}
          >
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
                            const direcaoNumero = numeroDirecoesPorNumero?.[numero];
                            const isHorizontalNumero =
                              direcaoNumero === 'horizontal' || (!direcaoNumero && numeroIdx === 0);
                            const offsetLeft = isHorizontalNumero
                              ? -cellConfig.size * 0.65
                              : 2 + numeroIdx * numeroBadgeSpacing;
                            const offsetTop = isHorizontalNumero ? 2 : -cellConfig.size * 0.65;
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
        {perguntasOrdenadas && perguntasOrdenadas.length > 0 && (
          <View style={styles.perguntasContainer}>
            {perguntasHorizontais.length > 0 && (
              <View style={styles.perguntasSecao}>
                <Text style={styles.perguntasTitle}>Horizontais:</Text>
                {perguntasHorizontais.map((p) => (
                  <View key={p.id || p.numero} style={styles.perguntaItem}>
                    <Text style={styles.perguntaNumero}>{p.numero}.</Text>
                    <Text style={styles.perguntaTexto}>
                      {p.enunciado || 'Sem enunciado'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {perguntasVerticais.length > 0 && (
              <View style={styles.perguntasSecao}>
                <Text style={styles.perguntasTitle}>Verticais:</Text>
                {perguntasVerticais.map((p) => (
                  <View key={p.id || p.numero} style={styles.perguntaItem}>
                    <Text style={styles.perguntaNumero}>{p.numero}.</Text>
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