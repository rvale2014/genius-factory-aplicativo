import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function ResponderBar({
  canPrev, canNext, onPrev, onNext, onResponder, loading, lastFeedback
}: {
  canPrev?: boolean;
  canNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onResponder: (snapshot: any) => Promise<void>;
  loading?: boolean;
  lastFeedback?: { status: "ok"|"erro"; acertou?: boolean; nota?: number; msg?: string };
}) {
  // o ResponderBar não conhece a resposta: quem sabe é o QuestaoPlayer;
  // combine com o Player via ref/context para obter `snapshot`.
  const handleResponder = async () => {
    // um event “custom” que o Player escuta, ou use um ref imperativo
    const ev = new CustomEvent("questao:collect");
    // @ts-ignore
    global.dispatchEvent?.(ev);
    // o Player deve colocar algo em algum singleton/atom/contexto
    // Alternativa: passe para o ResponderBar uma função getSnapshot()
  };

  return (
    <View style={S.bar}>
      <View style={S.side}>
        <TouchableOpacity disabled={!canPrev || loading} style={[S.navBtn, !canPrev && S.navBtnDisabled]} onPress={onPrev}>
          <Text style={S.navText}>Anterior</Text>
        </TouchableOpacity>
      </View>

      <View style={S.center}>
        <TouchableOpacity disabled={loading} style={S.primary} onPress={handleResponder}>
          {loading ? <ActivityIndicator /> : <Text style={S.primaryText}>Responder</Text>}
        </TouchableOpacity>
        {!!lastFeedback && (
          <Text style={S.feedback}>
            {lastFeedback.msg ??
              (lastFeedback.nota != null
               ? `Nota: ${lastFeedback.nota.toFixed(1)}`
               : (lastFeedback.acertou ? "Acertou!" : "Errou"))}
          </Text>
        )}
      </View>

      <View style={S.side}>
        <TouchableOpacity disabled={!canNext || loading} style={[S.navBtn, !canNext && S.navBtnDisabled]} onPress={onNext}>
          <Text style={S.navText}>Próxima</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#eee", flexDirection: "row", alignItems: "center" },
  side: { flex: 1 },
  center: { flex: 2, alignItems: "center", gap: 6 },
  navBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", alignSelf: "flex-start" },
  navBtnDisabled: { opacity: 0.4 },
  navText: { fontWeight: "600" },
  primary: { backgroundColor: "#111", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  primaryText: { color: "#fff", fontWeight: "800" },
  feedback: { fontSize: 12, color: "#374151" },
});
