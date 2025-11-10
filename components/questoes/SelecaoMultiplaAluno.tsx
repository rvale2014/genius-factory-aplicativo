import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type SelecaoMultiplaAlternativa = {
  id: string;
  texto: string;
  imagemUrl?: string | null;
};

type Props = {
  respondido: boolean;
  alternativas: SelecaoMultiplaAlternativa[];
  respostasAluno: { selecionadas: string[] };
  setRespostasAluno: (value: { selecionadas: string[] }) => void;
  corretas?: string[];
};

export default function SelecaoMultiplaAluno({
  respondido,
  alternativas,
  respostasAluno,
  setRespostasAluno,
  corretas,
}: Props) {
  const selecionadasSet = useMemo(() => {
    const selecionadas = respostasAluno?.selecionadas ?? [];
    return new Set(selecionadas.map(String));
  }, [respostasAluno]);

  const corretasSet = useMemo(() => {
    const itens = Array.isArray(corretas) ? corretas : [];
    return new Set(itens.map(String));
  }, [corretas]);

  function toggle(id: string) {
    if (respondido) return;
    const next = new Set(selecionadasSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setRespostasAluno({ selecionadas: Array.from(next) });
  }

  return (
    <View style={styles.container}>
      {alternativas.map((alt, index) => {
        const checked = selecionadasSet.has(alt.id);
        const isCorreta = corretasSet.has(alt.id);

        const isFeedbackActive = respondido && corretas !== undefined;

        let borderColor = "#E5E7EB";
        let backgroundColor = "#FFFFFF";

        if (isFeedbackActive) {
          if (isCorreta) {
            borderColor = "#34D399";
            backgroundColor = "#ECFDF5";
          } else if (checked) {
            borderColor = "#F87171";
            backgroundColor = "#FEF2F2";
          }
        } else if (checked) {
          borderColor = "#C4B5FD";
          backgroundColor = "#F5F3FF";
        }

        let bulletVariant = styles.bulletDefault;
        let iconColor = "#FFFFFF";
        let showCheckIcon = checked;

        if (isFeedbackActive) {
          if (isCorreta && checked) {
            bulletVariant = styles.bulletCorrect;
          } else if (isCorreta && !checked) {
            bulletVariant = styles.bulletCorrectMuted;
            showCheckIcon = true;
            iconColor = "#059669";
          } else if (!isCorreta && checked) {
            bulletVariant = styles.bulletIncorrect;
          } else {
            bulletVariant = styles.bulletDefault;
            showCheckIcon = false;
          }
        } else if (checked) {
          bulletVariant = styles.bulletSelected;
        } else {
          bulletVariant = styles.bulletDefault;
          showCheckIcon = false;
        }

        return (
          <TouchableOpacity
            key={alt.id || `${index}`}
            activeOpacity={respondido ? 1 : 0.85}
            style={[
              styles.alternativa,
              { borderColor, backgroundColor },
              respondido && styles.alternativaRespondida,
            ]}
            onPress={() => toggle(String(alt.id))}
            disabled={respondido}
          >
            <Text style={styles.index}>{index + 1}.</Text>

            <View style={[styles.bullet, bulletVariant]}>
              {showCheckIcon ? <Ionicons name="checkmark" size={16} color={iconColor} /> : null}
            </View>

            {alt.imagemUrl ? (
              <Image
                source={{ uri: alt.imagemUrl }}
                style={styles.imagem}
                resizeMode="contain"
              />
            ) : null}

            <Text style={styles.texto}>{alt.texto}</Text>

            {isFeedbackActive && isCorreta ? (
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 4,
  },
  alternativa: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alternativaRespondida: {
    opacity: 0.92,
  },
  index: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
  },
  bullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  bulletDefault: {
    borderColor: "#D8B4FE",
    backgroundColor: "#FFFFFF",
  },
  bulletSelected: {
    borderColor: "#7C3AED",
    backgroundColor: "#7C3AED",
  },
  bulletCorrect: {
    borderColor: "#059669",
    backgroundColor: "#10B981",
  },
  bulletCorrectMuted: {
    borderColor: "#6EE7B7",
    backgroundColor: "#ECFDF5",
  },
  bulletIncorrect: {
    borderColor: "#F87171",
    backgroundColor: "#F87171",
  },
  imagem: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  texto: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 20,
  },
});

