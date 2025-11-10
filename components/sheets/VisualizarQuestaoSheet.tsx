// components/sheets/VisualizarQuestaoSheet.tsx
import { obterQuestaoCorrigida } from "@/src/services/simuladosResultadoService";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  open: boolean;
  onClose: () => void;
  simuladoId: string;
  questaoId: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

export default function VisualizarQuestaoSheet({
  open, onClose, simuladoId, questaoId, onPrev, onNext, hasPrev, hasNext,
}: Props) {
  const ref = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snaps = React.useMemo(() => ["85%"], []);
  const [loading, setLoading] = React.useState(false);
  const [dados, setDados] = React.useState<any>(null);

  // abrir/fechar por prop
  React.useEffect(() => {
    if (!ref.current) return;
    if (open) ref.current?.snapToIndex(0);
    else ref.current?.close();
  }, [open]);

  // carregar questão
  React.useEffect(() => {
    if (!open || !questaoId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const d = await obterQuestaoCorrigida(simuladoId, questaoId);
        if (active) setDados(d);
      } catch (e) {
        console.error(e);
        if (active) setDados(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open, simuladoId, questaoId]);

  const badge = (text: string, style: any) => (
    <View style={[styles.badge, style]}><Text style={styles.badgeTxt}>{text}</Text></View>
  );

  return (
    <BottomSheet
      ref={ref}
      index={open ? 0 : -1}
      snapPoints={snaps}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={(p) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...p} />}
      handleIndicatorStyle={{ opacity: 0.5 }}
      backgroundStyle={{ backgroundColor: "#fff" }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
        <Text style={styles.title}>Correção da questão</Text>
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: "center" }}><ActivityIndicator /></View>
      ) : !dados ? (
        <View style={{ padding: 24 }}><Text>Não foi possível carregar a questão.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 90 }}>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {dados.acertou === true && badge("Acertou", { backgroundColor: "#ECFDF5", borderColor: "#D1FAE5" })}
            {dados.acertou === false && badge("Errou", { backgroundColor: "#FEF2F2", borderColor: "#FECACA" })}
            {dados.tipo === "dissertativa" && dados.avaliacaoStatus && badge(`Dissertativa: ${dados.avaliacaoStatus}`, { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" })}
          </View>

          <Text style={styles.enunciado}>{dados.enunciado}</Text>

          {(dados.tipo === "multipla_escolha" || dados.tipo === "certa_errada") && Array.isArray(dados.alternativas) && (
            <View style={{ marginTop: 12 }}>
              {dados.alternativas.map((txt: string, i: number) => {
                const letra = String.fromCharCode(65 + i);
                const marcada = dados?.respostaAluno === letra || dados?.respostaAluno === i;
                const correta  = (dados?.gabarito === letra) || (dados?.gabarito === i);
                return (
                  <View key={i} style={[
                    styles.alt,
                    correta ? styles.altOk : marcada ? styles.altMarked : null,
                  ]}>
                    <Text style={styles.altText}>{letra}. {txt}</Text>
                    {correta && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
                    {!correta && marcada && <Ionicons name="close-circle" size={18} color="#EF4444" />}
                  </View>
                );
              })}
            </View>
          )}

          {dados.tipo === "dissertativa" && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.secTitle}>Sua resposta</Text>
              <Text style={styles.body}>{dados?.respostaAluno ?? "—"}</Text>
              <View style={{ height: 10 }} />
              <Text style={styles.secTitle}>Feedback</Text>
              <Text style={styles.body}>Nota: {dados?.notaDissertativa ?? "—"}/10</Text>
              {!!dados?.justificativaDissertativa && <Text style={styles.body}>Justificativa: {dados.justificativaDissertativa}</Text>}
              {!!dados?.sugestaoDissertativa && <Text style={styles.body}>Sugestão: {dados.sugestaoDissertativa}</Text>}
            </View>
          )}

          {!(["multipla_escolha","certa_errada","dissertativa"].includes(dados.tipo)) && (
            <View style={[styles.alt, { borderStyle: "dashed" }]}>
              <Text style={styles.body}>Visualização para “{dados.tipo}” — implemente o componente específico quando desejar.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Footer do sheet */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={[styles.navBtn, !hasPrev && { opacity: 0.5 }]} pointerEvents={hasPrev ? "auto" : "none"}>
            <Ionicons name="chevron-back" size={18} color="#7C3AED" onPress={onPrev} />
            <Text onPress={onPrev} style={styles.navTxt}>Anterior</Text>
          </View>
          <View style={[styles.navBtn, !hasNext && { opacity: 0.5 }]} pointerEvents={hasNext ? "auto" : "none"}>
            <Text onPress={onNext} style={styles.navTxt}>Próxima</Text>
            <Ionicons name="chevron-forward" size={18} color="#7C3AED" onPress={onNext} />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "800", color: "#111" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeTxt: { fontWeight: "700", color: "#111827" },
  enunciado: { fontSize: 16, color: "#111827", fontWeight: "600" },
  secTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 10, marginBottom: 4 },
  body: { color: "#374151" },
  alt: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginTop: 8, backgroundColor: "#fff" },
  altOk: { borderColor: "#10B98122", backgroundColor: "#ECFDF5" },
  altMarked: { borderColor: "#EF444422", backgroundColor: "#FEF2F2" },
  altText: { color: "#111827" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 10 },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" },
  navTxt: { color: "#7C3AED", fontWeight: "800" },
});
