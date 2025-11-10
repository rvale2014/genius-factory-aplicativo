// app/(app)/simulados/[id]/resultado.tsx
import VisualizarQuestaoSheet from "@/components/sheets/VisualizarQuestaoSheet";
import { obterResultadoSimulado, refazerSimulado, ResultadoQuestao } from "@/src/services/simuladosResultadoService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { G, Path } from "react-native-svg";

function arcPath(cx:number, cy:number, r:number, start:number, end:number) {
  // start/end em radianos
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export default function ResultadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<{ id:string; nome:string; tempoMinutos:number; questoes:ResultadoQuestao[] } | null>(null);

  const [openSheet, setOpenSheet] = React.useState(false);
  const [idxAtual, setIdxAtual] = React.useState<number>(0);

  const idsOrdenados = React.useMemo(() => {
    if (!data?.questoes) return [];
    return [...data.questoes]
      .map((q, i) => ({ id: q.id, ordem: q.ordem ?? i }))
      .sort((a, b) => a.ordem - b.ordem)
      .map(q => q.id);
  }, [data]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const r = await obterResultadoSimulado(String(id));
        if (!active) return;
        setData(r);
      } catch (e) {
        console.error(e);
        alert("Não foi possível carregar o resultado.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading || !data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const total = data.questoes.length;
  const acertos = data.questoes.filter(q => q.acertou).length;
  const erros = Math.max(0, total - acertos);
  const perc = total > 0 ? Math.round((acertos / total) * 100) : 0;

  const temDissertPend = data.questoes.some(q => q.tipo === "dissertativa" && q.avaliacaoStatus !== "ok");
  const totalDissert = data.questoes.filter(q => q.tipo === "dissertativa").length;
  const corrigidas = data.questoes.filter(q => q.tipo === "dissertativa" && q.avaliacaoStatus === "ok").length;
  const prog = totalDissert > 0 ? Math.round((corrigidas / totalDissert) * 100) : 0;

  // donut (dois arcos)
  const size = 180, cx = size/2, cy=cx, r=70;
  const start = -Math.PI/2;
  const endAcertos = start + 2*Math.PI*(total ? acertos/total : 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{data.nome}</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={[{key:"content"}]}
        keyExtractor={(it) => it.key}
        renderItem={() => (
          <View style={{ paddingHorizontal: 16, paddingBottom: (insets.bottom || 16) + 100 }}>
            <View style={styles.card}>
              <Text style={styles.h}>Dados gerais</Text>
              <View style={styles.row}>
                <View style={styles.kpi}>
                  <Text style={styles.kpiBig}>{total}</Text>
                  <Text style={styles.kpiCap}>Questões</Text>
                </View>
                <View style={styles.kpi}>
                  <Text style={[styles.kpiBig, { color: "#10B981" }]}>{acertos}</Text>
                  <Text style={styles.kpiCap}>Acertos</Text>
                </View>
                <View style={styles.kpi}>
                  <Text style={[styles.kpiBig, { color: "#EF4444" }]}>{erros}</Text>
                  <Text style={styles.kpiCap}>Erros</Text>
                </View>
              </View>

              <View style={{ alignItems:"center", marginTop: 8 }}>
                <Svg width={size} height={size}>
                  <G>
                    {/* arco erros (fundo) */}
                    <Path d={arcPath(cx, cy, r, endAcertos, start + 2*Math.PI - 0.0001)} stroke="#FEE2E2" strokeWidth={16} fill="none" />
                    {/* arco acertos */}
                    <Path d={arcPath(cx, cy, r, start, endAcertos)} stroke="#A7F3D0" strokeWidth={16} fill="none" />
                  </G>
                </Svg>
                <Text style={{ marginTop: -cx, fontSize: 24, fontWeight: "800" }}>{perc}%</Text>
                <Text style={{ color: "#6B7280" }}>Proporção de acertos</Text>
              </View>

              {temDissertPend && (
                <View style={styles.warn}>
                  <Text style={{ fontWeight:"700", color:"#854D0E" }}>Corrigindo questões dissertativas…</Text>
                  <View style={styles.progress}>
                    <View style={[styles.progressBar, { width: `${prog}%` }]} />
                  </View>
                  <Text style={{ color:"#6B7280", fontSize:12 }}>{corrigidas}/{totalDissert} corrigidas</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.h}>Comentários das questões</Text>
              <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginTop: 8 }}>
                {idsOrdenados.map((qid, i) => {
                  const q = data.questoes.find(x => x.id === qid)!;
                  const pend = q.tipo === "dissertativa" && q.avaliacaoStatus !== "ok";
                  const color =
                    q.tipo === "dissertativa"
                      ? (pend ? "#E5E7EB" : q.acertou ? "#DCFCE7" : "#FEE2E2")
                      : (q.acertou ? "#DCFCE7" : "#FEE2E2");
                  const txt =
                    q.tipo === "dissertativa"
                      ? (pend ? "#4B5563" : q.acertou ? "#166534" : "#991B1B")
                      : (q.acertou ? "#166534" : "#991B1B");
                  return (
                    <TouchableOpacity
                      key={qid}
                      onPress={() => { setIdxAtual(i); setOpenSheet(true); }}
                      style={[styles.chip, { backgroundColor: color }]}
                    >
                      <Text style={{ color: txt, fontWeight:"700" }}>{q.numero ?? (i+1)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection:"row", gap:10 }}>
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline]}
                onPress={async () => {
                  try {
                    const r = await refazerSimulado(String(id));
                    router.replace(`/simulados/${r.novoSimuladoId}/resolver`);
                  } catch (e) {
                    console.error(e);
                    alert("Erro ao refazer o simulado.");
                  }
                }}
              >
                <Text style={[styles.btnTxt, { color:"#7C3AED" }]}>Refazer Simulado</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btn, { backgroundColor:"#10B981" }]} onPress={() => router.replace("/home")}>
                <Text style={[styles.btnTxt, { color:"#fff" }]}>Encerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Bottom Sheet de correção */}
      <VisualizarQuestaoSheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        simuladoId={data.id}
        questaoId={idsOrdenados[idxAtual]}
        hasPrev={idxAtual > 0}
        hasNext={idxAtual < idsOrdenados.length - 1}
        onPrev={() => setIdxAtual((i) => Math.max(0, i - 1))}
        onNext={() => setIdxAtual((i) => Math.min(idsOrdenados.length - 1, i + 1))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:"#fff" },
  center: { flex:1, alignItems:"center", justifyContent:"center" },
  header: { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingBottom:6 },
  backBtn: { width:22, height:22, alignItems:"center", justifyContent:"center" },
  title: { flex:1, textAlign:"center", fontSize:18, fontWeight:"700", color:"#111" },

  card: { borderWidth:1, borderColor:"#E5E7EB", borderRadius:14, backgroundColor:"#fff", padding:16, marginHorizontal:16, marginTop:12 },
  h: { fontSize:16, fontWeight:"800", color:"#111827", marginBottom:8 },

  row: { flexDirection:"row", justifyContent:"space-between" },
  kpi: { alignItems:"center", flex:1 },
  kpiBig: { fontSize:22, fontWeight:"800", color:"#111827" },
  kpiCap: { color:"#6B7280" },

  warn: { marginTop:12, borderWidth:1, borderColor:"#FDE68A", backgroundColor:"#FEFCE8", padding:12, borderRadius:10 },
  progress: { height:8, borderRadius:999, backgroundColor:"#FEF3C7", overflow:"hidden", marginTop:8, marginBottom:4 },
  progressBar: { height:8, backgroundColor:"#F59E0B" },

  chip: { width:40, height:40, borderRadius:20, alignItems:"center", justifyContent:"center" },

  btn: { flex:1, height:48, borderRadius:12, alignItems:"center", justifyContent:"center", marginHorizontal:16, marginTop:16 },
  btnOutline: { backgroundColor:"#fff", borderWidth:1, borderColor:"#E5E7EB" },
  btnTxt: { fontWeight:"800" },
});
