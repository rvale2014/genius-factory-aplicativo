// app/(app)/questoes/[id].tsx
import QuestaoPlayer from "@/components/qbank/QuestaoPlayer";
import { ResponderBar } from "@/components/qbank/ResponderBar";
import { useQuestaoResponder } from "@/components/qbank/useQuestaoResponder";
import { buscarQuestaoPorId, type QuestaoDetalhe } from "@/src/services/questoesService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Ctx = {
  // opcional, vindo da lista para habilitar navegação
  ids?: string[];     // ids da página atual (ou do bloco carregado)
  index?: number;     // posição atual dentro de ids
  filtros?: any;      // se quiser re-carregar vizinhos por filtros
};

export default function QuestaoDetalheScreen() {
  const { id, ctx } = useLocalSearchParams<{ id: string; ctx?: string }>();
  const router = useRouter();

  const navCtx: Ctx | null = useMemo(() => {
    try { return ctx ? JSON.parse(String(ctx)) as Ctx : null; } catch { return null; }
  }, [ctx]);

  const [questao, setQuestao] = useState<QuestaoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  // hook de resposta (passo 4)
  const responder = useQuestaoResponder();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const q = await buscarQuestaoPorId(String(id));
        if (active) setQuestao(q);
      } catch (e) {
        Alert.alert("Erro", "Falha ao carregar a questão.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const canPrev = !!navCtx?.ids && typeof navCtx?.index === "number" && navCtx.index > 0;
  const canNext = !!navCtx?.ids && typeof navCtx?.index === "number" && navCtx.index < (navCtx.ids!.length - 1);

  const goPrev = () => {
    if (!navCtx || !canPrev) return;
    const nextIndex = (navCtx.index! - 1);
    router.replace({
      pathname: "/questoes/[id]",
      params: { id: navCtx.ids![nextIndex], ctx: JSON.stringify({ ...navCtx, index: nextIndex }) }
    });
  };

  const goNext = () => {
    if (!navCtx || !canNext) return;
    const nextIndex = (navCtx.index! + 1);
    router.replace({
      pathname: "/questoes/[id]",
      params: { id: navCtx.ids![nextIndex], ctx: JSON.stringify({ ...navCtx, index: nextIndex }) }
    });
  };

  if (loading || !questao) {
    return (
      <SafeAreaView style={S.container}>
        <View style={S.center}><ActivityIndicator /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.container}>
      <ScrollView contentContainerStyle={S.scroll}>
        <Text style={S.code}>{questao.codigo}</Text>
        <Text style={S.tipo}>{questao.tipo}</Text>

        {/* Seu renderer unificado por tipo */}
        <QuestaoPlayer
          questao={questao}
          // o Player deve expor um "snapshot" com a resposta atual do aluno
          // (ex.: letras, textos, arrays, objetos)
          onChange={() => { /* opcional: track local */ }}
          refKey={`questao_${questao.id}`} // útil p/ cache local por id
        />
      </ScrollView>

      <ResponderBar
        canPrev={!!canPrev}
        canNext={!!canNext}
        onPrev={goPrev}
        onNext={goNext}
        onResponder={async (snapshot) => {
          await responder.enviar(questao, snapshot); // (4)
        }}
        loading={responder.loading}
        lastFeedback={responder.lastFeedback} // exibir “Acertou/Errou/Nota”
      />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  code: { fontWeight: "800", fontSize: 16, marginBottom: 6 },
  tipo: { color: "#6b7280", marginBottom: 12 },
});
