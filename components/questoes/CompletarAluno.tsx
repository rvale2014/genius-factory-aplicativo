import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type FraseCompletar = {
  id: string;
  textoBase: string;
  opcoes: [string, string];
  explicacao?: string | null;
};

type Props = {
  respondido: boolean;
  frases: FraseCompletar[];
  respostasAluno: string[];
  setRespostasAluno: (value: string[]) => void;
  feedbacks?: Array<"correta" | "incorreta" | null>;
};

function splitTexto(textoBase: string) {
  const parts = textoBase.split("_____");
  if (parts.length === 1) return [textoBase, ""];
  return [parts[0], parts.slice(1).join("_____")];
}
function sanitizeSegment(s?: string | null) {
  if (!s) return "";
  return s.replace(/\s*[\r\n]+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

export default function CompletarAluno({
  respondido,
  frases,
  respostasAluno,
  setRespostasAluno,
  feedbacks,
}: Props) {
  const normalizadas = useMemo(() => frases ?? [], [frases]);

  function setResposta(index: number, valor: string) {
    if (respondido) return;
    const next = [...(respostasAluno ?? [])];
    while (next.length <= index) next.push("");
    next[index] = valor;
    setRespostasAluno(next);
  }
  function limparResposta(index: number) {
    if (respondido) return;
    const next = [...(respostasAluno ?? [])];
    while (next.length <= index) next.push("");
    next[index] = "";
    setRespostasAluno(next);
  }

  return (
    <View style={styles.container}>
      {normalizadas.map((frase, index) => {
        const valor = respostasAluno?.[index] ?? "";
        const feedback = feedbacks?.[index] ?? null;
        const [antesRaw, depoisRaw] = splitTexto(frase.textoBase ?? "");
        const antes = sanitizeSegment(antesRaw);
        const depois = sanitizeSegment(depoisRaw);
        const opcoes = frase.opcoes ?? ["", ""];

        const placeholderStyle = [
          styles.placeholderInline,
          valor ? styles.placeholderComValor : styles.placeholderVazio,
          respondido && feedback === "correta" && styles.placeholderCorreta,
          respondido && feedback === "incorreta" && styles.placeholderIncorreta,
        ];

        return (
          <View key={frase.id || `frase-${index}`} style={styles.card}>
            {/* Frase inteira num único <Text>, com a lacuna como <Text> inline */}
            <View style={styles.fraseRow}>
              <View style={styles.numeroCircle}>
                <Text style={styles.numeroText}>{index + 1}</Text>
              </View>

              <Text style={styles.fraseTextoWrap} suppressHighlighting>
                {antes ? `${antes} ` : ""}

                <Text
                  onPress={() => {
                    if (respondido) return;
                    if (valor) limparResposta(index);
                  }}
                  style={[
                    styles.placeholderInline,
                    valor ? styles.placeholderComValor : styles.placeholderVazio,
                    respondido && feedback === "correta" && styles.placeholderCorreta,
                    respondido && feedback === "incorreta" && styles.placeholderIncorreta,
                  ]}
                  suppressHighlighting
                >
                  {valor || PLACEHOLDER_FILL}
                </Text>

                {depois ? ` ${depois}` : ""}
              </Text>

              {respondido && feedback && (
                <Ionicons
                  name={feedback === "correta" ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={feedback === "correta" ? "#16A34A" : "#DC2626"}
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>

            {/* ===== Opções ===== */}
            <View style={styles.opcoesAreaCinza}>
              <View style={styles.duasOpcoesRow}>
                {opcoes.map((opt, optIdx) => {
                  const selecionada = valor === opt;
                  return (
                    <Text
                      key={`${frase.id || index}-opt-${optIdx}`}
                      onPress={() => {
                        if (!respondido) setResposta(index, opt);
                      }}
                      style={[
                        styles.opcaoBox,
                        selecionada && styles.opcaoSelecionada,
                        respondido && styles.opcaoRespondido,
                      ]}
                      numberOfLines={2}
                    >
                      <Text
                        style={[
                          styles.opcaoTexto,
                          selecionada && styles.opcaoTextoSelecionada,
                        ]}
                      >
                        {opt}
                      </Text>
                    </Text>
                  );
                })}
              </View>
            </View>

            {respondido && frase.explicacao ? (
              <View style={styles.explicacaoWrapper}>
                <Text style={styles.explicacaoTitulo}>Explicação</Text>
                <Text style={styles.explicacaoTexto}>{frase.explicacao}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const CIRCLE_SIZE = 28;
const PLACEHOLDER_CHARS = 8;
const PLACEHOLDER_FILL = "\u2007".repeat(PLACEHOLDER_CHARS);

const styles = StyleSheet.create({
  container: { gap: 14, marginTop: 8 },

  card: {
    borderWidth: 1,
    borderColor: "#E4E7EF",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },

  /* Frase */
  fraseRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  numeroCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  numeroText: { fontWeight: "700", color: "#1F2937", fontSize: 14, lineHeight: 18 },

  // Container textual que pode quebrar; a lacuna é inline aqui dentro
  fraseTextoWrap: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#111827",
  },

  /* Lacuna INLINE */
  placeholderInline: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    fontWeight: "700",
    fontSize: 15,
    color: "#6D28D9",
    textAlign: "center",
    lineHeight: 20,
    textDecorationLine: "underline",
    textDecorationColor: "#CBD5F5",
  },
  placeholderComValor: {
    borderColor: "#8B5CF6",
    textDecorationColor: "#8B5CF6",
  },
  placeholderVazio: {
    borderColor: "#D1D5DB",
    color: "#9CA3AF",
    textDecorationColor: "#CBD5F5",
  },
  placeholderCorreta: { borderColor: "#34D399", backgroundColor: "#ECFDF5" },
  placeholderIncorreta: { borderColor: "#F87171", backgroundColor: "#FEF2F2" },

  /* Opções */
  opcoesAreaCinza: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
  },
  duasOpcoesRow: { flexDirection: "row", flexWrap: "nowrap", gap: 12 },
  opcaoBox: {
    flex: 1,
    minHeight: 44,
    borderWidth: 2,
    borderColor: "#D8DDF5",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    textAlignVertical: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  opcaoSelecionada: { borderColor: "#8B5CF6", backgroundColor: "#F3E8FF" },
  opcaoRespondido: { opacity: 0.95 },
  opcaoTexto: { fontSize: 15, fontWeight: "600", color: "#312E81" },
  opcaoTextoSelecionada: { color: "#5B21B6" },

  /* Explicação */
  explicacaoWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  explicacaoTitulo: { fontSize: 13, fontWeight: "700", color: "#4338CA" },
  explicacaoTexto: { fontSize: 13, color: "#374151", lineHeight: 18 },
});
