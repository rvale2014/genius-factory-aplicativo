// app/(app)/simulados/[id]/resolver.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ====== services esperados (ajuste os paths se necessário) ======
import {
  avaliarPendentes,
  getSimuladoParaResolver, // POST /mobile/v1/qbank/simulados/:id/iniciar
  responderSimulado, // POST /mobile/v1/qbank/simulados/:id/responder
} from "@/src/services/simuladosExecService";
import { consumeResolverCache } from "@/src/stores/simuladoResolverCache";

// ====== Tipos ======
type TipoQuestao =
  | "multipla_escolha"
  | "certa_errada"
  | "objetiva_curta"
  | "dissertativa"
  | "bloco_rapido"
  | "ligar_colunas"
  | "completar"
  | "completar_topo"
  | "tabela"
  | "selecao_multipla"
  | "colorir_figura";

type Questao = {
  id: string;
  tipo: TipoQuestao;
  enunciado: string;
  alternativas?: string[];
  imagensAlternativas?: string[];
  imagemUrl?: string | null;
  blocoRapido?: any;
  ligarColunas?: any;
  conteudo?: any;
  resposta?: any; // pode vir preenchida (retomar simulado)
};

type SimuladoResumo = {
  id: string;
  nome: string;
  tempoMinutos: number;
  tempoGastoEmSegundos?: number;
  ultimaQuestaoIndex?: number;
  questoes: Questao[];
};

// ====== Helpers ======
function formatarHHMMSS(segundos: number) {
  const h = Math.floor(segundos / 3600).toString().padStart(2, "0");
  const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(segundos % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function isRespondida(tipo: TipoQuestao, resposta: any) {
  switch (tipo) {
    case "multipla_escolha":
    case "certa_errada":
      return resposta !== null && resposta !== undefined && String(resposta).trim() !== "";
    case "objetiva_curta":
    case "dissertativa":
      return typeof resposta === "string" && resposta.trim().length > 0;
    case "bloco_rapido":
      return Array.isArray(resposta) && resposta.length > 0;
    case "ligar_colunas":
      return (
        resposta &&
        typeof resposta === "object" &&
        (Object.keys(resposta).length > 0 ||
          (Array.isArray(resposta._colunaB) && resposta._colunaB.length > 0))
      );
    case "completar":
      return Array.isArray(resposta) && resposta.some(r => r && String(r).trim().length > 0);
    case "completar_topo":
      return (
        resposta &&
        typeof resposta === "object" &&
        Array.isArray(resposta.respostasAluno) &&
        resposta.respostasAluno.some((r: any) => r?.valor && r.valor.trim().length > 0)
      );
    case "tabela":
      return resposta && ((Array.isArray(resposta) && resposta.length > 0) || (typeof resposta === "object" && Object.keys(resposta).length > 0));
    case "selecao_multipla":
      return resposta && typeof resposta === "object" && Array.isArray(resposta.selecionadas) && resposta.selecionadas.length > 0;
    case "colorir_figura":
      return resposta && typeof resposta === "object" && Object.keys(resposta).length > 0;
    default:
      return false;
  }
}

// Serializa mesma regra do seu web
function serializarParaEnvio(valor: any): string {
  if (typeof valor === "number") return String.fromCharCode(65 + valor); // índice -> A/B/C...
  if (typeof valor === "string") return valor;
  try {
    return JSON.stringify(valor);
  } catch {
    return "";
  }
}

// ====== UI: Barra de progresso + navegação compacta ======
function ProgressHeader({
  questoes,
  respostas,
  paginaAtual,
  setPaginaAtual,
}: {
  questoes: Questao[];
  respostas: Record<string, any>;
  paginaAtual: number;
  setPaginaAtual: (n: number) => void;
}) {
  const respondidas = questoes.reduce((acc, q) => acc + (isRespondida(q.tipo, respostas[q.id]) ? 1 : 0), 0);
  const total = questoes.length;
  const percent = total > 0 ? Math.round((respondidas / total) * 100) : 0;

  return (
    <View style={{ marginVertical: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: "#374151" }}>{respondidas}/{total} respondidas</Text>
        <Text style={{ fontSize: 12, color: "#374151", fontWeight: "700" }}>{percent}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: "#E5E7EB", borderRadius: 999 }}>
        <View style={{ width: `${percent}%`, backgroundColor: "#8B5CF6", borderRadius: 999, height: 8 }} />
      </View>

      {/* Bolinhas com atalho de navegação */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {questoes.map((q, i) => {
          const ok = isRespondida(q.tipo, respostas[q.id]);
          const active = i + 1 === paginaAtual;
          return (
            <TouchableOpacity
              key={q.id}
              onPress={() => setPaginaAtual(i + 1)}
              style={[
                styles.dot,
                active && styles.dotActive,
                ok && styles.dotAnswered,
              ]}
            >
              <Text style={[styles.dotText, active && styles.dotTextActive]}>{i + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ====== UI: Render mínimo de cada tipo (substitua pelos seus componentes quando quiser) ======
function RespostaSimuladoMobile({
  questao,
  resposta,
  onResponder,
}: {
  questao: Questao;
  resposta: any;
  onResponder: (v: any) => void;
}) {
  // Múltipla escolha / Certa-errada (índice 0..n)
  if (questao.tipo === "multipla_escolha" || questao.tipo === "certa_errada") {
    const alternativas = Array.isArray(questao.alternativas) && questao.alternativas.length > 0
      ? questao.alternativas
      : questao.tipo === "certa_errada"
        ? ["Certo", "Errado"]
        : [];

    return (
      <View style={{ gap: 8 }}>
        {alternativas.map((alt, idx) => {
          const selected = resposta === idx;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onResponder(idx)}
              style={[
                styles.altBtn,
                selected && styles.altBtnSelected,
              ]}
            >
              <Text style={[styles.altText, selected && styles.altTextSelected]}>
                {String.fromCharCode(65 + idx)}. {alt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (questao.tipo === "objetiva_curta") {
    return (
      <TextInput
        value={typeof resposta === "string" ? resposta : ""}
        onChangeText={onResponder}
        placeholder="Digite sua resposta"
        style={styles.textInput}
        autoCapitalize="sentences"
      />
    );
  }

  if (questao.tipo === "dissertativa") {
    return (
      <TextInput
        value={typeof resposta === "string" ? resposta : ""}
        onChangeText={onResponder}
        placeholder="Digite sua resposta dissertativa..."
        style={[styles.textInput, { minHeight: 120, textAlignVertical: "top", paddingTop: 12 }]}
        multiline
      />
    );
  }

  // Tipos ricos: coloque seus componentes reais quando preferir.
  if (questao.tipo === "bloco_rapido") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>[bloco_rapido] — conecte o seu componente móvel aqui.</Text>
      </View>
    );
  }
  if (questao.tipo === "ligar_colunas") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>[ligar_colunas] — conecte o seu componente móvel aqui.</Text>
      </View>
    );
  }
  if (questao.tipo === "completar") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>[completar] — conecte o seu componente móvel aqui.</Text>
      </View>
    );
  }
  if (questao.tipo === "completar_topo") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>[completar_topo] — conecte o seu componente móvel aqui.</Text>
      </View>
    );
  }
  if (questao.tipo === "tabela") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>[tabela] — conecte o seu componente móvel aqui.</Text>
      </View>
    );
  }
  if (questao.tipo === "selecao_multipla") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>[selecao_multipla] — conecte o seu componente móvel aqui.</Text>
      </View>
    );
  }
  if (questao.tipo === "colorir_figura") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>[colorir_figura] — conecte o seu componente móvel aqui.</Text>
      </View>
    );
  }

  return <Text style={{ color: "#6B7280" }}>Tipo não suportado</Text>;
}

// ====== Tela principal ======
export default function ResolverSimuladoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [simulado, setSimulado] = useState<SimuladoResumo | null>(null);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  const respostasRef = useRef(respostas);
  useEffect(() => { respostasRef.current = respostas; }, [respostas]);

  // Carregar + iniciar
  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) return;
      try {
        setLoading(true);

        let dados = consumeResolverCache(String(id)) as SimuladoResumo | undefined;
        if (!dados) {
          dados = (await getSimuladoParaResolver(String(id))) as SimuladoResumo;
        }
        if (!dados) throw new Error("Simulado não disponível para resolução.");
        if (!active) return;

        setSimulado(dados);

        // timer
        const total = (dados.tempoMinutos ?? 0) * 60;
        const gasto = dados.tempoGastoEmSegundos ?? 0;
        setTempoRestante(Math.max(0, total - gasto));

        // página inicial (retomar)
        const idx = dados.ultimaQuestaoIndex ?? 0;
        setPaginaAtual(Math.max(1, Math.min(dados.questoes.length, Math.floor(idx) + 1)));

        // respostas iniciais (retomar sessão)
        const iniciais: Record<string, any> = {};
        (dados.questoes as Questao[]).forEach((q) => {
          if (!q.resposta) return;
          if ((q.tipo === "multipla_escolha" || q.tipo === "certa_errada") && typeof q.resposta === "string") {
            const letra = q.resposta.trim().toUpperCase();
            const index = letra.length === 1 ? letra.charCodeAt(0) - 65 : -1;
            const limite = Array.isArray(q.alternativas) ? q.alternativas.length : undefined;
            if (index >= 0 && (limite === undefined || index < limite)) {
              iniciais[q.id] = index;
            }
          } else if (q.tipo === "objetiva_curta" || q.tipo === "dissertativa") {
            iniciais[q.id] = q.resposta;
          } else {
            try { iniciais[q.id] = JSON.parse(q.resposta); } catch {}
          }
        });
        setRespostas(iniciais);
      } catch (e) {
        Alert.alert("Erro", "Falha ao carregar o simulado.");
        setSimulado(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  // Timer
  useEffect(() => {
    if (tempoRestante === null) return;
    if (tempoRestante <= 0) return;
    const t = setInterval(() => {
      setTempoRestante((v) => (v !== null ? v - 1 : null));
    }, 1000);
    return () => clearInterval(t);
  }, [tempoRestante]);

  // Acabou tempo
  useEffect(() => {
    if (tempoRestante !== 0) return;
    Alert.alert("Tempo esgotado", "Vamos concluir seu simulado.", [
      { text: "OK", onPress: concluir },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoRestante === 0]);

  const questaoAtual: Questao | null = useMemo(() => {
    if (!simulado) return null;
    const idx = paginaAtual - 1;
    return simulado.questoes[idx] ?? null;
  }, [simulado, paginaAtual]);

  const handleResponder = useCallback((questaoId: string, valor: any) => {
    setRespostas((prev) => ({ ...prev, [questaoId]: valor }));
  }, []);

  async function concluir() {
    if (!simulado) return;
    try {
      setFinalizando(true);

      // monta payload no mesmo formato esperado pela sua rota web (chave = questaoId, valor serializado)
      const payload: Record<string, string> = {};
      Object.entries(respostasRef.current).forEach(([questaoId, valor]) => {
        payload[questaoId] = serializarParaEnvio(valor);
      });

      await responderSimulado(simulado.id, payload);

      // se houver dissertativas, roda polling de avaliação
      const temDissertativa = simulado.questoes.some((q) => q.tipo === "dissertativa");
      if (temDissertativa) {
        // polling simples: tenta até zerar 'restantes' com backoff leve
        // evita loop infinito com um teto de iterações
        for (let i = 0; i < 12; i++) {
          const r = await avaliarPendentes(simulado.id);
          if (!r || r.restantes === 0) break;
          await new Promise((res) => setTimeout(res, 1200));
        }
      }

      // navega para resultado
      router.replace(`/simulados/${simulado.id}/resultado`);
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Não foi possível concluir o simulado agora. Tente novamente.");
    } finally {
      setFinalizando(false);
    }
  }

  if (loading || !simulado) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#6B7280" }}>Carregando simulado…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
          <Text style={styles.title}>{simulado.nome}</Text>

          <View style={styles.headerRow}>
            <View style={styles.timerPill}>
              <Ionicons name="time-outline" size={16} color="#7C3AED" />
              <Text style={styles.timerText}>
                {formatarHHMMSS(Math.max(0, tempoRestante ?? 0))}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.finishBtn}
              onPress={() => {
                Alert.alert(
                  "Encerrar simulado?",
                  "Questões não respondidas contarão como erro.",
                  [
                    { text: "Continuar", style: "cancel" },
                    { text: finalizando ? "Concluindo…" : "Encerrar", onPress: concluir },
                  ]
                );
              }}
              disabled={finalizando}
            >
              {finalizando ? <ActivityIndicator /> : <Text style={styles.finishText}>Concluir</Text>}
            </TouchableOpacity>
          </View>

          {/* Progresso */}
          <ProgressHeader
            questoes={simulado.questoes}
            respostas={respostas}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
          />
        </View>

        {/* Corpo */}
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: Math.max(16, insets.bottom) }}>
          {questaoAtual ? (
            <View style={styles.card}>
              <Text style={styles.qHeader}>
                Questão {paginaAtual} de {simulado.questoes.length}
              </Text>
              <Text style={styles.enunciado}>{questaoAtual.enunciado}</Text>

              <View style={{ marginTop: 12 }}>
                <RespostaSimuladoMobile
                  questao={questaoAtual}
                  resposta={respostas[questaoAtual.id]}
                  onResponder={(v) => handleResponder(questaoAtual.id, v)}
                />
              </View>

              {/* Navegação inferior */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  onPress={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  style={[styles.navBtn, paginaAtual <= 1 && { opacity: 0.5 }]}
                  disabled={paginaAtual <= 1}
                >
                  <Ionicons name="chevron-back" size={18} color="#7C3AED" />
                  <Text style={styles.navText}>Anterior</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setPaginaAtual((p) => Math.min(simulado.questoes.length, p + 1))
                  }
                  style={[
                    styles.navBtn,
                    paginaAtual >= simulado.questoes.length && { opacity: 0.5 },
                  ]}
                  disabled={paginaAtual >= simulado.questoes.length}
                >
                  <Text style={styles.navText}>Próxima</Text>
                  <Ionicons name="chevron-forward" size={18} color="#7C3AED" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
              <Text style={{ color: "#6B7280" }}>Nenhuma questão disponível.</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ====== Estilos ======
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F5F3FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  timerText: { color: "#7C3AED", fontWeight: "700" },
  finishBtn: { backgroundColor: "#7C3AED", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  finishText: { color: "#fff", fontWeight: "800" },

  dot: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#E5E7EB" },
  dotActive: { borderColor: "#A78BFA", backgroundColor: "#F5F3FF" },
  dotAnswered: { borderColor: "#7C3AED" },
  dotText: { fontSize: 12, color: "#374151" },
  dotTextActive: { color: "#5B21B6", fontWeight: "700" },

  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", padding: 14 },
  qHeader: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  enunciado: { fontSize: 16, color: "#111827", fontWeight: "600" },

  altBtn: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" },
  altBtnSelected: { borderColor: "#7C3AED", backgroundColor: "#F5F3FF" },
  altText: { color: "#111827" },
  altTextSelected: { color: "#5B21B6", fontWeight: "700" },

  textInput: { borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#111827" },

  placeholder: { borderWidth: 1, borderColor: "#E5E7EB", borderStyle: "dashed", borderRadius: 10, padding: 14, backgroundColor: "#FAFAFA" },
  placeholderText: { color: "#6B7280", fontSize: 12 },

  navRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: "#FFFFFF" },
  navText: { color: "#7C3AED", fontWeight: "700" },
});
