// components/sheets/GenerateSimuladoSheet.tsx
import { gerarSimulado, MateriaDisponivel, materiasDisponiveisSimulado } from "@/src/services/simuladosService";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetFooter } from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  open: boolean;
  onClose: () => void;
  // filtros atuais da tela
  filtroMateriaIds: string[];
  filtroAssuntoIds: string[];
  filtroAnoIds: string[];          // manter string
  filtroInstituicaoIds: string[];
  filtroClasseIds: string[];
  filtroGrauIds: string[];
  filtroSerieEscolarIds: string[];
  excluirSomenteErradas: boolean;
  excluirAcertadas: boolean;
  // navegação após criar
  onCreated: (simuladoId: string) => void;
};

export default function GenerateSimuladoSheet(props: Props) {
  const {
    open, onClose,
    filtroMateriaIds, filtroAssuntoIds, filtroAnoIds,
    filtroInstituicaoIds, filtroClasseIds, filtroGrauIds, filtroSerieEscolarIds,
    excluirSomenteErradas, excluirAcertadas,
    onCreated,
  } = props;

  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snaps = useMemo(() => ["92%"], []);
  const [loading, setLoading] = useState(false);
  const [materias, setMaterias] = useState<MateriaDisponivel[]>([]);
  const [nome, setNome] = useState("Genius Q-Bank");
  const [tempo, setTempo] = useState(75);
  const [tempoCustomizado, setTempoCustomizado] = useState(false);
  const [qtd, setQtd] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const totalSelecionado = useMemo(() => Object.values(qtd).reduce((a, b) => a + (b || 0), 0), [qtd]);
  const tempoRecomendado = useMemo(() => Math.round(totalSelecionado * 1.25), [totalSelecionado]);

  const formatTempoDisplay = useCallback((minutes: number) => {
    if (minutes <= 0) return "0 minutos";
    const horas = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (horas === 0) return `${mins} minuto${mins === 1 ? "" : "s"}`;
    const horasText = `${horas} hora${horas === 1 ? "" : "s"}`;
    if (mins === 0) return horasText;
    return `${horasText} e ${mins} minuto${mins === 1 ? "" : "s"}`;
  }, []);

  const formatTempoCompact = useCallback((minutes: number) => {
    const m = Math.max(0, minutes);
    const horas = Math.floor(m / 60)
      .toString()
      .padStart(2, "0");
    const mins = (m % 60).toString().padStart(2, "0");
    return `${horas}h${mins}min`;
  }, []);

  const loadMaterias = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const rows = await materiasDisponiveisSimulado({
        materiaIds: filtroMateriaIds,
        assuntoIds: filtroAssuntoIds,
        anoIds: filtroAnoIds,
        instituicaoIds: filtroInstituicaoIds,
        classeIds: filtroClasseIds,
        grauIds: filtroGrauIds,
        serieEscolarIds: filtroSerieEscolarIds,
        excluirSomenteErradas,
        excluirAcertadas,
      }, signal);
      if (signal?.aborted) return;
      setMaterias(rows);
      // reset quantidades
      const base: Record<string, number> = {};
      rows.forEach((m) => { base[m.id] = 0; });
      setQtd(base);
      setTempoCustomizado(false);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [filtroMateriaIds, filtroAssuntoIds, filtroAnoIds, filtroInstituicaoIds, filtroClasseIds, filtroGrauIds, filtroSerieEscolarIds, excluirSomenteErradas, excluirAcertadas]);

  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    loadMaterias(controller.signal);
    return () => {
      controller.abort();
    };
  }, [open, loadMaterias]);

  React.useEffect(() => {
    if (!tempoCustomizado && totalSelecionado > 0) {
      setTempo(tempoRecomendado);
    }
  }, [tempoCustomizado, tempoRecomendado, totalSelecionado]);

  const inc = (id: string, max: number) =>
    setQtd((prev) => {
      const currentTotal = Object.values(prev).reduce((a, b) => a + (b || 0), 0);
      if (currentTotal >= 100) return prev;
      const nextValue = Math.min((prev[id] || 0) + 1, max);
      const candidate = { ...prev, [id]: nextValue };
      const nextTotal = Object.values(candidate).reduce((a, b) => a + (b || 0), 0);
      if (nextTotal > 100) return prev;
      return candidate;
    });
  const dec = (id: string) => setQtd((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));

  const canSubmit = nome.trim().length > 0 && totalSelecionado > 0 && totalSelecionado <= 100;

  const handleCancel = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const questoesPorMateria = Object.entries(qtd)
        .filter(([, q]) => q > 0)
        .map(([materiaId, quantidade]) => ({ materiaId, quantidade }));

      const resp = await gerarSimulado({
        nome: nome.trim(),
        tempoMinutos: tempo,
        questoesPorMateria,
        assuntoIds: filtroAssuntoIds,
        anoIds: filtroAnoIds,
        instituicaoIds: filtroInstituicaoIds,
        grauIds: filtroGrauIds,
        serieEscolarIds: filtroSerieEscolarIds,
        excluirSomenteErradas,
        excluirAcertadas,
        // classeIds entra só na disponibilidade; se quiser filtrar tb na geração, a rota já suporta (ver backend abaixo).
        classeIds: filtroClasseIds,
      });

      onClose();
      onCreated(resp.simulado.id);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Erro ao criar simulado. Tente novamente.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={open ? 0 : -1}
      snapPoints={snaps}
      onClose={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      handleIndicatorStyle={{ opacity: 0.6 }}
      backgroundStyle={{ backgroundColor: "#fff" }}
      backdropComponent={(p) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...p} />}
      animateOnMount={false}
      footerComponent={(footerProps) => (
        <BottomSheetFooter
          {...footerProps}
          bottomInset={0}
        >
          <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
            <View style={styles.footerInfo}>
              <Text style={[styles.counter, totalSelecionado >= 100 && { color: "#b91c1c" }]}>{totalSelecionado}</Text>
              <Text style={styles.counterLabel}>questões selecionadas</Text>
            </View>
            <View style={styles.footerActions}>
              <TouchableOpacity
                accessible
                accessibilityLabel="Cancelar criação de simulado"
                onPress={handleCancel}
                style={styles.cancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!canSubmit || submitting}
                onPress={submit}
                style={[styles.cta, (!canSubmit || submitting) && { opacity: 0.6 }]}
                accessible
                accessibilityLabel="Criar simulado"
                activeOpacity={0.7}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Criar Simulado</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetFooter>
      )}
    >
      <BottomSheetFlatList<MateriaDisponivel>
        data={materias}
        keyExtractor={(m: MateriaDisponivel) => m.id}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 24 }}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.title}>Gerar simulado</Text>
            <Text style={styles.subtitle}>
              Você vai ter um tempo máximo para resolver e só uma chance de responder. No final, sua pontuação será
              calculada com base no número de acertos. Capriche!
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome do simulado</Text>
              <TextInput
                style={styles.textInput}
                value={nome}
                onChangeText={setNome}
                placeholder="Genius Q-Bank"
                placeholderTextColor="#B0B8C5"
              />
            </View>

            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Quantidade de questões</Text>
              <Text style={styles.fieldHint}>Máximo 100</Text>
            </View>
          </View>
        }
        renderItem={({ item }: { item: MateriaDisponivel }) => {
          const value = qtd[item.id] || 0;
          return (
            <View style={styles.row}>
              <View>
                <Text style={styles.materia}>{item.nome}</Text>
                <Text style={styles.subtle}>{item.quantidadeDisponivel} disponíveis</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  accessible
                  accessibilityLabel={`Diminuir quantidade de ${item.nome}`}
                  onPress={() => dec(item.id)}
                  style={[styles.stepBtn, styles.stepBtnMinus, styles.stepperButton]}
                >
                  <Ionicons name="remove" size={16} color="#EF4444" />
                </TouchableOpacity>
                <View style={styles.qtyBox}>
                  <Text style={styles.qty}>{value}</Text>
                </View>
                <TouchableOpacity
                  accessible
                  accessibilityLabel={`Aumentar quantidade de ${item.nome}`}
                  onPress={() => inc(item.id, item.quantidadeDisponivel)}
                  style={[styles.stepBtn, styles.stepBtnPlus, styles.stepperButton]}
                >
                  <Ionicons name="add" size={16} color="#22C55E" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          ) : (
            <Text style={{ color: "#6b7280", paddingVertical: 12 }}>Nenhuma matéria elegível com os filtros atuais.</Text>
          )
        }
        ListFooterComponent={
          <View style={styles.timeSection}>
            <Text style={styles.fieldLabel}>Tempo máximo</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity
                accessible
                accessibilityLabel="Diminuir tempo máximo"
                onPress={() => {
                  setTempoCustomizado(true);
                  setTempo((t) => Math.max(5, t - 5));
                }}
                style={[styles.stepBtn, styles.stepBtnMinus, styles.timeButton]}
              >
                <Ionicons name="remove" size={16} color="#EF4444" />
              </TouchableOpacity>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeText}>{formatTempoDisplay(tempo)}</Text>
              </View>
              <TouchableOpacity
                accessible
                accessibilityLabel="Aumentar tempo máximo"
                onPress={() => {
                  setTempoCustomizado(true);
                  setTempo((t) => t + 5);
                }}
                style={[styles.stepBtn, styles.stepBtnPlus, styles.timeButton]}
              >
                <Ionicons name="add" size={16} color="#22C55E" />
              </TouchableOpacity>
            </View>
            {totalSelecionado > 0 && (
              <Text style={styles.helperText}>Tempo recomendado: {formatTempoCompact(tempoRecomendado)}</Text>
            )}
          </View>
        }
      />

    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#6B7280", lineHeight: 20, fontSize: 14, marginTop: 12 },
  fieldGroup: { marginTop: 20 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 28,
  },
  fieldHint: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#EEF2F7",
  },
  materia: { fontWeight: "700", color: "#111827", fontSize: 15 },
  subtle: { color: "#94A3B8", fontSize: 12, marginTop: 4 },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButton: { marginHorizontal: 6 },
  stepBtnMinus: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  stepBtnPlus: { backgroundColor: "#ECFDF5", borderColor: "#BBF7D0" },
  qtyBox: {
    minWidth: 52,
    height: 36,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  qty: { fontWeight: "700", color: "#111827", fontSize: 18 },
  timeSection: { marginTop: 32 },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  timeButton: { marginHorizontal: 6 },
  timeDisplay: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  timeText: { fontSize: 16, fontWeight: "700", color: "#111827" },
  helperText: { color: "#94A3B8", fontSize: 12, marginTop: 8 },
  footer: {
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  footerInfo: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  counter: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  counterLabel: { color: "#64748B", fontSize: 14, marginLeft: 8 },
  footerActions: { flexDirection: "row", alignItems: "center" },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 12,
  },
  cancelText: { color: "#111827", fontWeight: "700", fontSize: 15 },
  cta: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});
