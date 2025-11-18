// components/sheets/VisualizarQuestaoResultadoSheet.tsx
import { obterQuestaoCorrigida } from "@/src/services/simuladosResultadoService";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importar calculadores de feedback
import {
  calcularFeedbackBlocoRapido,
  calcularFeedbackCompletar,
  calcularFeedbackCompletarTopo,
  calcularFeedbackCruzadinha,
  calcularFeedbackLigarColunas,
  calcularFeedbackMathTable,
  extrairCorretasSelecaoMultipla,
} from "@/src/lib/feedbackCalculators";

// Importar componentes de questões
import EstatisticasQuestao from "../qbank/EstatisticasQuestao";
import BlocoRapidoAluno from "../questoes/BlocoRapidoAluno";
import ColorirFiguraAluno, {
  ConteudoColorir as ConteudoColorirTipo,
} from "../questoes/ColorirFiguraAluno";
import CompletarAluno from "../questoes/CompletarAluno";
import CompletarTopoAluno, {
  ConteudoCompletarTopo as ConteudoCompletarTopoTipo,
} from "../questoes/CompletarTopoAluno";
import LigarColunasAluno from "../questoes/LigarColunasAluno";
import QuestaoTabela from "../questoes/QuestaoTabela";
import SelecaoMultiplaAluno, { SelecaoMultiplaAlternativa } from "../questoes/SelecaoMultiplaAluno";
import { normalizeAlternativas, parseConteudo } from "../questoes/utils";

// ========== HELPERS ==========

/**
 * Helper para fazer parse de respostas que podem vir como string JSON.
 * Algumas respostas do backend vêm como string JSON serializada.
 */
function parseRespostaAluno<T = any>(resposta: any, defaultValue: T): T {
  if (!resposta) return defaultValue;

  // Se já é objeto, retorna direto
  if (typeof resposta === "object" && !Array.isArray(resposta)) {
    return resposta as T;
  }

  // Se é array, retorna direto
  if (Array.isArray(resposta)) {
    return resposta as T;
  }

  // Se é string JSON, faz parse (objeto ou array)
  if (typeof resposta === "string") {
    const trimmed = resposta.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(resposta) as T;
      } catch (e) {
        return defaultValue;
      }
    }
  }

  return defaultValue;
}

// ========== COMPONENTE PRINCIPAL ==========

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

type QuestaoDetalhada = {
  id: string;
  tipo: string;
  enunciado: string;
  imagemUrl?: string | null;
  alternativas?: string[];
  imagensAlternativas?: (string | null)[];
  gabarito?: number | string | null;
  respostaAluno?: any;
  blocoRapido?: any[];
  ligarColunas?: any[];
  conteudo?: any;
  acertou?: boolean;
  notaDissertativa?: number | null;
  justificativaDissertativa?: string | null;
  sugestaoDissertativa?: string | null;
  avaliacaoStatus?: "ok" | "pendente" | "erro";
  comentarioTexto?: string | null;
  comentarioVideoUrl?: string | null;
  feedbacks?: any;
  acertos?: number;
  total?: number;
};

export default function VisualizarQuestaoResultadoSheet({
  open,
  onClose,
  simuladoId,
  questaoId,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: Props) {
  const ref = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const snaps = useMemo(() => ["90%"], []);

  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<QuestaoDetalhada | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"comentarios" | "estatisticas">("comentarios");

  // Controle de abertura/fechamento
  React.useEffect(() => {
    if (!ref.current) return;
    if (open) ref.current?.snapToIndex(0);
    else ref.current?.close();
  }, [open]);

  // Carregar questão
  React.useEffect(() => {
    if (!open || !questaoId) return;
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const d = await obterQuestaoCorrigida(simuladoId, questaoId);
        if (active) {
          setDados(d);
          setAbaAtiva("comentarios");
        }
      } catch (e) {
        if (active) setDados(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, simuladoId, questaoId]);

  const contentWidth = Math.min(width, 600) - 32;

  if (!open || !questaoId) return null;

  return (
    <BottomSheet
      ref={ref}
      index={open ? 0 : -1}
      snapPoints={snaps}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={(p) => (
        <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...p} />
      )}
      handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Correção da Questão</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Carregando questão...</Text>
        </View>
      ) : !dados ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Não foi possível carregar a questão.</Text>
        </View>
      ) : (
        <>
          <BottomSheetScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 80 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Badge de Status */}
            <View style={styles.badgeContainer}>
              {dados.acertou === true && (
                <View style={[styles.badge, styles.badgeSuccess]}>
                  <Ionicons name="checkmark-circle" size={16} color="#047857" />
                  <Text style={styles.badgeTextSuccess}>Acertou</Text>
                </View>
              )}
              {dados.acertou === false && (
                <View style={[styles.badge, styles.badgeError]}>
                  <Ionicons name="close-circle" size={16} color="#B91C1C" />
                  <Text style={styles.badgeTextError}>Errou</Text>
                </View>
              )}
              {dados.tipo === "dissertativa" && dados.avaliacaoStatus && (
                <View style={[styles.badge, styles.badgeInfo]}>
                  <Text style={styles.badgeTextInfo}>
                    {dados.avaliacaoStatus === "ok"
                      ? "Corrigida"
                      : dados.avaliacaoStatus === "pendente"
                      ? "Em correção"
                      : "Erro na correção"}
                  </Text>
                </View>
              )}
            </View>

            {/* Enunciado */}
            <View style={styles.enunciadoContainer}>
              <RenderHTML
                contentWidth={contentWidth}
                source={{
                  html: dados.enunciado?.trim()
                    ? dados.enunciado
                    : "<p>Enunciado indisponível.</p>",
                }}
                baseStyle={styles.enunciado}
                defaultTextProps={{ selectable: false }}
                tagsStyles={{
                  p: styles.paragraph,
                  strong: styles.strong,
                  b: styles.strong,
                  em: styles.em,
                  i: styles.em,
                }}
              />
            </View>

            {/* Imagem da questão */}
            {dados.imagemUrl && (
              <View style={styles.imagemContainer}>
                <Image
                  source={{ uri: dados.imagemUrl }}
                  style={styles.imagemQuestao}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Renderizar conteúdo específico por tipo */}
            <ConteudoQuestao dados={dados} />

            {/* Abas */}
            <View style={styles.tabsContainer}>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    abaAtiva === "comentarios" && styles.tabActive,
                  ]}
                  onPress={() => setAbaAtiva("comentarios")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      abaAtiva === "comentarios" && styles.tabTextActive,
                    ]}
                  >
                    Comentários
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    abaAtiva === "estatisticas" && styles.tabActive,
                  ]}
                  onPress={() => setAbaAtiva("estatisticas")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      abaAtiva === "estatisticas" && styles.tabTextActive,
                    ]}
                  >
                    Estatísticas
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Conteúdo das Abas */}
              {abaAtiva === "comentarios" && (
                <View style={styles.tabContent}>
                  {dados.comentarioTexto ? (
                    <RenderHTML
                      contentWidth={contentWidth}
                      source={{ html: dados.comentarioTexto }}
                      baseStyle={styles.comentario}
                      defaultTextProps={{
                        selectable: false,
                        style: { fontFamily: "Inter" },
                      }}
                      tagsStyles={{
                        p: styles.comentarioParagraph,
                        strong: styles.strong,
                        b: styles.strong,
                      }}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={32}
                        color="#D1D5DB"
                      />
                      <Text style={styles.emptyText}>
                        Nenhum comentário disponível para esta questão.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {abaAtiva === "estatisticas" && (
                <View style={styles.tabContent}>
                  <EstatisticasQuestao questaoId={dados.id} />
                </View>
              )}
            </View>
          </BottomSheetScrollView>

          {/* Footer de Navegação */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
              onPress={onPrev}
              disabled={!hasPrev}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={hasPrev ? "#7C3AED" : "#D1D5DB"}
              />
              <Text
                style={[styles.navText, !hasPrev && styles.navTextDisabled]}
              >
                Anterior
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
              onPress={onNext}
              disabled={!hasNext}
            >
              <Text
                style={[styles.navText, !hasNext && styles.navTextDisabled]}
              >
                Próxima
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={hasNext ? "#7C3AED" : "#D1D5DB"}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </BottomSheet>
  );
}

// ========== Componente auxiliar para renderizar conteúdo por tipo ==========
function ConteudoQuestao({ dados }: { dados: QuestaoDetalhada }) {
  // Múltipla Escolha / Certa ou Errada
  if (dados.tipo === "multipla_escolha" || dados.tipo === "certa_errada") {
    return <ConteudoObjetiva dados={dados} />;
  }

  // Dissertativa / Objetiva Curta
  if (dados.tipo === "dissertativa" || dados.tipo === "objetiva_curta") {
    return <ConteudoDissertativa dados={dados} />;
  }

  // Bloco Rápido
  if (dados.tipo === "bloco_rapido" && Array.isArray(dados.blocoRapido)) {
    return <ConteudoBlocoRapido dados={dados} />;
  }

  // Ligar Colunas
  if (dados.tipo === "ligar_colunas" && Array.isArray(dados.ligarColunas)) {
    return <ConteudoLigarColunas dados={dados} />;
  }

  // Seleção Múltipla
  if (dados.tipo === "selecao_multipla") {
    return <ConteudoSelecaoMultipla dados={dados} />;
  }

  // Completar
  if (dados.tipo === "completar") {
    return <ConteudoCompletar dados={dados} />;
  }

  // Completar Topo
  if (dados.tipo === "completar_topo") {
    return <ConteudoCompletarTopo dados={dados} />;
  }

  // Tabela
  if (dados.tipo === "tabela") {
    return <ConteudoTabela dados={dados} />;
  }

  // Colorir Figura
  if (dados.tipo === "colorir_figura") {
    return <ConteudoColorirQuestao dados={dados} />;
  }

  // Tipo não suportado
  return (
    <View style={styles.tipoNaoSuportado}>
      <Ionicons name="alert-circle-outline" size={32} color="#F59E0B" />
      <Text style={styles.tipoNaoSuportadoTexto}>
        Visualização para tipo "{dados.tipo}" ainda não implementada.
      </Text>
    </View>
  );
}

// ========== Subcomponentes por tipo de questão ==========

function ConteudoObjetiva({ dados }: { dados: QuestaoDetalhada }) {
  const alternativas = useMemo(() => normalizeAlternativas(dados as any), [dados]);
  const imagensAlternativas = dados.imagensAlternativas ?? [];
  
  // ✅ LÓGICA CORRIGIDA - Normaliza resposta do aluno
  const respostaAlunoIndex = useMemo(() => {
    const resposta = dados.respostaAluno;
    
    // Se é número, retorna direto
    if (typeof resposta === "number") return resposta;
    
    // Se é string (letra), converte para índice
    if (typeof resposta === "string") {
      const letra = resposta.trim().toUpperCase();
      if (letra.length === 1 && /[A-Z]/.test(letra)) {
        return letra.charCodeAt(0) - 65;
      }
    }
    
    return null;
  }, [dados.respostaAluno]);
  
  // ✅ LÓGICA CORRIGIDA - Normaliza gabarito
  const respostaCorretaIndex = useMemo(() => {
    const gabarito = dados.gabarito;
    
    // Se é número, retorna direto
    if (typeof gabarito === "number") return gabarito;
    
    // Se é string (letra), converte para índice
    if (typeof gabarito === "string") {
      const letra = gabarito.trim().toUpperCase();
      if (letra.length === 1 && /[A-Z]/.test(letra)) {
        return letra.charCodeAt(0) - 65;
      }
    }
    
    return null;
  }, [dados.gabarito]);

  return (
    <View style={styles.alternativasContainer}>
      {alternativas.map((alt: string, index: number) => {
        const letra = String.fromCharCode(65 + index);
        const selecionada = respostaAlunoIndex === index;
        const correta = respostaCorretaIndex === index;
        const imagemUrl = imagensAlternativas[index];

        return (
          <View
            key={index}
            style={[
              styles.alternativa,
              correta && styles.alternativaCorreta,
              selecionada && !correta && styles.alternativaErrada,
            ]}
          >
            <View
              style={[
                styles.alternativaBullet,
                selecionada && styles.alternativaBulletSelected,
                correta && styles.alternativaBulletCorrect,
              ]}
            >
              <Text
                style={[
                  styles.alternativaLetra,
                  (selecionada || correta) && styles.alternativaLetraSelected,
                ]}
              >
                {letra}
              </Text>
            </View>

            <View style={styles.alternativaContent}>
              {imagemUrl && (
                <Image
                  source={{ uri: imagemUrl }}
                  style={styles.alternativaImagem}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.alternativaTexto}>{alt}</Text>
            </View>

            {correta && (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            )}
            {selecionada && !correta && (
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            )}
          </View>
        );
      })}
    </View>
  );
}

function ConteudoDissertativa({ dados }: { dados: QuestaoDetalhada }) {
  const isObjetivaCurta = dados.tipo === "objetiva_curta";
  
  return (
    <View style={styles.dissertativaContainer}>
      <View style={styles.dissertativaSection}>
        <Text style={styles.sectionTitle}>Sua resposta:</Text>
        <View style={[
          styles.respostaBox,
          isObjetivaCurta && styles.respostaBoxWithIcon,
          isObjetivaCurta && dados.acertou === true && styles.respostaBoxSuccess,
          isObjetivaCurta && dados.acertou === false && styles.respostaBoxError,
        ]}>
          <Text style={styles.respostaTexto}>
            {dados.respostaAluno || "(sem resposta)"}
          </Text>
          {isObjetivaCurta && dados.acertou === true && (
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          )}
          {isObjetivaCurta && dados.acertou === false && (
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          )}
        </View>
      </View>

      {dados.tipo === "dissertativa" && dados.notaDissertativa != null && (
        <View style={styles.feedbackDissertativa}>
          <View style={styles.notaContainer}>
            <Text style={styles.notaLabel}>Nota:</Text>
            <Text
              style={[
                styles.notaValor,
                dados.notaDissertativa >= 7
                  ? styles.notaSuccess
                  : styles.notaError,
              ]}
            >
              {dados.notaDissertativa}/10
            </Text>
          </View>

          {dados.justificativaDissertativa && (
            <View style={styles.justificativaContainer}>
              <Text style={styles.justificativaLabel}>Justificativa:</Text>
              <Text style={styles.justificativaTexto}>
                {dados.justificativaDissertativa}
              </Text>
            </View>
          )}

          {dados.sugestaoDissertativa && (
            <View style={styles.sugestaoContainer}>
              <Text style={styles.sugestaoLabel}>Resposta sugerida:</Text>
              <Text style={styles.sugestaoTexto}>
                {dados.sugestaoDissertativa}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ConteudoBlocoRapido({ dados }: { dados: QuestaoDetalhada }) {
  // ✅ Parse da resposta do aluno (pode vir como string JSON ou array)
  const respostas = parseRespostaAluno<string[]>(dados.respostaAluno, []);
  
  // ✅ CALCULAR FEEDBACKS
  const feedbacks = useMemo(() => {
    if (!Array.isArray(dados.blocoRapido)) return [];
    return calcularFeedbackBlocoRapido(dados.blocoRapido, respostas);
  }, [dados.blocoRapido, respostas]);

  return (
    <BlocoRapidoAluno
      respondido={true}
      blocoRapido={dados.blocoRapido!}
      respostasAluno={respostas}
      setRespostasAluno={() => {}}
      feedbacks={feedbacks}
    />
  );
}

function ConteudoLigarColunas({ dados }: { dados: QuestaoDetalhada }) {
  // ✅ Parse da resposta do aluno
  const respostas = parseRespostaAluno<{ [key: string]: string }>(
    dados.respostaAluno,
    {}
  );

  // ✅ CALCULAR FEEDBACKS
  const { feedbacks, corretas } = useMemo(() => {
    if (!Array.isArray(dados.ligarColunas)) {
      return { feedbacks: {}, corretas: {} };
    }
    return calcularFeedbackLigarColunas(dados.ligarColunas, respostas);
  }, [dados.ligarColunas, respostas]);

  return (
    <LigarColunasAluno
      respondido={true}
      ligarColunas={dados.ligarColunas!}
      respostasAluno={respostas}
      setRespostasAluno={() => {}}
      feedbacks={feedbacks}
      corretas={corretas}
    />
  );
}

function ConteudoSelecaoMultipla({ dados }: { dados: QuestaoDetalhada }) {
  const conteudo = parseConteudo(dados.conteudo);
  const alternativasBrutas = Array.isArray(conteudo?.alternativas)
    ? conteudo.alternativas
    : [];

  const alternativas: SelecaoMultiplaAlternativa[] = alternativasBrutas
    .map(
      (alt: any, index: number): SelecaoMultiplaAlternativa | null => {
      if (!alt) return null;
      if (typeof alt === "string") {
        return { id: `${dados.id}-sm-${index}`, texto: alt };
      }
      const texto = alt?.texto ?? alt?.label ?? alt?.descricao ?? "";
      if (!texto) return null;
      return {
        id: String(alt?.id ?? `${dados.id}-sm-${index}`),
        texto: String(texto),
        imagemUrl: alt?.imagemUrl ?? alt?.imagem ?? null,
      };
    }
    )
    .filter(
      (alt: SelecaoMultiplaAlternativa | null): alt is SelecaoMultiplaAlternativa => !!alt
    );

  // ✅ Parse da resposta do aluno
  const respostas = parseRespostaAluno<{ selecionadas: string[] }>(
    dados.respostaAluno,
    { selecionadas: [] }
  );

  // ✅ EXTRAIR ALTERNATIVAS CORRETAS (passando questaoId)
  const corretas = useMemo(() => {
    return extrairCorretasSelecaoMultipla(conteudo, dados.id);
  }, [conteudo, dados.id]);

  return (
    <SelecaoMultiplaAluno
      respondido={true}
      alternativas={alternativas}
      respostasAluno={respostas}
      setRespostasAluno={() => {}}
      corretas={corretas}
    />
  );
}

function ConteudoCompletar({ dados }: { dados: QuestaoDetalhada }) {
  const conteudo = parseConteudo(dados.conteudo);
  const frasesBrutas = Array.isArray(conteudo?.frases) ? conteudo.frases : [];

  type FraseCompletar = {
    id: string;
    textoBase: string;
    opcoes: [string, string];
    explicacao: string | null;
    correta?: string | null;
  };

  const frases = frasesBrutas
    .map((frase: any, index: number) => {
      if (!frase) return null;
      const textoBase =
        typeof frase?.textoBase === "string"
          ? frase.textoBase
          : typeof frase?.texto === "string"
          ? frase.texto
          : "";
      if (!textoBase || !textoBase.includes("_____")) return null;

      const opcoes = Array.isArray(frase?.opcoes) ? frase.opcoes : [];
      if (opcoes.length < 2) return null;

      const primeira = opcoes[0];
      const segunda = opcoes[1];
      if (typeof primeira !== "string" || typeof segunda !== "string") return null;

      return {
        id: String(frase?.id ?? `${dados.id}-completar-${index}`),
        textoBase,
        opcoes: [primeira, segunda] as [string, string],
        explicacao: typeof frase?.explicacao === "string" ? frase.explicacao : null,
        correta: typeof frase?.correta === "string" ? frase.correta : null,
      };
    })
    .filter(
      (item: FraseCompletar | null): item is FraseCompletar => !!item
    );

  // ✅ Parse da resposta do aluno (pode vir como string JSON ou array)
  const respostas = parseRespostaAluno<string[]>(dados.respostaAluno, []);

  // ✅ CALCULAR FEEDBACKS
  const feedbacks = useMemo(() => {
    return calcularFeedbackCompletar(frases, respostas);
  }, [frases, respostas]);

  return (
    <CompletarAluno
      respondido={true}
      frases={frases}
      respostasAluno={respostas}
      setRespostasAluno={() => {}}
      feedbacks={feedbacks}
    />
  );
}

function ConteudoCompletarTopo({ dados }: { dados: QuestaoDetalhada }) {
  const conteudo = parseConteudo(dados.conteudo);

  const frasesBrutas = Array.isArray(conteudo?.frases) ? conteudo.frases : [];
  const frasesNormalizadas = frasesBrutas
    .map((frase: any) => {
      if (typeof frase === "string") return frase;
      if (typeof frase?.texto === "string") return frase.texto;
      return "";
    })
    .filter((texto: string) => texto && /_{3,}/.test(texto));

  if (frasesNormalizadas.length === 0) return null;

  const lacunasBrutas = Array.isArray(conteudo?.lacunas) ? conteudo.lacunas : [];
  const lacunasNormalizadas = lacunasBrutas.map((lacuna: any, index: number) => ({
    id: String(
      lacuna?.id ?? lacuna?.lacunaId ?? `${dados.id}-completar-topo-lacuna-${index}`
    ),
  }));

  const palavrasBrutas = Array.isArray(conteudo?.palavrasTopo)
    ? conteudo.palavrasTopo
    : [];
  const palavrasNormalizadas = palavrasBrutas
    .map((palavra: any, index: number) => {
      if (!palavra) return null;
      if (typeof palavra === "string") {
        const texto = palavra.trim();
        if (!texto) return null;
        return {
          id: `${dados.id}-completar-topo-palavra-${index}`,
          texto,
        };
      }

      const texto = typeof palavra?.texto === "string" ? palavra.texto.trim() : "";
      if (!texto) return null;

      return {
        id: String(palavra?.id ?? `${dados.id}-completar-topo-palavra-${index}`),
        texto,
        distrator: !!palavra?.distrator,
      };
    })
    .filter(
      (
        item: { id: string; texto: string; distrator?: boolean } | null
      ): item is { id: string; texto: string; distrator?: boolean } =>
        !!item && item.texto.length > 0
    );

  const conteudoCompletarTopo: ConteudoCompletarTopoTipo = {
    frases: frasesNormalizadas,
    lacunas: lacunasNormalizadas,
    palavrasTopo: palavrasNormalizadas,
    config: conteudo?.config,
  };

  // ✅ Parse da resposta do aluno
  const respostas = parseRespostaAluno<{ respostasAluno: any[]; ordemTopo: string[] }>(
    dados.respostaAluno,
    { respostasAluno: [], ordemTopo: [] }
  );

  // ✅ CALCULAR FEEDBACKS
  const feedbacks = useMemo(() => {
    return calcularFeedbackCompletarTopo(conteudo, respostas);
  }, [conteudo, respostas]);

  return (
    <CompletarTopoAluno
      respondido={true}
      conteudo={conteudoCompletarTopo}
      respostasAluno={respostas}
      setRespostasAluno={() => {}}
      feedbacks={feedbacks}
    />
  );
}

function ConteudoTabela({ dados }: { dados: QuestaoDetalhada }) {
  const conteudo = parseConteudo(dados.conteudo);
  
  // ✅ Parse da resposta do aluno
  const respostas = parseRespostaAluno<any>(dados.respostaAluno, null);

  // ✅ CALCULAR FEEDBACKS
  const feedbacks = useMemo(() => {
    if (!conteudo || !respostas) return null;

    // Detectar subtipo
    const subtipo = conteudo?.subtipo;
    
    if (subtipo === "cruzadinha" || Array.isArray(conteudo?.mascaraAtiva)) {
      return calcularFeedbackCruzadinha(conteudo, respostas);
    }
    
    if (subtipo === "math_table" || Array.isArray(conteudo?.tabela)) {
      return calcularFeedbackMathTable(conteudo, respostas);
    }

    return null;
  }, [conteudo, respostas]);

  return (
    <QuestaoTabela
      respondido={true}
      conteudo={conteudo}
      respostasAluno={respostas}
      setRespostasAluno={() => {}}
      feedbacks={feedbacks}
    />
  );
}

function ConteudoColorirQuestao({ dados }: { dados: QuestaoDetalhada }) {
  const conteudo = parseConteudo(dados.conteudo) as ConteudoColorirTipo | null;
  if (!conteudo) return null;

  // ✅ Parse da resposta do aluno (pode vir como string JSON)
  const respostas = parseRespostaAluno<{ partesMarcadas: string[] }>(
    dados.respostaAluno,
    { partesMarcadas: [] }
  );

  return (
    <ColorirFiguraAluno
      respondido={true}
      conteudo={conteudo}
      respostasAluno={respostas}
      setRespostasAluno={() => {}}
    />
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter-Bold",
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  errorText: {
    fontSize: 15,
    color: "#EF4444",
    textAlign: "center",
    fontFamily: "Inter-Medium",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#D1FAE5",
  },
  badgeTextSuccess: {
    fontSize: 13,
    fontWeight: "600",
    color: "#047857",
    fontFamily: "Inter-SemiBold",
  },
  badgeError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  badgeTextError: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B91C1C",
    fontFamily: "Inter-SemiBold",
  },
  badgeInfo: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  badgeTextInfo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter-SemiBold",
  },
  enunciadoContainer: {
    marginTop: 8,
  },
  enunciado: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111827",
    fontFamily: "Inter",
    textAlign: "justify",
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111827",
    marginBottom: 8,
    textAlign: "justify",
  },
  strong: {
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  em: {
    fontStyle: "italic",
  },
  imagemContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  imagemQuestao: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  alternativasContainer: {
    gap: 12,
    marginTop: 8,
  },
  alternativa: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  alternativaCorreta: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  alternativaErrada: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  alternativaBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D8B4FE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  alternativaBulletSelected: {
    borderColor: "#7C3AED",
    backgroundColor: "#7C3AED",
  },
  alternativaBulletCorrect: {
    borderColor: "#10B981",
    backgroundColor: "#10B981",
  },
  alternativaLetra: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7C3AED",
    fontFamily: "Inter-Bold",
  },
  alternativaLetraSelected: {
    color: "#FFFFFF",
  },
  alternativaContent: {
    flex: 1,
    gap: 8,
  },
  alternativaImagem: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  alternativaTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    fontFamily: "Inter",
  },
  dissertativaContainer: {
    gap: 16,
    marginTop: 8,
  },
  dissertativaSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Inter-Bold",
  },
  respostaBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  respostaBoxWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  respostaBoxSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  respostaBoxError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  respostaTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: "#111827",
    fontFamily: "Inter",
    flex: 1,
  },
  feedbackDissertativa: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  notaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notaLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
    fontFamily: "Inter-Bold",
  },
  notaValor: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter-ExtraBold",
  },
  notaSuccess: {
    color: "#15803D",
  },
  notaError: {
    color: "#B91C1C",
  },
  justificativaContainer: {
    gap: 4,
  },
  justificativaLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF",
    fontFamily: "Inter-Bold",
  },
  justificativaTexto: {
    fontSize: 13,
    color: "#1F2937",
    lineHeight: 18,
    fontFamily: "Inter",
  },
  sugestaoContainer: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  sugestaoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
    fontFamily: "Inter-Bold",
  },
  sugestaoTexto: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 18,
    fontFamily: "Inter",
  },
  tipoNaoSuportado: {
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FEF3C7",
  },
  tipoNaoSuportadoTexto: {
    fontSize: 14,
    color: "#92400E",
    textAlign: "center",
    fontFamily: "Inter-Medium",
  },
  tabsContainer: {
    marginTop: 24,
    gap: 16,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#00000010",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "Inter-SemiBold",
  },
  tabTextActive: {
    color: "#7C3AED",
  },
  tabContent: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  comentario: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    fontFamily: "Inter",
  },
  comentarioParagraph: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    marginBottom: 8,
    textAlign: "justify",
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    fontFamily: "Inter-Medium",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7C3AED",
    fontFamily: "Inter-Bold",
  },
  navTextDisabled: {
    color: "#D1D5DB",
  },
});