import {
  corrigirBlocoRapido,
  corrigirColorirFigura,
  corrigirCompletar,
  corrigirCompletarTopo,
  corrigirDissertativa,
  corrigirLigarColunas,
  corrigirMultiplaEscolhaOuCertaErrada,
  corrigirSelecaoMultipla,
  corrigirTabela,
} from "@/src/services/respostasService";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHTML from "react-native-render-html";
import BlocoRapidoAluno from "./BlocoRapidoAluno";
import ColorirFiguraAluno, { ConteudoColorir } from "./ColorirFiguraAluno";
import CompletarAluno from "./CompletarAluno";
import CompletarTopoAluno, { ConteudoCompletarTopo } from "./CompletarTopoAluno";
import LigarColunasAluno from "./LigarColunasAluno";
import QuestaoTabela from "./QuestaoTabela";
import SelecaoMultiplaAluno, { SelecaoMultiplaAlternativa } from "./SelecaoMultiplaAluno";

export type QuestaoCardData = {
  id: string;
  codigo: string;
  tipo: string;
  enunciado: string;
  imagemUrl?: string | null;
  alternativas?: string[] | null;
  imagensAlternativas?: string[] | null;
  blocoRapido?: any;
  ligarColunas?: any;
  conteudo?: any;
  materia?: { nome: string } | null;
  grauDificuldade?: { nome: string } | null;
  ano?: { nome: string } | null;
};

type Props = {
  questao: QuestaoCardData;
};

const TIPO_LABELS: Record<string, string> = {
  multipla_escolha: "Múltipla escolha",
  certa_errada: "Certa/Errada",
  objetiva_curta: "Objetiva curta",
  dissertativa: "Dissertativa",
  bloco_rapido: "Bloco rápido",
  ligar_colunas: "Ligar colunas",
  completar: "Completar",
  completar_topo: "Completar (topo)",
  tabela: "Tabela",
  selecao_multipla: "Seleção múltipla",
  colorir_figura: "Colorir figura",
};

function parseConteudo(raw: any) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

function normalizeAlternativas(questao: QuestaoCardData) {
  if (Array.isArray(questao.alternativas) && questao.alternativas.length > 0) {
    return questao.alternativas.map((alt) => String(alt));
  }

  if (questao.tipo === "certa_errada") {
    return ["Certo", "Errado"];
  }

  const conteudo = parseConteudo(questao.conteudo);

  if (questao.tipo === "selecao_multipla") {
    const alternativas = Array.isArray(conteudo?.alternativas) ? conteudo?.alternativas : [];
    return alternativas
      .map((alt: any) => {
        if (!alt) return null;
        if (typeof alt === "string") return alt;
        return alt.texto ?? alt.label ?? alt.descricao ?? null;
      })
      .filter((alt: string | null | undefined): alt is string => typeof alt === "string" && alt.trim().length > 0);
  }

  if (questao.tipo === "completar" && Array.isArray(conteudo?.frases)) {
    return conteudo.frases.map((frase: any) => frase?.correta ?? "").filter((alt: string) => alt);
  }

  if (questao.tipo === "completar_topo" && Array.isArray(conteudo?.lacunas)) {
    return conteudo.lacunas.map((lacuna: any) => lacuna?.resposta ?? lacuna?.texto ?? "").filter((alt: string) => alt);
  }

  if (questao.tipo === "bloco_rapido") {
    const itens = Array.isArray(questao.blocoRapido)
      ? questao.blocoRapido
      : typeof questao.blocoRapido === "string"
        ? (() => {
            try {
              return JSON.parse(questao.blocoRapido);
            } catch {
              return [];
            }
          })()
        : [];
    return itens
      .map((item: any, idx: number) => {
        const pergunta = item?.pergunta ?? item?.texto ?? "";
        return pergunta ? `${idx + 1}. ${pergunta}` : null;
      })
      .filter((alt: unknown): alt is string => typeof alt === "string");
  }

  return [];
}

export function QuestaoCard({ questao }: Props) {
  const { width } = useWindowDimensions();

  const alternativas = useMemo(() => normalizeAlternativas(questao), [questao]);
  const imagensAlternativas = useMemo(() => questao.imagensAlternativas ?? [], [questao.imagensAlternativas]);
  
  const contentWidth = Math.min(width, 600) - 40;
  const htmlSource = useMemo(
    () => ({
      html: questao.enunciado?.trim() ? questao.enunciado : "<p>Enunciado indisponível.</p>",
    }),
    [questao.enunciado],
  );

  const typeLabel = TIPO_LABELS[questao.tipo] ?? questao.tipo;

  const isObjetiva = questao.tipo === "multipla_escolha" || questao.tipo === "certa_errada";
  const isDissertativa = questao.tipo === "dissertativa";
  const isBlocoRapido = questao.tipo === "bloco_rapido";
  const isLigarColunas = questao.tipo === "ligar_colunas";
  const isSelecaoMultipla = questao.tipo === "selecao_multipla";
  const isCompletar = questao.tipo === "completar";
  const isCompletarTopo = questao.tipo === "completar_topo";
  const isTabela = questao.tipo === "tabela";
  const isColorir = questao.tipo === "colorir_figura";
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [respostaTexto, setRespostaTexto] = useState("");
  const [respostasBlocoRapido, setRespostasBlocoRapido] = useState<string[]>([]);
  const [feedbacksBlocoRapido, setFeedbacksBlocoRapido] = useState<boolean[]>([]);
  const [respostasLigarColunas, setRespostasLigarColunas] = useState<Record<string, string>>({});
  const [feedbacksLigarColunas, setFeedbacksLigarColunas] = useState<Record<string, boolean>>({});
  const [corretasLigarColunas, setCorretasLigarColunas] = useState<Record<string, number>>({});
  const [respostasSelecaoMultipla, setRespostasSelecaoMultipla] = useState<{ selecionadas: string[] }>({ selecionadas: [] });
  const [corretasSelecaoMultipla, setCorretasSelecaoMultipla] = useState<string[]>([]);
  const [respostasCompletar, setRespostasCompletar] = useState<string[]>([]);
  const [feedbacksCompletar, setFeedbacksCompletar] = useState<Array<"correta" | "incorreta" | null>>([]);
  const [respostasCompletarTopo, setRespostasCompletarTopo] = useState<{
    respostasAluno: Array<{ lacunaId: string; valor: string }>;
    ordemTopo: string[];
  }>({ respostasAluno: [], ordemTopo: [] });
  const [feedbacksCompletarTopo, setFeedbacksCompletarTopo] = useState<Record<string, boolean>>({});
  const [respostasTabela, setRespostasTabela] = useState<any>(null);
  const [feedbacksTabela, setFeedbacksTabela] = useState<any>(null);
  const [respostasColorir, setRespostasColorir] = useState<{ partesMarcadas: string[] }>({
    partesMarcadas: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<
    | null
    | {
        status: "ok";
        acertou: boolean;
        nota?: number;
        justificativa?: string;
        sugestao?: string | null;
      }
    | { status: "erro"; msg: string }
  >(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Preparar dados do bloco rápido
  const blocoRapidoItens = useMemo(() => {
    if (!isBlocoRapido) return [];
    
    let parsed: any[] = [];
    if (Array.isArray(questao.blocoRapido)) {
      parsed = questao.blocoRapido;
    } else if (typeof questao.blocoRapido === "string") {
      try {
        parsed = JSON.parse(questao.blocoRapido);
      } catch {
        parsed = [];
      }
    }
    
    return parsed;
  }, [isBlocoRapido, questao.blocoRapido]);

  // Preparar dados de ligar colunas
  const ligarColunasItens = useMemo(() => {
    if (!isLigarColunas) return [];
    
    let parsed: any[] = [];
    if (Array.isArray(questao.ligarColunas)) {
      parsed = questao.ligarColunas;
    } else if (typeof questao.ligarColunas === "string") {
      try {
        parsed = JSON.parse(questao.ligarColunas);
      } catch {
        parsed = [];
      }
    }
    
    return parsed;
  }, [isLigarColunas, questao.ligarColunas]);

  const selecaoMultiplaAlternativas = useMemo(() => {
    if (!isSelecaoMultipla) return [];

    const conteudo = parseConteudo(questao.conteudo);
    const alternativasBrutas = Array.isArray(conteudo?.alternativas) ? conteudo.alternativas : [];

    return alternativasBrutas
      .map((alt: any, index: number): SelecaoMultiplaAlternativa | null => {
        if (!alt) return null;

        if (typeof alt === "string") {
          return {
            id: `${questao.id}-sm-${index}`,
            texto: alt,
          };
        }

        const texto = alt?.texto ?? alt?.label ?? alt?.descricao ?? "";
        if (!texto) return null;

        const rawId = alt?.id ?? alt?.value ?? `${questao.id}-sm-${index}`;

        return {
          id: String(rawId),
          texto: String(texto),
          imagemUrl: alt?.imagemUrl ?? alt?.imagem ?? null,
        };
      })
      .filter((alt: SelecaoMultiplaAlternativa | null): alt is SelecaoMultiplaAlternativa => !!alt && alt.texto.trim().length > 0);
  }, [isSelecaoMultipla, questao.conteudo, questao.id]);

  const handleSelecaoMultiplaChange = useCallback(
    (value: { selecionadas: string[] }) => {
      setRespostasSelecaoMultipla(value);
      setValidationError(null);
      setFeedback(null);
      if (corretasSelecaoMultipla.length > 0) {
        setCorretasSelecaoMultipla([]);
      }
    },
    [corretasSelecaoMultipla.length],
  );

  const completarFrases = useMemo(() => {
    if (!isCompletar) return [];

    const conteudo = parseConteudo(questao.conteudo);
    const frasesBrutas = Array.isArray(conteudo?.frases) ? conteudo.frases : [];

    return frasesBrutas
      .map((frase: any, index: number) => {
        if (!frase) return null;

        const textoBase = typeof frase?.textoBase === "string" ? frase.textoBase : typeof frase?.texto === "string" ? frase.texto : "";
        if (!textoBase || !textoBase.includes("_____")) {
          return null;
        }

        const opcoes = Array.isArray(frase?.opcoes) ? frase.opcoes : [];
        if (opcoes.length < 2) return null;

        const primeira = opcoes[0];
        const segunda = opcoes[1];
        if (typeof primeira !== "string" || typeof segunda !== "string") return null;

        return {
          id: String(frase?.id ?? `${questao.id}-completar-${index}`),
          textoBase,
          opcoes: [primeira, segunda] as [string, string],
          explicacao: typeof frase?.explicacao === "string" ? frase.explicacao : null,
        };
      })
      .filter(
        (
          item: | {
            id: string;
            textoBase: string;
            opcoes: [string, string];
            explicacao?: string | null;
          }
          | null,
        ): item is {
          id: string;
          textoBase: string;
          opcoes: [string, string];
          explicacao?: string | null;
        } => !!item,
      );
  }, [isCompletar, questao.conteudo, questao.id]);

  const handleCompletarChange = useCallback(
    (next: string[]) => {
      setRespostasCompletar(next);
      setValidationError(null);
      setFeedback(null);
      if (feedbacksCompletar.length > 0) {
        setFeedbacksCompletar([]);
      }
    },
    [feedbacksCompletar.length],
  );

  const completarTopoConteudo = useMemo<ConteudoCompletarTopo | null>(() => {
    if (!isCompletarTopo) return null;

    const conteudo = parseConteudo(questao.conteudo);

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
      id: String(lacuna?.id ?? lacuna?.lacunaId ?? `${questao.id}-completar-topo-lacuna-${index}`),
    }));

    const palavrasBrutas = Array.isArray(conteudo?.palavrasTopo) ? conteudo.palavrasTopo : [];
    const palavrasNormalizadas = palavrasBrutas
      .map(
        (
          palavra: any,
          index: number,
        ): {
          id: string;
          texto: string;
          distrator?: boolean;
        } | null => {
        if (!palavra) return null;
        if (typeof palavra === "string") {
          const texto = palavra.trim();
          if (!texto) return null;
          return {
            id: `${questao.id}-completar-topo-palavra-${index}`,
            texto,
          };
        }

        const texto = typeof palavra?.texto === "string" ? palavra.texto.trim() : "";
        if (!texto) return null;

        return {
          id: String(palavra?.id ?? `${questao.id}-completar-topo-palavra-${index}`),
          texto,
          distrator: !!palavra?.distrator,
        };
        },
      )
      .filter(
        (
          item: { id: string; texto: string; distrator?: boolean } | null,
        ): item is { id: string; texto: string; distrator?: boolean } => !!item && item.texto.length > 0,
      );

    return {
      frases: frasesNormalizadas,
      lacunas: lacunasNormalizadas,
      palavrasTopo: palavrasNormalizadas,
      config: conteudo?.config,
    };
  }, [isCompletarTopo, questao.conteudo, questao.id]);

  const tabelaConteudo = useMemo(() => {
    if (!isTabela) return null;
    return parseConteudo(questao.conteudo);
  }, [isTabela, questao.conteudo]);

  const colorirConteudo = useMemo<ConteudoColorir | null>(() => {
    if (!isColorir) return null;
    const conteudo = parseConteudo(questao.conteudo);
    if (!conteudo || typeof conteudo !== "object") return null;
    return conteudo as ConteudoColorir;
  }, [isColorir, questao.conteudo]);

  useEffect(() => {
    if (!isColorir) {
      setRespostasColorir({ partesMarcadas: [] });
    } else if (!colorirConteudo) {
      setRespostasColorir({ partesMarcadas: [] });
    }
  }, [isColorir, colorirConteudo, questao.id]);

  const handleCompletarTopoChange = useCallback(
    (snapshot: { respostasAluno: Array<{ lacunaId: string; valor: string }>; ordemTopo: string[] }) => {
      setRespostasCompletarTopo(snapshot);
      setValidationError(null);
      setFeedback(null);
      if (Object.keys(feedbacksCompletarTopo).length > 0) {
        setFeedbacksCompletarTopo({});
      }
    },
    [feedbacksCompletarTopo],
  );

  const handleTabelaChange = useCallback(
    (next: any) => {
      setRespostasTabela(next);
      setValidationError(null);
      setFeedback(null);
      setFeedbacksTabela(null);
    },
    [],
  );

  const handleColorirChange = useCallback(
    (value: { partesMarcadas: string[] }) => {
      setRespostasColorir(value);
      setValidationError(null);
      setFeedback(null);
    },
    [],
  );

  async function handleResponder() {
    // Validações
    if (isObjetiva && selectedIndex === null) {
      setValidationError("Selecione uma alternativa para responder.");
      return;
    }

    if (isDissertativa && !respostaTexto.trim()) {
      setValidationError("Escreva sua resposta antes de enviar.");
      return;
    }

    if (isBlocoRapido && respostasBlocoRapido.length !== blocoRapidoItens.length) {
      setValidationError("Responda todos os itens antes de enviar.");
      return;
    }

    if (isLigarColunas && !respostasLigarColunas["_colunaB"]) {
      setValidationError("Complete todas as ligações antes de enviar.");
      return;
    }

    if (isSelecaoMultipla && respostasSelecaoMultipla.selecionadas.length === 0) {
      setValidationError("Selecione pelo menos uma alternativa.");
      return;
    }

    if (isCompletar && completarFrases.length > 0) {
      const todosPreenchidos = completarFrases.every((_: unknown, index: number) => {
        const valor = respostasCompletar?.[index];
        return typeof valor === "string" && valor.trim().length > 0;
      });
      if (!todosPreenchidos) {
        setValidationError("Preencha todas as lacunas antes de enviar.");
        return;
      }
    }

    if (isCompletarTopo && completarTopoConteudo) {
      const totalLacunas =
        completarTopoConteudo.lacunas.length > 0
          ? completarTopoConteudo.lacunas.length
          : completarTopoConteudo.frases.reduce(
              (acc, frase) => acc + ((frase.match(/_{3,}/g) ?? []).length),
              0,
            );

      const preenchidas = new Set(
        (respostasCompletarTopo.respostasAluno ?? [])
          .filter((item) => typeof item?.valor === "string" && item.valor.trim().length > 0)
          .map((item) => String(item.lacunaId)),
      );

      if (totalLacunas > 0 && preenchidas.size < totalLacunas) {
        setValidationError("Preencha todas as lacunas antes de enviar.");
        return;
      }
    }

    if (isTabela && !tabelaConteudo) {
      setValidationError("Conteúdo da questão indisponível.");
      return;
    }

    if (isColorir && !colorirConteudo) {
      setValidationError("Conteúdo da questão indisponível.");
      return;
    }

    setValidationError(null);
    setSubmitting(true);
    setFeedback(null);

    try {
      if (isObjetiva) {
        const index = selectedIndex;
        if (index === null) return;
        const letra = String.fromCharCode(65 + index);
        const result = await corrigirMultiplaEscolhaOuCertaErrada(questao.id, letra);
        setFeedback({ status: "ok", acertou: !!result?.acertou });
      } else if (isDissertativa) {
        const result = await corrigirDissertativa(questao.id, respostaTexto);
        setFeedback({ 
          status: "ok", 
          acertou: !!result?.acertou,
          nota: result?.nota,
          justificativa: result?.justificativa,
          sugestao: result?.sugestao,
        });
      } else if (isBlocoRapido) {
        const result = await corrigirBlocoRapido(questao.id, respostasBlocoRapido);
        setFeedback({ status: "ok", acertou: !!result?.acertou });
        setFeedbacksBlocoRapido(result?.feedbacks ?? []);
      } else if (isLigarColunas) {
        const result = await corrigirLigarColunas(questao.id, respostasLigarColunas);
        setFeedback({ status: "ok", acertou: !!result?.acertou });
        setFeedbacksLigarColunas(result?.feedbacks ?? {});
        setCorretasLigarColunas(result?.corretas ?? {});
      } else if (isSelecaoMultipla) {
        const result = await corrigirSelecaoMultipla(questao.id, respostasSelecaoMultipla.selecionadas);
        setFeedback({ status: "ok", acertou: !!result?.acertou });
        const corretas = result?.resultadoCorrecao?.corretas ?? [];
        setCorretasSelecaoMultipla(Array.isArray(corretas) ? corretas.map(String) : []);
      } else if (isCompletar) {
        const result = await corrigirCompletar(questao.id, respostasCompletar);
        setFeedback({ status: "ok", acertou: !!result?.acertou });
        const itens = result?.resultadoCorrecao?.itens;
        if (Array.isArray(itens)) {
          setFeedbacksCompletar(itens as Array<"correta" | "incorreta" | null>);
        }
      } else if (isCompletarTopo && completarTopoConteudo) {
        const result = await corrigirCompletarTopo(questao.id, respostasCompletarTopo.respostasAluno);
        setFeedback({ status: "ok", acertou: !!result?.acertou });
        setFeedbacksCompletarTopo(result?.resultadoCorrecao?.porLacuna ?? {});
      } else if (isTabela) {
        const payload = respostasTabela ?? {};
        const result = await corrigirTabela(questao.id, payload);
        setFeedback({ status: "ok", acertou: !!result?.acertou });
        const correcoes = (result as any)?.resultadoCorrecao ?? (result as any)?.feedbacks ?? null;
        setFeedbacksTabela(correcoes);
      } else if (isColorir && colorirConteudo) {
        const result = await corrigirColorirFigura(questao.id, respostasColorir.partesMarcadas ?? []);
        setFeedback({ status: "ok", acertou: !!result?.acertou });
      }
    } catch (error) {
      setFeedback({ status: "erro", msg: "Não foi possível corrigir agora. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  const feedbackMessage = (() => {
    if (!feedback) return null;
    if (feedback.status === "erro") {
      return feedback.msg;
    }
    
    if (isDissertativa && feedback.status === "ok") {
      return null; // Para dissertativa, mostramos um card customizado
    }
    
    return feedback.acertou ? "Você acertou!" : "Resposta incorreta. Tente novamente.";
  })();

  const respondido = feedback?.status === "ok";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.codigo}>{questao.codigo}</Text>
        <Text style={styles.tipo}>{typeLabel}</Text>
      </View>

      <View style={styles.enunciadoWrapper}>
        <RenderHTML
          contentWidth={contentWidth}
          source={htmlSource}
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

      {/* Alternativas de múltipla escolha */}
      {(isObjetiva && alternativas.length > 0) ? (
        <View style={styles.alternativas}>
          {alternativas.map((alt: string, index: number) => {
            const letra = String.fromCharCode(65 + index);
            const selected = selectedIndex === index;
            const imagemUrl = imagensAlternativas[index];
            const hasImage = !!imagemUrl;
            const hasText = alt.trim().length > 0;

            return (
              <TouchableOpacity
                key={`${questao.id}-alt-${index}`}
                activeOpacity={0.85}
                onPress={() => {
                  if (respondido) return;
                  setSelectedIndex(index);
                  setFeedback(null);
                }}
                style={[
                  styles.alternativaRow,
                  selected && styles.alternativaRowSelected,
                  respondido && styles.alternativaRowDisabled,
                ]}
              >
                <View style={[styles.alternativaBullet, selected && styles.alternativaBulletSelected]}>
                  <Text style={[styles.alternativaLabel, selected && styles.alternativaLabelSelected]}>{letra}</Text>
                </View>

                <View style={styles.alternativaContent}>
                  {hasImage && (
                    <Image
                      source={{ uri: imagemUrl }}
                      style={styles.alternativaImagem}
                      resizeMode="contain"
                    />
                  )}
                  {hasText && (
                    <Text style={[styles.alternativaTexto, selected && styles.alternativaTextoSelected]}>
                      {alt}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Campo de texto para dissertativa */}
      {isDissertativa && (
        <View style={styles.dissertativaContainer}>
          <Text style={styles.dissertativaLabel}>Escreva sua resposta:</Text>
          <TextInput
            value={respostaTexto}
            onChangeText={setRespostaTexto}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            placeholder="Digite sua resposta aqui..."
            editable={!respondido}
            style={[
              styles.dissertativaInput,
              respondido && styles.dissertativaInputDisabled,
            ]}
          />
          <Text style={styles.charCounter}>{respostaTexto.length} caracteres</Text>
        </View>
      )}

      {/* Bloco Rápido */}
      {isBlocoRapido && blocoRapidoItens.length > 0 && (
        <BlocoRapidoAluno
          respondido={respondido}
          blocoRapido={blocoRapidoItens}
          respostasAluno={respostasBlocoRapido}
          setRespostasAluno={setRespostasBlocoRapido}
          feedbacks={respondido ? feedbacksBlocoRapido : undefined}
        />
      )}

      {/* Ligar Colunas */}
      {isLigarColunas && ligarColunasItens.length > 0 && (
        <LigarColunasAluno
          respondido={respondido}
          ligarColunas={ligarColunasItens}
          respostasAluno={respostasLigarColunas}
          setRespostasAluno={setRespostasLigarColunas}
          feedbacks={respondido ? feedbacksLigarColunas : undefined}
          corretas={respondido ? corretasLigarColunas : undefined}
        />
      )}

      {isSelecaoMultipla && selecaoMultiplaAlternativas.length > 0 && (
        <SelecaoMultiplaAluno
          respondido={respondido}
          alternativas={selecaoMultiplaAlternativas}
          respostasAluno={respostasSelecaoMultipla}
          setRespostasAluno={handleSelecaoMultiplaChange}
          corretas={respondido ? corretasSelecaoMultipla : undefined}
        />
      )}

      {isCompletarTopo && completarTopoConteudo && (
        <CompletarTopoAluno
          respondido={respondido}
          conteudo={completarTopoConteudo}
          respostasAluno={respostasCompletarTopo}
          setRespostasAluno={handleCompletarTopoChange}
          feedbacks={respondido ? feedbacksCompletarTopo : undefined}
        />
      )}

      {isTabela && tabelaConteudo && (
        <QuestaoTabela
          respondido={respondido}
          conteudo={tabelaConteudo}
          respostasAluno={respostasTabela}
          setRespostasAluno={handleTabelaChange}
          feedbacks={respondido ? feedbacksTabela : undefined}
        />
      )}

    {isColorir && colorirConteudo && (
      <ColorirFiguraAluno
        respondido={respondido}
        conteudo={colorirConteudo}
        respostasAluno={respostasColorir}
        setRespostasAluno={handleColorirChange}
      />
    )}

      {isCompletar && completarFrases.length > 0 && (
        <CompletarAluno
          respondido={respondido}
          frases={completarFrases}
          respostasAluno={respostasCompletar}
          setRespostasAluno={handleCompletarChange}
          feedbacks={respondido ? feedbacksCompletar : undefined}
        />
      )}

      {/* Botão Responder e feedback */}
      {(isObjetiva || isDissertativa || isBlocoRapido || isLigarColunas || isSelecaoMultipla || isCompletar || isCompletarTopo || isTabela || isColorir) && (
        <View style={styles.responderArea}>
          {validationError ? <Text style={styles.validation}>{validationError}</Text> : null}
          
          {feedbackMessage ? (
            <Text
              style={[
                styles.feedback,
                feedback?.status === "ok"
                  ? feedback?.acertou
                    ? styles.feedbackSuccess
                    : styles.feedbackError
                  : styles.feedbackError,
              ]}
            >
              {feedbackMessage}
            </Text>
          ) : null}

          {/* Feedback dissertativa (card customizado) */}
          {isDissertativa && feedback?.status === "ok" && (
            <View style={styles.dissertativaFeedback}>
              <View style={styles.notaContainer}>
                <Text style={styles.notaLabel}>Nota:</Text>
                <Text style={[
                  styles.notaValor,
                  (feedback.nota ?? 0) > 7 ? styles.notaSuccess : styles.notaError
                ]}>
                  {feedback.nota}/10
                </Text>
              </View>
              
              {feedback.justificativa && (
                <View style={styles.justificativaContainer}>
                  <Text style={styles.justificativaLabel}>Justificativa:</Text>
                  <Text style={styles.justificativaTexto}>{feedback.justificativa}</Text>
                </View>
              )}

              {feedback.sugestao && (
                <View style={styles.sugestaoContainer}>
                  <Text style={styles.sugestaoLabel}>Resposta sugerida:</Text>
                  <Text style={styles.sugestaoTexto}>{feedback.sugestao}</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.responderBtn, (submitting || respondido) && styles.responderBtnDisabled]}
            onPress={handleResponder}
            disabled={submitting || respondido}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.responderText}>
                {respondido ? "Respondido" : "Responder"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.meta}>
        {questao.materia?.nome ? <Text style={styles.metaChip}>{questao.materia.nome}</Text> : null}
        {questao.grauDificuldade?.nome ? <Text style={styles.metaChip}>{questao.grauDificuldade.nome}</Text> : null}
        {questao.ano?.nome ? <Text style={styles.metaChip}>{questao.ano.nome}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codigo: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111827",
  },
  tipo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "capitalize",
  },
  enunciadoWrapper: {
    marginTop: 4,
  },
  enunciado: {
    fontSize: 15,
    lineHeight: 20,
    color: "#111827",
  },
  paragraph: {
    marginBottom: 8,
    fontSize: 15,
    lineHeight: 20,
    color: "#111827",
  },
  strong: {
    fontWeight: "700",
  },
  em: {
    fontStyle: "italic",
  },
  alternativas: {
    marginTop: 4,
    gap: 10,
  },
  alternativaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  alternativaRowDisabled: {
    opacity: 0.75,
  },
  alternativaRowSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  alternativaBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  alternativaBulletSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#22C55E",
  },
  alternativaLabel: {
    fontWeight: "600",
    color: "#64748B",
  },
  alternativaLabelSelected: {
    color: "#FFFFFF",
  },
  alternativaContent: {
    flex: 1,
    gap: 8,
  },
  alternativaImagem: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  alternativaTexto: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  alternativaTextoSelected: {
    color: "#14532D",
  },
  dissertativaContainer: {
    marginTop: 8,
    gap: 8,
  },
  dissertativaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  dissertativaInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 120,
    backgroundColor: "#FFFFFF",
  },
  dissertativaInputDisabled: {
    backgroundColor: "#F9FAFB",
    color: "#6B7280",
  },
  charCounter: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
  },
  dissertativaFeedback: {
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
  },
  notaValor: {
    fontSize: 18,
    fontWeight: "800",
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
  },
  justificativaTexto: {
    fontSize: 13,
    color: "#1F2937",
    lineHeight: 18,
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
  },
  sugestaoTexto: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 18,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  metaChip: {
    backgroundColor: "#F3F4F6",
    color: "#4B5563",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  responderArea: {
    marginTop: 4,
    gap: 10,
  },
  responderBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  responderBtnDisabled: {
    opacity: 0.6,
  },
  responderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  validation: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "500",
  },
  feedback: {
    fontSize: 14,
    fontWeight: "600",
  },
  feedbackSuccess: {
    color: "#15803D",
  },
  feedbackError: {
    color: "#B91C1C",
  },
});

export default QuestaoCard;