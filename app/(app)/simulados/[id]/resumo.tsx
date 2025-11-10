// app/(app)/simulados/[id]/resumo.tsx
import { getSimuladoParaResolver } from "@/src/services/simuladosExecService";
import { obterSimuladoResumo, SimuladoResumoMobile } from "@/src/services/simuladosResumoService";
import { setResolverCache } from "@/src/stores/simuladoResolverCache";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatTempo(tempoMinutos: number) {
  // Figma mostra HH:MM:SS — converto de minutos
  const total = Math.max(0, Math.round(tempoMinutos * 60));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function SimuladoResumoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [data, setData] = React.useState<SimuladoResumoMobile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await obterSimuladoResumo(id);
        if (active) setData(resp);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const onStart = async () => {
    if (!data) return;
    setStarting(true);
    try {
      const payload = await getSimuladoParaResolver(data.id);
      setResolverCache(data.id, payload);
      router.replace(`/simulados/${data.id}/resolver`);
    } catch (e: any) {
      console.error(e);
      const message = e?.message ?? "Erro ao iniciar o simulado.";
      alert(message);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <Text>Simulado não encontrado.</Text>
      </View>
    );
  }

  // texto do CTA conforme status
  const ctaLabel =
    data.status === "nao_iniciado" ? "Iniciar" :
    data.status === "em_andamento" ? "Continuar" :
    "Iniciar";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header simples */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{data.titulo}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Conteúdo com FlatList para garantir scroll + footer fixo */}
      <FlatList
        data={data.distribuicao}
        keyExtractor={(it) => it.materiaId}
        ListHeaderComponent={
          <View style={styles.topBlock}>
            <Text style={styles.h1}>Este simulado funciona como{`\n`}uma prova de verdade!</Text>

            <Text style={styles.p}>
              Você vai ter um tempo máximo para resolver e só uma chance de responder. No final, sua pontuação será
              calculada com base no número de acertos. Capriche! 😉🧠✨
            </Text>
            <Text style={[styles.p, { marginTop: 8 }]}>
              Você pode pausar o simulado a qualquer momento e continuar depois.
            </Text>
            <Text style={[styles.p, { marginTop: 8 }]}>
              A seguir, veja como estão distribuídas as questões no Simulado.
            </Text>

            <View style={styles.separator} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="book-outline" size={16} color="#4B5563" />
              <Text style={styles.rowLabel}>{item.nome}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.quantidade} {item.quantidade === 1 ? "questão" : "questões"}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="time-outline" size={16} color="#4B5563" />
                <Text style={styles.rowLabel}>Tempo</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{formatTempo(data.tempoMinutos)}</Text>
              </View>
            </View>
            <View style={{ height: 16 }} />
          </>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: (insets.bottom || 16) + 90 }}
        showsVerticalScrollIndicator
      />

      {/* Footer com ações (sem PDF) */}
      <View style={[styles.footer, { paddingBottom: (insets.bottom || 16) + 8 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onStart} disabled={starting}>
          {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{ctaLabel}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 6 },
  backBtn: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#111" },

  topBlock: { paddingHorizontal: 20, paddingTop: 14 },
  h1: { fontSize: 22, fontWeight: "800", color: "#111", lineHeight: 28, marginBottom: 10 },
  p: { color: "#374151" },

  separator: { height: 1, backgroundColor: "#EEF2F7", marginTop: 16 },

  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F1F5F9",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { fontSize: 16, color: "#111" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#F3F4F6" },
  badgeText: { color: "#6B7280", fontWeight: "600" },

  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 10, backgroundColor: "#fff",
    borderTopWidth: 1, borderColor: "#E5E7EB", flexDirection: "row", gap: 10,
  },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  cancelText: { color: "#111", fontWeight: "700" },
  primaryBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
