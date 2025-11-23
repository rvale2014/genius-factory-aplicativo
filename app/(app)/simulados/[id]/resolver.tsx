// app/(app)/simulados/[id]/resolver.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ====== services esperados (ajuste os paths se necessário) ======
import QuestaoSimuladoCard from "@/components/questoes/QuestaoSimuladoCard";
import {
  avaliarPendentes,
  getSimuladoParaResolver, pausarSimulado, // POST /mobile/v1/qbank/simulados/:id/iniciar
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
    <View style={styles.progressSection}>
      <View style={styles.progressRow}>
        <Text style={styles.questionLabel}>Questão {paginaAtual}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>

      <View style={styles.dotRow}>
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

// ====== Tela principal ======
export default function ResolverSimuladoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(true); // ✅ ADICIONAR - Para controlar o timer quando a tela perde foco

  const [loading, setLoading] = useState(true);
  const [simulado, setSimulado] = useState<SimuladoResumo | null>(null);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  const respostasRef = useRef(respostas);
  useEffect(() => { respostasRef.current = respostas; }, [respostas]);
  
  // Ref para o ScrollView (para controlar scroll ao topo ao mudar de questão)
  const scrollViewRef = useRef<ScrollView>(null);

  // ✅ Rastreia se a tela está em foco (para controlar o timer)
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  // Carregar + iniciar (recarrega sempre que a tela ganha foco)
  useFocusEffect(
    useCallback(() => {
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
    }, [id])
  );

  // Timer - apenas roda quando a tela está em foco
  useEffect(() => {
    if (!isFocused) return; // ✅ ADICIONAR - Para o timer se não está em foco
    if (tempoRestante === null) return;
    if (tempoRestante <= 0) return;
    const t = setInterval(() => {
      setTempoRestante((v) => (v !== null ? v - 1 : null));
    }, 1000);
    return () => clearInterval(t);
  }, [tempoRestante, isFocused]); // ✅ ADICIONAR isFocused na dependência

  // Acabou tempo - apenas mostra alert se a tela está em foco
  useEffect(() => {
    if (!isFocused) return; // ✅ ADICIONAR - Não mostra alert se não está em foco
    if (tempoRestante !== 0) return;
    Alert.alert("Tempo esgotado", "Vamos concluir seu simulado.", [
      { text: "OK", onPress: concluir },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoRestante, isFocused]); // ✅ ADICIONAR isFocused na dependência

  // Scroll automático para o topo ao mudar de questão
  useEffect(() => {
    if (paginaAtual > 1) {
      // Aguarda um pequeno delay para garantir que o conteúdo foi renderizado
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  }, [paginaAtual]);

  const questaoAtual: Questao | null = useMemo(() => {
    if (!simulado) return null;
    const idx = paginaAtual - 1;
    return simulado.questoes[idx] ?? null;
  }, [simulado, paginaAtual]);

  const handleResponder = useCallback((questaoId: string, valor: any) => {
    setRespostas((prev) => ({ ...prev, [questaoId]: valor }));
  }, []);

  const handlePause = useCallback(() => {
    Alert.alert(
      "Pausar simulado",
      "Seu progresso será salvo e você poderá retomar depois. Deseja pausar?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Pausar",
          onPress: async () => {
            if (!simulado) return;
            
            try {
              // Calcula tempo gasto
              const tempoGasto = (simulado.tempoMinutos * 60) - (tempoRestante ?? 0);
              
              // Serializa respostas
              const payload: Record<string, string> = {};
              Object.entries(respostasRef.current).forEach(([questaoId, valor]) => {
                payload[questaoId] = serializarParaEnvio(valor);
              });
              
              // Chama API de pausar
              await pausarSimulado(
                simulado.id,
                tempoGasto,
                payload,
                paginaAtual - 1 // índice começa em 0
              );
              
              // Navega de volta
              router.back();
            } catch (e) {
              console.error('[Pausar simulado]', e);
              Alert.alert('Erro', 'Não foi possível pausar o simulado. Tente novamente.');
            }
          }
        }
      ]
    );
  }, [simulado, tempoRestante, paginaAtual, router]);

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
          <View style={styles.titleRow}>
            <View style={{ width: 24 }} />
            <Text style={styles.title} numberOfLines={1}>Simulado Genius Q-Bank</Text>
            <TouchableOpacity
              style={[styles.finishAction, finalizando && styles.finishActionDisabled]}
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
              {finalizando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={styles.finishActionText}>Concluir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Progresso */}
          <ProgressHeader
            questoes={simulado.questoes}
            respostas={respostas}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionItem} onPress={handlePause}>
              <Ionicons name="pause-outline" size={14} color="#6B7280" />
              <Text style={styles.actionText}>Pausar</Text>
            </TouchableOpacity>

            <View style={styles.actionItem}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.actionText}>
                {formatarHHMMSS(Math.max(0, tempoRestante ?? 0))}
              </Text>
            </View>
          </View>
        </View>

        {/* Corpo */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(16, insets.bottom) }}
          keyboardShouldPersistTaps="handled"
        >
          {questaoAtual ? (
            <>
              <View style={styles.card}>
                <View style={{ marginTop: 12 }}>
                  <QuestaoSimuladoCard
                    questao={questaoAtual}
                    resposta={respostas[questaoAtual.id]}
                    onChange={(valor) => handleResponder(questaoAtual.id, valor)}
                  />
                </View>
              </View>

              {/* Navegação inferior */}
              <View style={styles.navegacao}>
                {paginaAtual > 1 && (
                  <TouchableOpacity
                    onPress={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    style={styles.botaoSeta}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={20} color="#E91E63" />
                  </TouchableOpacity>
                )}

                {paginaAtual < simulado.questoes.length && (
                  <TouchableOpacity
                    onPress={() =>
                      setPaginaAtual((p) => Math.min(simulado.questoes.length, p + 1))
                    }
                    style={styles.botaoSeta}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-forward" size={20} color="#E91E63" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
              <Text style={{ color: "#6B7280" }}>Nenhuma questão disponível.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ====== Estilos ======
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 15, color: "#111827", textAlign: "center", flex: 1, fontFamily: "Inter-SemiBold" },

  progressSection: { marginTop: 4 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  questionLabel: { fontSize: 16, color: "#111827", fontFamily: "Inter-SemiBold" },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#E5E7EB", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#8B5CF6" },
  percentText: { fontSize: 12, color: "#8B5CF6", fontFamily: "Inter-SemiBold" },
  dotRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },

  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { color: "#6B7280", fontFamily: "Inter-Medium", fontSize: 12 },
  finishAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  finishActionText: { color: "#FFFFFF", fontFamily: "Inter-SemiBold", fontSize: 12 },
  finishActionDisabled: { opacity: 0.6 },

  dot: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#E5E7EB" },
  dotActive: { borderColor: "#A78BFA", backgroundColor: "#F5F3FF" },
  dotAnswered: { borderColor: "#7C3AED" },
  dotText: { fontSize: 12, color: "#374151" },
  dotTextActive: { color: "#5B21B6", fontWeight: "700" },

  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", padding: 14 },
  navegacao: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    gap: 12,
  },
  botaoSeta: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
});
