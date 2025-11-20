// app/(app)/simulados/[id]/resultado.tsx
import VisualizarQuestaoResultadoSheet from "@/components/sheets/VisualizarQuestaoSimuladoSheet";
import { api } from "@/src/lib/api";
import { invalidarCacheCaminho } from "@/src/services/caminhoService";
import { obterResultadoSimulado, refazerSimulado, ResultadoQuestao } from "@/src/services/simuladosResultadoService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";

function arcPath(cx:number, cy:number, r:number, start:number, end:number) {
  // start/end em radianos
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function formatTempo(minutos: number) {
  const totalSegundos = Math.max(0, Math.round(minutos * 60));
  const h = Math.floor(totalSegundos / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSegundos % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSegundos % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function coinsPorPercentual(percentual: number) {
  if (percentual >= 90) return 300;
  if (percentual >= 80) return 200;
  if (percentual >= 70) return 100;
  return 50;
}

function GeniusCoinsIcon({ size = 24 }: { size?: number }) {
  const baseWidth = 29;
  const baseHeight = 31;
  const scale = size / baseWidth;
  const height = baseHeight * scale;

  return (
    <Svg width={size} height={height} viewBox="0 0 29 31" fill="none">
      <Circle cx="14.5" cy="16.5" r="14.5" fill="#6C4710" />
      <Circle cx="14.5" cy="14.5" r="13.5" fill="#FFDE88" stroke="url(#geniusCoinGradient)" strokeWidth="2" />
      <Path
        d="M17.355 11.8237C17.2743 11.5433 17.161 11.2955 17.015 11.0804C16.8691 10.8615 16.6905 10.6771 16.4792 10.5273C16.2718 10.3737 16.0336 10.2565 15.7648 10.1758C15.4997 10.0952 15.2059 10.0549 14.8832 10.0549C14.2802 10.0549 13.7501 10.2047 13.293 10.5043C12.8398 10.8039 12.4864 11.2398 12.2329 11.8122C11.9794 12.3806 11.8526 13.0759 11.8526 13.8979C11.8526 14.7199 11.9774 15.4189 12.2271 15.9951C12.4768 16.5713 12.8302 17.0111 13.2872 17.3145C13.7443 17.6141 14.284 17.7639 14.9063 17.7639C15.4709 17.7639 15.953 17.6641 16.3524 17.4643C16.7558 17.2607 17.063 16.9746 17.2743 16.6058C17.4894 16.2371 17.597 15.8011 17.597 15.2979L18.104 15.3728H15.0618V13.4945H19.9996V14.9811C19.9996 16.0181 19.7806 16.9093 19.3427 17.6545C18.9048 18.3958 18.3018 18.9681 17.5336 19.3714C16.7654 19.7709 15.8857 19.9706 14.8947 19.9706C13.7885 19.9706 12.8167 19.7267 11.9794 19.2389C11.142 18.7472 10.489 18.0501 10.0204 17.1474C9.55563 16.2409 9.32324 15.1654 9.32324 13.9209C9.32324 12.9645 9.46152 12.1118 9.73808 11.3627C10.0185 10.6099 10.4103 9.97227 10.9135 9.44988C11.4166 8.92749 12.0024 8.52994 12.6708 8.25722C13.3391 7.9845 14.0631 7.84814 14.8429 7.84814C15.5112 7.84814 16.1335 7.94609 16.7097 8.14199C17.2858 8.33404 17.7967 8.60676 18.2423 8.96014C18.6917 9.31352 19.0585 9.73412 19.3427 10.2219C19.627 10.7059 19.8094 11.2398 19.8901 11.8237H17.355Z"
        fill="#C0780C"
      />
      <Defs>
        <LinearGradient id="geniusCoinGradient" x1="21.5" y1="-5.5" x2="0" y2="50" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#F0A028" />
          <Stop offset="1" stopColor="#C0780C" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

export default function ResultadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<{ id:string; nome:string; tempoMinutos:number; questoes:ResultadoQuestao[] } | null>(null);

  const [openSheet, setOpenSheet] = React.useState(false);
  const [idxAtual, setIdxAtual] = React.useState<number>(0);

  // ✅ NOVO: Contexto de trilha
  const [contextoTrilha, setContextoTrilha] = React.useState<{
    trilhaId: string;
    caminhoId: string;
    blocoId: string;
    atividadeId: string;
  } | null>(null);
  const [encerrando, setEncerrando] = React.useState(false);

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
        
        // ✅ SEMPRE LIMPA O CONTEXTO PRIMEIRO
        setContextoTrilha(null);
        
        const contextoKey = `@geniusfactory:simulado-contexto-${id}`;
        console.log('[ResultadoSimulado] Buscando contexto com chave:', contextoKey);
        
        const contextoRaw = await AsyncStorage.getItem(contextoKey);
        console.log('[ResultadoSimulado] Contexto raw encontrado:', contextoRaw);
        
        if (contextoRaw) {
          try {
            const contexto = JSON.parse(contextoRaw);
            console.log('[ResultadoSimulado] Contexto parseado:', contexto);
            
            // Valida se o contexto tem os campos necessários e válidos
            if (
              contexto &&
              typeof contexto === 'object' &&
              contexto.trilhaId &&
              contexto.caminhoId &&
              contexto.blocoId &&
              contexto.atividadeId &&
              typeof contexto.trilhaId === 'string' &&
              typeof contexto.caminhoId === 'string' &&
              typeof contexto.blocoId === 'string' &&
              typeof contexto.atividadeId === 'string'
            ) {
              console.log('[ResultadoSimulado] ✅ Contexto válido! Modo trilha ativado');
              setContextoTrilha(contexto);
            } else {
              console.warn('[ResultadoSimulado] ❌ Contexto inválido, removendo:', contexto);
              await AsyncStorage.removeItem(contextoKey);
            }
          } catch (e) {
            console.error('[ResultadoSimulado] ❌ Erro ao parsear contexto:', e);
            await AsyncStorage.removeItem(contextoKey);
          }
        } else {
          console.log('[ResultadoSimulado] ℹ️ Nenhum contexto encontrado - modo Q-Bank normal');
        }
        
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
  const coinsBase = 50;
  const coinsTarget = coinsPorPercentual(perc);
  const coinsExtra = Math.max(coinsTarget - coinsBase, 0);
  const coinsReward = temDissertPend ? coinsBase : coinsTarget;

  // ✅ NOVO: Encerrar simulado de trilha
  async function encerrarSimuladoTrilha() {
    if (!contextoTrilha) return;
    
    try {
      setEncerrando(true);
      
      // Chama API de concluir
      const { data: resposta } = await api.post<{
        ok: boolean;
        caminhoId: string;
        conquistasDesbloqueadas: Array<{
          titulo: string;
          nivel: number;
          categoria: string;
          imagemUrl: string;
        }>;
      }>(
        `/mobile/v1/trilhas/${contextoTrilha.trilhaId}/simulados/${contextoTrilha.atividadeId}/concluir`
      );

      // ✅ Deixar o contexto no AsyncStorage para permitir revisão futura
      
      // Invalida cache do caminho
      await invalidarCacheCaminho(contextoTrilha.trilhaId, contextoTrilha.caminhoId);
      
      // TODO: Mostrar modal de conquistas se houver
      if (resposta.conquistasDesbloqueadas?.length > 0) {
        // Conquistas desbloqueadas serão mostradas no futuro
      }

      // Navega para o caminho
      router.replace(`/trilhas/${contextoTrilha.trilhaId}/caminhos/${contextoTrilha.caminhoId}`);
    } catch (error: any) {
      console.error('[ResultadoSimulado] Erro ao encerrar:', error);
      Alert.alert('Erro', error?.response?.data?.error || 'Não foi possível encerrar o simulado');
    } finally {
      setEncerrando(false);
    }
  }

  // ✅ NOVO: Botão "Encerrar" adaptado
  function renderBotaoEncerrar() {
    if (!contextoTrilha) {
      // Modo Q-Bank normal: vai para dashboard
      return (
        <TouchableOpacity
          style={styles.footerPrimary}
          onPress={() => router.replace("/dashboard")}
        >
          <Text style={styles.footerPrimaryText}>Encerrar</Text>
        </TouchableOpacity>
      );
    }

    // Modo Trilha: chama API de concluir
    return (
      <TouchableOpacity
        style={[styles.footerPrimary, encerrando && { opacity: 0.6 }]}
        onPress={encerrarSimuladoTrilha}
        disabled={encerrando}
      >
        {encerrando ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.footerPrimaryText}>Encerrar</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (contextoTrilha) {
              router.replace(`/trilhas/${contextoTrilha.trilhaId}/caminhos/${contextoTrilha.caminhoId}`);
            } else {
              router.replace('/dashboard');
            }
          }} 
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {contextoTrilha ? 'Simulado da Trilha' : 'Simulado Genius Q-Bank'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <ResumoCard
          total={total}
          acertos={acertos}
          erros={erros}
          tempoMinutos={data.tempoMinutos}
          coinsReward={coinsReward}
          coinsExtra={coinsExtra}
          pendenteDissertativas={temDissertPend}
        />

        {totalDissert > 0 && (
          <DissertativasStatusCard
            pendente={temDissertPend}
            corrigidas={corrigidas}
            total={totalDissert}
            progresso={prog}
          />
        )}

        <DesempenhoCard
          perc={perc}
          acertos={acertos}
          erros={erros}
          total={total}
          donutConfig={{ size, cx, cy, r, start, endAcertos }}
        />

        <ComentariosCard
          questoes={data.questoes}
          idsOrdenados={idsOrdenados}
          onPressQuestao={(index) => { setIdxAtual(index); setOpenSheet(true); }}
        />

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.footerOutline}
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
            <Text style={styles.footerOutlineText}>Refazer Simulado</Text>
          </TouchableOpacity>

          {/* ✅ SUBSTITUIR O BOTÃO "Encerrar" POR ESTA CHAMADA */}
          {renderBotaoEncerrar()}
        </View>
      </ScrollView>

      {/* Bottom Sheet de correção */}
      <VisualizarQuestaoResultadoSheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        simuladoId={data.id}
        questaoId={idsOrdenados[idxAtual]}
        hasPrev={idxAtual > 0}
        hasNext={idxAtual < idsOrdenados.length - 1}
        onPrev={() => setIdxAtual((i) => Math.max(0, i - 1))}
        onNext={() => setIdxAtual((i) => Math.min(idsOrdenados.length - 1, i + 1))}
      />
    </SafeAreaView>
  );
}

function ResumoCard({
  total,
  acertos,
  erros,
  tempoMinutos,
  coinsReward = 0,
  coinsExtra = 0,
  pendenteDissertativas = false,
}: {
  total: number;
  acertos: number;
  erros: number;
  tempoMinutos: number;
  coinsReward?: number;
  coinsExtra?: number;
  pendenteDissertativas?: boolean;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTopRow}>
        <View style={styles.summaryTopItem}>
          <View style={styles.summaryIcon}>
            <Ionicons name="document-text-outline" size={18} color="#312E81" />
          </View>
          <View>
            <Text style={styles.summaryTopLabel}>Número de Questões</Text>
            <Text style={styles.summaryTopValue}>{total}</Text>
          </View>
        </View>

        <View style={styles.summaryTopItem}>
          <View style={styles.summaryIcon}>
            <Ionicons name="time-outline" size={18} color="#312E81" />
          </View>
          <View>
            <Text style={styles.summaryTopLabel}>Tempo</Text>
            <Text style={styles.summaryTopValue}>{formatTempo(tempoMinutos)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryScoreRow}>
        <View style={[styles.scoreCard, { backgroundColor: "#ECFDF3" }]}>
          <View>
            <Text style={[styles.scoreValue, { color: "#047857" }]}>{acertos}</Text>
            <Text style={[styles.scoreLabel, { color: "#047857" }]}>Acertos</Text>
          </View>
          <View style={[styles.scoreIcon, { borderColor: "#10B981" }]}>
            <Ionicons name="checkmark" size={14} color="#10B981" />
          </View>
        </View>
        <View style={[styles.scoreCard, { backgroundColor: "#FEF2F2" }]}>
          <View>
            <Text style={[styles.scoreValue, { color: "#B91C1C" }]}>{erros}</Text>
            <Text style={[styles.scoreLabel, { color: "#B91C1C" }]}>Erros</Text>
          </View>
          <View style={[styles.scoreIcon, { borderColor: "#EF4444" }]}>
            <Ionicons name="close" size={14} color="#EF4444" />
          </View>
        </View>
      </View>

      {coinsReward > 0 && (
        <View style={[styles.rewardCard, pendenteDissertativas && styles.rewardCardPending]}>
          <View>
            <Text style={styles.rewardTitle}>Recebeu {coinsReward} Genius Coins</Text>
            {pendenteDissertativas && (
              <Text style={styles.rewardSubtitle}>
                Fase de conclusão registrada. Bônus final será aplicado após corrigirmos as questões discursivas.
              </Text>
            )}
          </View>
          <View style={styles.rewardIconCircle}>
            <GeniusCoinsIcon size={20} />
          </View>
        </View>
      )}
    </View>
  );
}

function DissertativasStatusCard({
  pendente,
  corrigidas,
  total,
  progresso,
}: {
  pendente: boolean;
  corrigidas: number;
  total: number;
  progresso: number;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>Correção das discursivas</Text>
      <View style={styles.dissertStatusWrapper}>
        <Text style={styles.dissertStatusText}>
          {pendente
            ? "Estamos corrigindo suas questões discursivas. Assim que finalizarmos, recalcularemos sua nota final."
            : "Todas as questões discursivas foram corrigidas e sua nota final está consolidada."}
        </Text>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: `${pendente ? progresso : 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {pendente ? `${corrigidas}/${total} corrigidas` : `${total}/${total} corrigidas`}
        </Text>
      </View>
    </View>
  );
}

function DesempenhoCard({
  perc,
  acertos,
  erros,
  total,
  donutConfig,
}: {
  perc: number;
  acertos: number;
  erros: number;
  total: number;
  donutConfig: { size: number; cx: number; cy: number; r: number; start: number; endAcertos: number };
}) {
  const [tab, setTab] = React.useState<"acertos" | "respostas">("acertos");

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Desempenho</Text>
      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segmentButton, tab === "acertos" && styles.segmentButtonActive]}
          onPress={() => setTab("acertos")}
        >
          <Text style={[styles.segmentText, tab === "acertos" && styles.segmentTextActive]}>
            Proporção de acertos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, tab === "respostas" && styles.segmentButtonActive]}
          onPress={() => setTab("respostas")}
        >
          <Text style={[styles.segmentText, tab === "respostas" && styles.segmentTextActive]}>
            Quantidade de respostas
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "acertos" ? (
        <View style={styles.donutWrapper}>
          <Svg width={donutConfig.size} height={donutConfig.size}>
            <G>
              {perc < 100 && (
                <Path
                  d={arcPath(
                    donutConfig.cx,
                    donutConfig.cy,
                    donutConfig.r,
                    donutConfig.endAcertos,
                    donutConfig.start + 2 * Math.PI - 0.0001
                  )}
                  stroke="#F04438"
                  strokeWidth={16}
                  fill="none"
                />
              )}
              {perc === 100 ? (
                <Circle
                  cx={donutConfig.cx}
                  cy={donutConfig.cy}
                  r={donutConfig.r}
                  stroke="#21C997"
                  strokeWidth={16}
                  fill="none"
                />
              ) : (
                <Path
                  d={arcPath(donutConfig.cx, donutConfig.cy, donutConfig.r, donutConfig.start, donutConfig.endAcertos)}
                  stroke="#21C997"
                  strokeWidth={16}
                  fill="none"
                />
              )}
            </G>
          </Svg>
          <View style={styles.donutCenter}>
            <Text style={styles.donutValue}>{perc}%</Text>
            <Text style={styles.donutLabel}>Acertos</Text>
          </View>
          <View style={styles.legendRow}>
            <LegendDot color="#21C997" label="Acertos" />
            {perc < 100 && <LegendDot color="#F04438" label="Erros" />}
          </View>
        </View>
      ) : (
        <View style={styles.barWrapper}>
          <BarRow label="Acertos" value={acertos} total={total} color="#21C997" />
          <BarRow label="Erros" value={erros} total={total} color="#F04438" />
        </View>
      )}
    </View>
  );
}

function ComentariosCard({
  questoes,
  idsOrdenados,
  onPressQuestao,
}: {
  questoes: ResultadoQuestao[];
  idsOrdenados: string[];
  onPressQuestao: (index: number) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>Comentários das questões</Text>
      <View style={styles.commentsGrid}>
        {idsOrdenados.map((qid, index) => {
          const questao = questoes.find((q) => q.id === qid);
          if (!questao) return null;
          const pendente = questao.tipo === "dissertativa" && questao.avaliacaoStatus !== "ok";
          const acertou = questao.acertou;
          const backgroundColor = pendente
            ? "#E5E7EB"
            : acertou
            ? "rgba(16, 185, 129, 0.14)"
            : "rgba(248, 113, 113, 0.17)";
          const textColor = pendente ? "#4B5563" : acertou ? "#047857" : "#B91C1C";

          return (
            <TouchableOpacity
              key={qid}
              style={[styles.commentChip, { backgroundColor }]}
              onPress={() => onPressQuestao(index)}
            >
              <Text style={[styles.commentChipText, { color: textColor }]}>{questao.numero ?? index + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    color: "#0F172A",
    fontFamily: "Inter-SemiBold",
  },

  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  summaryTopRow: { gap: 12 },
  summaryTopItem: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },
  summaryTopLabel: { color: "#64748B", fontSize: 11, fontFamily: "Inter-Medium" },
  summaryTopValue: { color: "#111827", fontSize: 14, fontFamily: "Inter-SemiBold" },

  summaryScoreRow: { flexDirection: "row", gap: 12 },
  scoreCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  scoreValue: { fontSize: 16, fontFamily: "Inter-Bold" },
  scoreLabel: { fontSize: 10, fontFamily: "Inter-Medium", marginTop: 4 },
  scoreIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
  },

  rewardCard: {
    backgroundColor: "#F5F3FF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rewardCardPending: { backgroundColor: "#EEF2FF" },
  rewardTitle: { color: "#7C3AED", fontFamily: "Inter-SemiBold", fontSize: 13 },
  rewardSubtitle: { color: "#6366F1", fontFamily: "Inter-Medium", fontSize: 11, marginTop: 2, maxWidth: 220 },
  rewardIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00000010",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, color: "#0F172A", fontFamily: "Inter-SemiBold", marginBottom: 10 },
  sectionTitleStandalone: { marginBottom: 10 },

  segmented: {
    backgroundColor: "#F4F4F5",
    borderRadius: 999,
    flexDirection: "row",
    padding: 3,
    gap: 6,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: { backgroundColor: "#FFFFFF", elevation: 1, shadowColor: "#00000010" },
  segmentText: { fontSize: 11, color: "#64748B", fontFamily: "Inter-Medium" },
  segmentTextActive: { color: "#0F172A", fontFamily: "Inter-SemiBold" },

  donutWrapper: { alignItems: "center", marginTop: 6 },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 64,
  },
  donutValue: { fontSize: 26, fontFamily: "Inter-Bold", color: "#0F172A" },
  donutLabel: { fontSize: 11, color: "#64748B", fontFamily: "Inter-Medium" },
  legendRow: {
    flexDirection: "row",
    gap: 18,
    marginTop: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#475569", fontFamily: "Inter-Medium" },

  barWrapper: { gap: 12, marginTop: 10 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  barLabel: { width: 90, fontSize: 12, color: "#475569", fontFamily: "Inter-Medium" },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 999 },
  barValue: { width: 30, textAlign: "right", fontFamily: "Inter-SemiBold", color: "#0F172A" },

  commentsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  commentChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  commentChipText: { fontSize: 14, fontFamily: "Inter-SemiBold" },

  dissertStatusWrapper: { gap: 12 },
  dissertStatusText: { color: "#475569", fontFamily: "Inter-Medium", fontSize: 13, lineHeight: 18 },
  progress: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: "#7C3AED" },
  progressLabel: { fontSize: 12, color: "#6366F1", fontFamily: "Inter-Medium" },

  actionsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  footerOutline: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  footerOutlineText: { color: "#0F172A", fontFamily: "Inter-SemiBold", fontSize: 13 },
  footerPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#21C997",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#04785720",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  footerPrimaryText: { color: "#FFFFFF", fontFamily: "Inter-SemiBold", fontSize: 13 },
});