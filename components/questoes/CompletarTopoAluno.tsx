import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Lacuna = { id: string };

type PalavraTopo = {
  id: string;
  texto: string;
  distrator?: boolean;
};

export type ConteudoCompletarTopo = {
  frases: string[];
  lacunas: Lacuna[];
  palavrasTopo: PalavraTopo[];
  config?: {
    permitirReordenarTopo?: boolean;
    permitirTrocaEntreSlots?: boolean;
  };
};

type RespostaSlot = { lacunaId: string; valor: string };

type RespostasAlunoSnapshot = {
  respostasAluno: RespostaSlot[];
  ordemTopo: string[];
};

type Props = {
  respondido: boolean;
  conteudo: ConteudoCompletarTopo;
  respostasAluno: RespostasAlunoSnapshot;
  setRespostasAluno: (value: RespostasAlunoSnapshot) => void;
  feedbacks?: Record<string, boolean>;
};

const PLACEHOLDER_CHARS = 8;
const PLACEHOLDER_FILL = "\u2007".repeat(PLACEHOLDER_CHARS);

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function arraysEqual(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function shallowEqualRecord(a: Record<string, string>, b: Record<string, string>) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function removeFirstOccurrence(list: string[], value: string) {
  const idx = list.indexOf(value);
  if (idx === -1) return list.slice();
  const next = list.slice();
  next.splice(idx, 1);
  return next;
}

function normalizeFrase(texto: string) {
  if (!texto) return "";
  return texto.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

export default function CompletarTopoAluno({
  respondido,
  conteudo,
  respostasAluno,
  setRespostasAluno,
  feedbacks,
}: Props) {
  const frases = useMemo(() => {
    const lista = Array.isArray(conteudo?.frases) ? conteudo.frases : [];
    return lista
      .map((texto) => (typeof texto === "string" ? normalizeFrase(texto) : ""))
      .filter((texto) => texto && /_{3,}/.test(texto));
  }, [conteudo?.frases]);

  const lacunaInfos = useMemo(() => {
    const lacunasCrudas = Array.isArray(conteudo?.lacunas) ? conteudo.lacunas : [];
    const infos: Lacuna[] = [];
    const base = lacunasCrudas.map((lacuna, index) => ({
      id: String(lacuna?.id ?? `${index}`),
    }));

    let cursor = 0;
    frases.forEach((texto, fraseIdx) => {
      const parts = texto.split(/_{3,}/g);
      const placeholders = Math.max(parts.length - 1, 0);
      for (let i = 0; i < placeholders; i += 1) {
        const existente = base[cursor];
        if (existente) {
          infos.push(existente);
        } else {
          infos.push({ id: `frase-${fraseIdx}-lacuna-${i}` });
        }
        cursor += 1;
      }
    });

    while (cursor < base.length) {
      infos.push(base[cursor]);
      cursor += 1;
    }

    return infos;
  }, [conteudo?.lacunas, frases]);

  const lacunaOrder = useMemo(() => lacunaInfos.map((item) => item.id), [lacunaInfos]);

  const palavrasTopo = useMemo(() => {
    const brutas = Array.isArray(conteudo?.palavrasTopo) ? conteudo.palavrasTopo : [];
    return brutas
      .map((item: PalavraTopo | string | null | undefined, index) => {
        if (!item) return null;
        if (typeof item === "string") {
          const texto = item.trim();
          if (!texto) return null;
          return { id: `${index}-${texto}`, texto };
        }
        const texto = typeof item?.texto === "string" ? item.texto.trim() : "";
        if (!texto) return null;
        return {
          id: String(item?.id ?? `${index}-${texto}`),
          texto,
          distrator: !!item?.distrator,
        };
      })
      .filter(
        (
          item,
        ): item is {
          id: string;
          texto: string;
          distrator?: boolean;
        } => !!item && item.texto.trim().length > 0,
      );
  }, [conteudo?.palavrasTopo]);

  const palavrasTexto = useMemo(() => palavrasTopo.map((p) => p.texto), [palavrasTopo]);

  const initialSlotValues = useMemo(() => {
    const raw = Array.isArray(respostasAluno?.respostasAluno) ? respostasAluno.respostasAluno : [];
    const map: Record<string, string> = {};
    raw.forEach((item) => {
      const lacunaId = item?.lacunaId ? String(item.lacunaId) : "";
      const valor = typeof item?.valor === "string" ? item.valor : "";
      if (lacunaId && valor) {
        map[lacunaId] = valor;
      }
    });
    return map;
  }, [respostasAluno?.respostasAluno]);

  const [slotValues, setSlotValues] = useState<Record<string, string>>(initialSlotValues);

  useEffect(() => {
    if (!shallowEqualRecord(slotValues, initialSlotValues)) {
      setSlotValues(initialSlotValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlotValues]);

  const shuffledDefault = useMemo(() => shuffle(palavrasTexto), [palavrasTexto]);

  const initialTopoList = useMemo(() => {
    const ocupadas = new Set(Object.values(initialSlotValues));
    const stored = Array.isArray(respostasAluno?.ordemTopo) ? respostasAluno.ordemTopo : [];
    const storedValid = stored.filter((palavra) => palavrasTexto.includes(palavra) && !ocupadas.has(palavra));
    const base = storedValid.length > 0 ? storedValid : shuffledDefault.filter((palavra) => !ocupadas.has(palavra));
    const missing = palavrasTexto.filter((palavra) => !ocupadas.has(palavra) && !base.includes(palavra));
    return [...base, ...missing];
  }, [initialSlotValues, palavrasTexto, respostasAluno?.ordemTopo, shuffledDefault]);

  const [topoDisponivel, setTopoDisponivel] = useState<string[]>(initialTopoList);

  useEffect(() => {
    if (!arraysEqual(topoDisponivel, initialTopoList)) {
      setTopoDisponivel(initialTopoList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopoList]);

  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  function syncParentState(nextSlots: Record<string, string>, nextTopo: string[]) {
    const respostas = lacunaOrder
      .map((lacunaId) => {
        const valor = nextSlots[lacunaId];
        if (!valor) return null;
        return { lacunaId, valor };
      })
      .filter((item): item is RespostaSlot => !!item);

    setRespostasAluno({
      respostasAluno: respostas,
      ordemTopo: nextTopo,
    });
  }

  useEffect(() => {
    const parentTopo = respostasAluno?.ordemTopo ?? [];
    const parentSlots = Array.isArray(respostasAluno?.respostasAluno) ? respostasAluno.respostasAluno : [];
    const parentMap: Record<string, string> = {};
    parentSlots.forEach((item) => {
      if (!item) return;
      const lacunaId = String(item.lacunaId ?? "");
      if (!lacunaId) return;
      parentMap[lacunaId] = typeof item.valor === "string" ? item.valor : "";
    });

    const topoDiffers = !arraysEqual(parentTopo, topoDisponivel);
    let slotDiffers = false;
    if (!topoDiffers) {
      for (const lacunaId of lacunaOrder) {
        const local = slotValues[lacunaId] ?? "";
        const remoto = parentMap[lacunaId] ?? "";
        if (local !== remoto) {
          slotDiffers = true;
          break;
        }
      }
    }

    if (topoDiffers || slotDiffers) {
      syncParentState(slotValues, topoDisponivel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotValues, topoDisponivel]);

  function assignWordToSlot(slotId: string, palavra: string) {
    if (respondido) return;
    if (!palavra) return;
    const atual = slotValues[slotId];
    if (atual === palavra) {
      setActiveSlot(null);
      return;
    }

    const nextSlots = { ...slotValues };
    nextSlots[slotId] = palavra;

    let nextTopo = removeFirstOccurrence(topoDisponivel, palavra);
    if (atual) {
      nextTopo = [...nextTopo, atual];
    }

    setSlotValues(nextSlots);
    setTopoDisponivel(nextTopo);
    setActiveSlot(null);
    syncParentState(nextSlots, nextTopo);
  }

  function clearSlot(slotId: string) {
    if (respondido) return;
    const atual = slotValues[slotId];
    if (!atual) {
      setActiveSlot(slotId);
      return;
    }

    const nextSlots = { ...slotValues };
    delete nextSlots[slotId];
    const nextTopo = [...topoDisponivel, atual];

    setSlotValues(nextSlots);
    setTopoDisponivel(nextTopo);
    setActiveSlot(slotId);
    syncParentState(nextSlots, nextTopo);
  }

  function moveWordBetweenSlots(fromSlot: string, toSlot: string) {
    if (respondido) return;
    const valorOrigem = slotValues[fromSlot];
    if (!valorOrigem) {
      setActiveSlot(toSlot);
      return;
    }

    const valorDestino = slotValues[toSlot];
    if (valorDestino === valorOrigem) {
      setActiveSlot(null);
      return;
    }

    const nextSlots = { ...slotValues };
    delete nextSlots[fromSlot];
    nextSlots[toSlot] = valorOrigem;

    const nextTopo = valorDestino ? [...topoDisponivel, valorDestino] : topoDisponivel.slice();

    setSlotValues(nextSlots);
    setTopoDisponivel(nextTopo);
    setActiveSlot(null);
    syncParentState(nextSlots, nextTopo);
  }

  function handleSlotPress(slotId: string) {
    if (respondido) return;
    if (activeSlot === slotId) {
      clearSlot(slotId);
      return;
    }

    if (activeSlot && activeSlot !== slotId) {
      moveWordBetweenSlots(activeSlot, slotId);
      return;
    }

    setActiveSlot(slotId);
  }

  function handleWordPress(palavra: string) {
    if (respondido) return;
    const slotPrioritario = activeSlot ?? lacunaOrder.find((id) => !slotValues[id]);
    if (!slotPrioritario) return;
    assignWordToSlot(slotPrioritario, palavra);
  }

  let lacunaCursor = 0;

  return (
    <View style={styles.container}>
      <View style={styles.topoCard}>
        <View style={styles.topoPalavrasLinha}>
          {topoDisponivel.length > 0 &&
            topoDisponivel.map((palavra, index) => (
              <Text
                key={`${palavra}-${index}`}
                style={[styles.topoChip, respondido && styles.desabilitado]}
                onPress={() => handleWordPress(palavra)}
                suppressHighlighting
              >
                {palavra}
              </Text>
            ))}
        </View>
      </View>

      <View style={styles.frasesWrapper}>
        {frases.map((texto, fraseIdx) => {
          const parts = texto.split(/_{3,}/g);
          const conteudoTexto: React.ReactNode[] = [
            <Text key={`frase-${fraseIdx}-numero`} style={styles.numeroInline}>
              {`${fraseIdx + 1}. `}
            </Text>,
          ];

          parts.forEach((part, partIdx) => {
            const keyBase = `frase-${fraseIdx}-part-${partIdx}`;
            const isLast = partIdx === parts.length - 1;

            if (part) {
              conteudoTexto.push(
                <Text key={`${keyBase}-texto`} style={styles.textoInline}>
                  {part}
                </Text>,
              );
            }

            if (!isLast) {
              const lacunaInfo = lacunaInfos[lacunaCursor];
              const lacunaId = lacunaInfo ? lacunaInfo.id : `frase-${fraseIdx}-lacuna-${partIdx}`;
              const valor = slotValues[lacunaId] ?? "";
              const feedback = feedbacks ? feedbacks[lacunaId] : undefined;
              const slotStyles = [
                styles.slotInline,
                valor ? styles.slotComValor : styles.slotVazio,
                activeSlot === lacunaId && !respondido && styles.slotAtivo,
              ];

              if (respondido && feedback !== undefined) {
                slotStyles.push(feedback ? styles.slotCorreto : styles.slotIncorreto);
              }

              conteudoTexto.push(
                <Text
                  key={`${keyBase}-slot`}
                  onPress={() => handleSlotPress(lacunaId)}
                  style={slotStyles}
                  suppressHighlighting
                >
                  {valor || PLACEHOLDER_FILL}
                  {respondido && feedback !== undefined ? (
                    <Text style={styles.slotIconWrapper}>
                      <Ionicons
                        name={feedback ? "checkmark-circle" : "close-circle"}
                        size={16}
                        color={feedback ? "#16A34A" : "#DC2626"}
                      />
                    </Text>
                  ) : null}
                </Text>,
              );

              lacunaCursor += 1;
            }
          });

          return (
            <View key={`frase-${fraseIdx}`} style={styles.fraseCard}>
              <Text style={styles.fraseTextoWrap} suppressHighlighting>
                {conteudoTexto}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 12,
  },
  topoCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    gap: 12,
  },
  topoPalavrasLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topoChip: {
    borderWidth: 1,
    borderColor: "#D8DDF5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#312E81",
  },
  frasesWrapper: {
    gap: 12,
  },
  fraseCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  fraseTextoWrap: {
    fontSize: 15,
    lineHeight: 22,
    color: "#111827",
    flex: 1,
  },
  numeroInline: {
    fontWeight: "700",
    color: "#4C1D95",
    marginRight: 6,
  },
  textoInline: {
    fontSize: 15,
    lineHeight: 22,
    color: "#111827",
  },
  slotInline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: "600",
    color: "#6D28D9",
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
    marginHorizontal: 4,
    textDecorationLine: "underline",
    textDecorationColor: "#CBD5F5",
  },
  slotComValor: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F5F3FF",
    color: "#4C1D95",
    textDecorationColor: "#8B5CF6",
  },
  slotVazio: {
    color: "#9CA3AF",
  },
  slotAtivo: {
    borderWidth: 2,
    borderColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  slotCorreto: {
    borderColor: "#34D399",
    backgroundColor: "#ECFDF5",
    color: "#047857",
  },
  slotIncorreto: {
    borderColor: "#F87171",
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
  },
  slotIconWrapper: {
    marginLeft: 6,
  },
  desabilitado: {
    opacity: 0.6,
  },
});

