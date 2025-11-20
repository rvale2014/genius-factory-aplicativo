// components/blocos/questoes/QuestaoCardBloco.tsx
// Versão completa e independente com persistência de estado

import {
  corrigirBlocoRapido,
  corrigirColorirFigura,
  corrigirCompletar,
  corrigirCompletarTopo,
  corrigirDissertativa,
  corrigirLigarColunas,
  corrigirMultiplaEscolhaOuCertaErrada,
  corrigirObjetivaCurta,
  corrigirSelecaoMultipla,
  corrigirTabela,
} from "@/src/services/respostasService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import ConteudoExtraModal, { ConteudoExtraModalRef } from "../qbank/ConteudoExtraModal";
import BlocoRapidoAluno from "./BlocoRapidoAluno";
import ColorirFiguraAluno, { ConteudoColorir } from "./ColorirFiguraAluno";
import CompletarAluno from "./CompletarAluno";
import CompletarTopoAluno, { ConteudoCompletarTopo } from "./CompletarTopoAluno";
import LigarColunasAluno from "./LigarColunasAluno";
import QuestaoTabela from "./QuestaoTabela";
import SelecaoMultiplaAluno, { SelecaoMultiplaAlternativa } from "./SelecaoMultiplaAluno";
import {
  normalizeAlternativas,
  parseConteudo
} from "./utils";

type Props = {
  questao: any;
  blocoId: string;
  trilhaId: string;
  caminhoId: string;
  atividadeId: string;
  onMarcarConcluida: () => void;
};

type FeedbackState =
  | null
  | {
      status: "ok";
      acertou: boolean;
      nota?: number;
      justificativa?: string;
      sugestao?: string | null;
      corretaLetra?: string | null;
    }
  | { status: "erro"; msg: string };

type EstadoPersistido = {
  feedback: FeedbackState | null;
  selectedIndex: number | null;
  respostaTexto: string;
  respostasBlocoRapido: string[];
  feedbacksBlocoRapido: boolean[];
  respostasLigarColunas: Record<string, string>;
  feedbacksLigarColunas: Record<string, boolean>;
  corretasLigarColunas: Record<string, number>;
  respostasSelecaoMultipla: { selecionadas: string[] };
  corretasSelecaoMultipla: string[];
  respostasCompletar: string[];
  feedbacksCompletar: Array<"correta" | "incorreta" | null>;
  respostasCompletarTopo: {
    respostasAluno: Array<{ lacunaId: string; valor: string }>;
    ordemTopo: string[];
  };
  feedbacksCompletarTopo: Record<string, boolean>;
  respostasTabela: any;
  feedbacksTabela: any;
  respostasColorir: { partesMarcadas: string[] };
  timestamp: number;
};

export const QuestaoCardBloco = React.memo(function QuestaoCardBloco({
  questao,
  blocoId,
  trilhaId,
  caminhoId,
  atividadeId,
  onMarcarConcluida,
}: Props) {
  const { width } = useWindowDimensions();
  const conteudoExtraRef = useRef<ConteudoExtraModalRef | null>(null);
  const cardRef = useRef<View>(null);
  const onMarcarConcluidaRef = useRef(onMarcarConcluida);
  const estadoRestauradoRef = useRef(false);
  const questaoIdRef = useRef<string>(questao.id);
  
  // Usar useMemo para garantir que as keys só mudem quando questao.id ou blocoId mudarem
  const storageKey = useMemo(
    () => `@geniusfactory:questao-estado-${blocoId}-${questao.id}`,
    [blocoId, questao.id]
  );
  const respostaKey = useMemo(
    () => `@geniusfactory:resposta-bloco-${blocoId}-${questao.id}`,
    [blocoId, questao.id]
  );
  
  // SEGUNDO: Resetar estado quando questao.id mudar (apenas se for uma questão diferente)
  useEffect(() => {
    // IMPORTANTE: Este useEffect só reseta o estado se a questão realmente mudou
    // Se for a mesma questão sendo remontada, não reseta nada - deixa a restauração acontecer
    if (questaoIdRef.current !== questao.id) {
      questaoIdRef.current = questao.id;
      estadoRestauradoRef.current = false;
      // Resetar todos os estados quando a questão muda
      setFeedback(null);
      setSelectedIndex(null);
      setRespostaTexto("");
      setRespostasBlocoRapido([]);
      setFeedbacksBlocoRapido([]);
      setRespostasLigarColunas({});
      setFeedbacksLigarColunas({});
      setCorretasLigarColunas({});
      setRespostasSelecaoMultipla({ selecionadas: [] });
      setCorretasSelecaoMultipla([]);
      setRespostasCompletar([]);
      setFeedbacksCompletar([]);
      setRespostasCompletarTopo({ respostasAluno: [], ordemTopo: [] });
      setFeedbacksCompletarTopo({});
      setRespostasTabela(null);
      setFeedbacksTabela(null);
      setRespostasColorir({ partesMarcadas: [] });
      setValidationError(null);
      setSubmitting(false);
    }
    // Se é a mesma questão (componente remontado), não faz nada
    // O useEffect de restauração cuidará de restaurar o estado
  }, [questao.id]);

  // Atualizar ref quando callback mudar
  useEffect(() => {
    onMarcarConcluidaRef.current = onMarcarConcluida;
  }, [onMarcarConcluida]);

  const alternativas = useMemo(() => normalizeAlternativas(questao), [questao]);
  const imagensAlternativas = useMemo(() => questao.imagensAlternativas ?? [], [questao.imagensAlternativas]);
  
  const contentWidth = useMemo(() => Math.min(width, 600) - 40, [width]);
  const htmlSource = useMemo(
    () => ({
      html: questao.enunciado?.trim() ? questao.enunciado : "<p>Enunciado indisponível.</p>",
    }),
    [questao.enunciado],
  );

  const defaultTextPropsEnunciado = useMemo(() => ({ selectable: false }), []);
  const tagsStylesEnunciado = useMemo(() => ({
    p: styles.paragraph,
    strong: styles.strong,
    b: styles.strong,
    em: styles.em,
    i: styles.em,
  }), []);

  const isObjetiva = questao.tipo === "multipla_escolha" || questao.tipo === "certa_errada";
  const isDissertativa = questao.tipo === "dissertativa" || questao.tipo === "objetiva_curta";
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
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const temDica = Boolean(questao.dica);
  const temComentarios = Boolean(questao.comentarioTexto) || Boolean(questao.comentarioVideoUrl);
  const temConteudoExtra = temDica || temComentarios;

  const abrirConteudoExtra = useCallback((aba?: 'dica' | 'texto' | 'forum' | 'estatisticas') => {
    conteudoExtraRef.current?.open(aba);
  }, [temComentarios, temConteudoExtra, temDica, questao.id]);

  const abrirConteudoExtraComScroll = useCallback(
    (aba?: 'dica' | 'texto' | 'forum' | 'estatisticas') => {
      conteudoExtraRef.current?.open(aba);
    },
    [questao.id]
  );

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

  // Função para salvar estado completo no AsyncStorage
  const salvarEstado = useCallback(async () => {
    try {
      const estado: EstadoPersistido = {
        feedback,
        selectedIndex,
        respostaTexto,
        respostasBlocoRapido,
        feedbacksBlocoRapido,
        respostasLigarColunas,
        feedbacksLigarColunas,
        corretasLigarColunas,
        respostasSelecaoMultipla,
        corretasSelecaoMultipla,
        respostasCompletar,
        feedbacksCompletar,
        respostasCompletarTopo,
        feedbacksCompletarTopo,
        respostasTabela,
        feedbacksTabela,
        respostasColorir,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(estado));

      // Também salva flag simples para compatibilidade
      if (feedback?.status === "ok" && questaoIdRef.current === questao.id) {
        await AsyncStorage.setItem(respostaKey, JSON.stringify({ respondido: true }));
      }
    } catch (error) {
      // Ignora erros ao salvar estado
    }
  }, [
    storageKey,
    respostaKey,
    feedback,
    selectedIndex,
    respostaTexto,
    respostasBlocoRapido,
    feedbacksBlocoRapido,
    respostasLigarColunas,
    feedbacksLigarColunas,
    corretasLigarColunas,
    respostasSelecaoMultipla,
    corretasSelecaoMultipla,
    respostasCompletar,
    feedbacksCompletar,
    respostasCompletarTopo,
    feedbacksCompletarTopo,
    respostasTabela,
    feedbacksTabela,
    respostasColorir,
    questao.id,
  ]);

  // Restaurar estado do AsyncStorage quando componente monta ou questao.id muda
  // Restaurar estado do AsyncStorage quando componente monta ou questao.id muda
  useEffect(() => {
    // Sempre tenta restaurar quando o componente monta ou quando questao.id muda
    // IMPORTANTE: Resetar o flag ANTES de tentar restaurar para garantir que sempre tenta
    estadoRestauradoRef.current = false;
    
    async function restaurarEstado() {
      try {
        // PRIMEIRO: Verificar se o bloco está em modo "refazer"
        const refazerKey = `@geniusfactory:refazer-bloco-${blocoId}`;
        const emModoRefazer = await AsyncStorage.getItem(refazerKey);
        
        // Se está em modo refazer, NÃO restaura nada
        if (emModoRefazer === 'true') {
          estadoRestauradoRef.current = true;
          return;
        }
        
        const raw = await AsyncStorage.getItem(storageKey);
        
        if (!raw) {
          estadoRestauradoRef.current = true;
          return;
        }

        const estadoSalvo: EstadoPersistido = JSON.parse(raw);

        // Restaurar feedback (indica se foi respondido)
        if (estadoSalvo.feedback) {
          setFeedback(estadoSalvo.feedback);
        }

        // Restaurar respostas específicas por tipo
        if (typeof estadoSalvo.selectedIndex === 'number') {
          setSelectedIndex(estadoSalvo.selectedIndex);
        }
        if (typeof estadoSalvo.respostaTexto === 'string') {
          setRespostaTexto(estadoSalvo.respostaTexto);
        }
        if (Array.isArray(estadoSalvo.respostasBlocoRapido)) {
          setRespostasBlocoRapido(estadoSalvo.respostasBlocoRapido);
          if (Array.isArray(estadoSalvo.feedbacksBlocoRapido)) {
            setFeedbacksBlocoRapido(estadoSalvo.feedbacksBlocoRapido);
          }
        }
        if (estadoSalvo.respostasLigarColunas) {
          setRespostasLigarColunas(estadoSalvo.respostasLigarColunas);
          if (estadoSalvo.feedbacksLigarColunas) {
            setFeedbacksLigarColunas(estadoSalvo.feedbacksLigarColunas);
          }
          if (estadoSalvo.corretasLigarColunas) {
            setCorretasLigarColunas(estadoSalvo.corretasLigarColunas);
          }
        }
        if (estadoSalvo.respostasSelecaoMultipla) {
          setRespostasSelecaoMultipla(estadoSalvo.respostasSelecaoMultipla);
          if (Array.isArray(estadoSalvo.corretasSelecaoMultipla)) {
            setCorretasSelecaoMultipla(estadoSalvo.corretasSelecaoMultipla);
          }
        }
        if (Array.isArray(estadoSalvo.respostasCompletar)) {
          setRespostasCompletar(estadoSalvo.respostasCompletar);
          if (Array.isArray(estadoSalvo.feedbacksCompletar)) {
            setFeedbacksCompletar(estadoSalvo.feedbacksCompletar);
          }
        }
        if (estadoSalvo.respostasCompletarTopo) {
          setRespostasCompletarTopo(estadoSalvo.respostasCompletarTopo);
          if (estadoSalvo.feedbacksCompletarTopo) {
            setFeedbacksCompletarTopo(estadoSalvo.feedbacksCompletarTopo);
          }
        }
        if (estadoSalvo.respostasTabela) {
          setRespostasTabela(estadoSalvo.respostasTabela);
          if (estadoSalvo.feedbacksTabela) {
            setFeedbacksTabela(estadoSalvo.feedbacksTabela);
          }
        }
        if (estadoSalvo.respostasColorir) {
          setRespostasColorir(estadoSalvo.respostasColorir);
        }

        estadoRestauradoRef.current = true;
      } catch (error) {
        estadoRestauradoRef.current = true;
      }
    }

    // Sempre tenta restaurar quando o componente monta
    restaurarEstado();
  }, [storageKey, questao.id, blocoId]);

  // Salvar estado sempre que feedback muda (questão foi respondida)
  useEffect(() => {
    // Só salva se o estado já foi restaurado (evita salvar estado de outra questão)
    // E só salva se for esta questão específica (garantido pelo questaoIdRef)
    if (estadoRestauradoRef.current && questaoIdRef.current === questao.id && feedback?.status === "ok") {
      // Salva o estado primeiro
      salvarEstado().then(() => {
        // Depois de salvar, chama callback para marcar página como concluída (apenas uma vez por resposta)
        const foiMarcadaKey = `@geniusfactory:marcada-${blocoId}-${questao.id}`;
        AsyncStorage.getItem(foiMarcadaKey).then((marcada) => {
          if (!marcada) {
            // Chama o callback para marcar como concluída
            onMarcarConcluidaRef.current();
            // Marca a flag para evitar chamar novamente
            AsyncStorage.setItem(foiMarcadaKey, "true").catch(() => {
              // Ignora erros ao salvar flag
            });
          }
        }).catch(() => {
          // Se houver erro, tenta chamar mesmo assim para garantir que a página seja marcada
          onMarcarConcluidaRef.current();
        });
      }).catch(() => {
        // Mesmo com erro ao salvar, tenta marcar como concluída
        const foiMarcadaKey = `@geniusfactory:marcada-${blocoId}-${questao.id}`;
        AsyncStorage.getItem(foiMarcadaKey).then((marcada) => {
          if (!marcada) {
            onMarcarConcluidaRef.current();
          }
        });
      });
    }
  }, [feedback, salvarEstado, blocoId, questao.id]);

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
        const corretaLetra =
          (() => {
            const candidato =
              (result as any)?.alternativaCorreta ??
              (result as any)?.respostaCorreta ??
              (result as any)?.gabarito ??
              (result as any)?.corretaAlternativa ??
              (result as any)?.letraCorreta ??
              (result as any)?.alternativaCorretaIndex ??
              (result as any)?.resposta_correta ??
              null;

            if (typeof candidato === "string") {
              const clean = candidato.trim().toUpperCase();
              if (clean.length === 1 && /[A-Z]/.test(clean)) {
                return clean;
              }
              const ordem = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
              const idx = parseInt(clean, 10);
              if (!Number.isNaN(idx) && idx >= 0 && idx < ordem.length) {
                return ordem[idx];
              }
            }

            if (typeof candidato === "number" && Number.isInteger(candidato)) {
              const ordem = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
              if (candidato >= 0 && candidato < ordem.length) {
                return ordem[candidato];
              }
            }

            return null;
          })();

        setFeedback({
          status: "ok",
          acertou: !!result?.acertou,
          corretaLetra,
        });
      } else if (isDissertativa) {
        if (questao.tipo === "objetiva_curta") {
          const result = await corrigirObjetivaCurta(questao.id, respostaTexto);
          setFeedback({ 
            status: "ok", 
            acertou: !!result?.acertou,
          });
        } else {
          const result = await corrigirDissertativa(questao.id, respostaTexto);
          setFeedback({ 
            status: "ok", 
            acertou: !!result?.acertou,
            nota: result?.nota,
            justificativa: result?.justificativa,
            sugestao: result?.sugestao,
          });
        }
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
    
    if (questao.tipo === "dissertativa" && feedback.status === "ok") {
      return null;
    }
    
    if (feedback.acertou) {
      return "Parabéns! Você recebeu +10 Genius Coins! 💰🪙🪙";
    }

    if (isObjetiva) {
      const letra = feedback.corretaLetra ?? "—";
      return `Você errou! Resposta correta: ${letra}`;
    }

    return "Resposta incorreta. Verifique os comentários.";
  })();

  const respondido = feedback?.status === "ok";
  const corretaObjetiva = isObjetiva && feedback?.status === "ok"
    ? (() => {
        const letra = feedback.corretaLetra;
        if (!letra) return null;
        const idx = letra.charCodeAt(0) - 65;
        if (idx < 0 || idx >= alternativas.length) return null;
        return idx;
      })()
    : null;

  return (
    <>
      <View ref={cardRef} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.codigo}>{questao.codigo}</Text>
            {questao.materia?.nome ? (
              <View style={styles.headerChips}>
                <Text style={styles.headerChipMateria}>{questao.materia.nome}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.infoBadge,
                !(temConteudoExtra || temDica) && styles.infoBadgeDisabled,
              ]}
              disabled={!(temConteudoExtra || temDica)}
              onPress={() => {
                if (temConteudoExtra) {
                  abrirConteudoExtra("texto");
                } else if (temDica) {
                  abrirConteudoExtra("dica");
                } else {
                  abrirConteudoExtra();
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#EB1480" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.enunciadoWrapper}>
          <RenderHTML
            contentWidth={contentWidth}
            source={htmlSource}
            baseStyle={styles.enunciado}
            defaultTextProps={defaultTextPropsEnunciado}
            tagsStyles={tagsStylesEnunciado}
          />
        </View>

        {(isObjetiva && alternativas.length > 0) ? (
          <View style={styles.alternativas}>
            {alternativas.map((alt: string, index: number) => {
              const letra = String.fromCharCode(65 + index);
              const selected = selectedIndex === index;
              const correta = respondido && corretaObjetiva === index;
              const imagemUrl = imagensAlternativas[index];
              const hasImage = !!imagemUrl;
              const hasText = alt.trim().length > 0;

  return (
                <View key={`${questao.id}-alt-${index}`} style={styles.alternativaWrapper}>
                  <TouchableOpacity
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
                      correta && styles.alternativaRowCorreta,
                    ]}
                  >
                    <View
                      style={[
                        styles.alternativaBullet,
                        selected && styles.alternativaBulletSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.alternativaLabel,
                          selected && styles.alternativaLabelSelected,
                        ]}
                      >
                        {letra}
                      </Text>
                    </View>

                    <View style={styles.alternativaContent}>
                      {hasImage && (
                        <Image
                          source={{ uri: imagemUrl }}
                          style={styles.alternativaImagem}
                          resizeMode="contain"
                        />
                      )}
                      <View style={styles.alternativaTextoArea}>
                        {hasText && (
                          <Text
                            style={[
                              styles.alternativaTexto,
                              (selected || correta) && styles.alternativaTextoSelected,
                            ]}
                          >
                            {alt}
                          </Text>
                        )}
                        {correta ? (
                          <Ionicons name="checkmark-circle" size={18} color="#30C58E" />
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
    </View>
        ) : null}

        {isDissertativa && (
          <View style={styles.dissertativaContainer}>
            <Text style={styles.dissertativaLabel}>
              {questao.tipo === "objetiva_curta"
                ? "Digite sua resposta curta:"
                : "Escreva sua resposta:"}
            </Text>
            <TextInput
              value={respostaTexto}
              onChangeText={setRespostaTexto}
              multiline={questao.tipo === "dissertativa"}
              numberOfLines={questao.tipo === "dissertativa" ? 8 : 3}
              textAlignVertical="top"
              placeholder={
                questao.tipo === "dissertativa"
                  ? "Digite sua resposta aqui..."
                  : "Resposta"
              }
              editable={!respondido}
              style={[
                styles.dissertativaInput,
                questao.tipo === "objetiva_curta" && styles.objetivaCurtaInput,
                respondido && styles.dissertativaInputDisabled,
              ]}
            />
            {questao.tipo === "dissertativa" ? (
              <Text style={styles.charCounter}>{respostaTexto.length} caracteres</Text>
            ) : null}
          </View>
        )}

        {isBlocoRapido && blocoRapidoItens.length > 0 && (
          <BlocoRapidoAluno
            respondido={respondido}
            blocoRapido={blocoRapidoItens}
            respostasAluno={respostasBlocoRapido}
            setRespostasAluno={setRespostasBlocoRapido}
            feedbacks={respondido ? feedbacksBlocoRapido : undefined}
          />
        )}

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

            {questao.tipo === "dissertativa" && feedback?.status === "ok" && (
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

            {respondido && temConteudoExtra && (
              <TouchableOpacity
                style={styles.acessoRapidoBtn}
                onPress={() => abrirConteudoExtraComScroll('texto')}
                activeOpacity={0.85}
              >
                <View style={styles.acessoRapidoContent}>
                  <Ionicons name="bulb" size={20} color="#F59E0B" />
                  <View style={styles.acessoRapidoTextos}>
                    <Text style={styles.acessoRapidoTitulo}>
                      Ver Explicação Completa
                    </Text>
                    <Text style={styles.acessoRapidoSubtitulo}>
                      Comentários e Dicas
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.botoesAcao}>
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
          </View>
        )}
      </View>

      <ConteudoExtraModal
        ref={conteudoExtraRef}
        questaoId={questao.id}
        dica={questao.dica}
        comentarioTexto={questao.comentarioTexto}
        comentarioVideoUrl={questao.comentarioVideoUrl}
        respondido={respondido}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada: só re-renderiza se questao.id, blocoId ou atividadeId mudarem
  // Isso previne re-renders desnecessários e garante isolamento entre questões
  return (
    prevProps.questao.id === nextProps.questao.id &&
    prevProps.blocoId === nextProps.blocoId &&
    prevProps.trilhaId === nextProps.trilhaId &&
    prevProps.caminhoId === nextProps.caminhoId &&
    prevProps.atividadeId === nextProps.atividadeId
  );
});

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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoBadge: {
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBadgeDisabled: {
    opacity: 0.5,
  },
  codigo: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111827",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerChips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerChipMateria: {
    backgroundColor: "#FDF2FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-Medium",
    color: "#EB1480",
  },
  enunciadoWrapper: {
    marginTop: 4,
  },
  enunciado: {
    fontSize: 15,
    lineHeight: 20,
    color: "#111827",
    textAlign: "justify",
  },
  paragraph: {
    marginBottom: 8,
    fontSize: 15,
    lineHeight: 20,
    color: "#111827",
    textAlign: "justify",
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
  alternativaWrapper: {
    position: "relative",
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
  alternativaRowSelected: {},
  alternativaRowCorreta: {
    backgroundColor: "#F5EAFE",
    borderColor: "#C084FC",
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
    borderColor: "#A855F7",
    backgroundColor: "#A855F7",
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
    color: "#111827",
  },
  alternativaTextoArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
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
  objetivaCurtaInput: {
    minHeight: 60,
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
  responderArea: {
    marginTop: 4,
    gap: 10,
  },
  botoesAcao: {
    flexDirection: "row",
    gap: 8,
  },
  responderBtn: {
    flex: 1,
    backgroundColor: "#30C58E",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  responderBtnDisabled: {
    opacity: 0.6,
  },
  responderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    lineHeight: 24,
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
  acessoRapidoBtn: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    padding: 16,
    marginTop: 8,
  },
  acessoRapidoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  acessoRapidoTextos: {
    flex: 1,
    gap: 2,
  },
  acessoRapidoTitulo: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5B21B6',
    fontFamily: 'Inter-Medium',
  },
  acessoRapidoSubtitulo: {
    fontSize: 12,
    color: '#7C3AED',
    fontFamily: 'Inter-Medium',
  },
});
