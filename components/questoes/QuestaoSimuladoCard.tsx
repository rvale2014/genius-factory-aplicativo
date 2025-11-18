import React, { useCallback, useMemo } from "react";
import {
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
import CompletarTopoAluno, {
  ConteudoCompletarTopo,
} from "./CompletarTopoAluno";
import LigarColunasAluno from "./LigarColunasAluno";
import QuestaoTabela from "./QuestaoTabela";
import SelecaoMultiplaAluno, {
  SelecaoMultiplaAlternativa,
} from "./SelecaoMultiplaAluno";
import {
  normalizeAlternativas,
  parseConteudo,
} from "./utils";

export type QuestaoSimuladoData = {
  id: string;
  tipo: string;
  enunciado: string;
  alternativas?: string[] | null;
  imagensAlternativas?: string[] | null;
  imagemUrl?: string | null;
  blocoRapido?: any;
  ligarColunas?: any;
  conteudo?: any;
};

type Props = {
  questao: QuestaoSimuladoData;
  resposta: any;
  onChange: (valor: any) => void;
};

function sanitizeTextoLivre(valor: any) {
  return typeof valor === "string" ? valor : "";
}

export default function QuestaoSimuladoCard({
  questao,
  resposta,
  onChange,
}: Props) {
  const { width } = useWindowDimensions();

  const alternativas = useMemo(
    () => normalizeAlternativas(questao),
    [questao],
  );
  const imagensAlternativas = useMemo(
    () => questao.imagensAlternativas ?? [],
    [questao.imagensAlternativas],
  );

  const htmlSource = useMemo(
    () => ({
      html: questao.enunciado?.trim()
        ? questao.enunciado
        : "<p>Enunciado indisponível.</p>",
    }),
    [questao.enunciado],
  );

  // Memoizar props do RenderHTML para evitar rerenders desnecessários
  const defaultTextPropsSimulado = useMemo(() => ({ selectable: false }), []);
  const tagsStylesSimulado = useMemo(() => ({
    p: styles.paragraph,
    strong: styles.strong,
    b: styles.strong,
    em: styles.em,
    i: styles.em,
  }), []);

  const isObjetiva =
    questao.tipo === "multipla_escolha" || questao.tipo === "certa_errada";
  const isDissertativa =
    questao.tipo === "dissertativa" || questao.tipo === "objetiva_curta";
  const isBlocoRapido = questao.tipo === "bloco_rapido";
  const isLigarColunas = questao.tipo === "ligar_colunas";
  const isSelecaoMultipla = questao.tipo === "selecao_multipla";
  const isCompletar = questao.tipo === "completar";
  const isCompletarTopo = questao.tipo === "completar_topo";
  const isTabela = questao.tipo === "tabela";
  const isColorir = questao.tipo === "colorir_figura";

  const selectedIndex =
    isObjetiva && typeof resposta === "number" ? resposta : null;
  const respostaTexto = sanitizeTextoLivre(resposta);

  const blocoRapidoItens = useMemo(() => {
    if (!isBlocoRapido) return [];
    if (Array.isArray(questao.blocoRapido)) {
      return questao.blocoRapido;
    }
    if (typeof questao.blocoRapido === "string") {
      try {
        return JSON.parse(questao.blocoRapido);
      } catch {
        return [];
      }
    }
    return [];
  }, [isBlocoRapido, questao.blocoRapido]);

  const ligarColunasItens = useMemo(() => {
    if (!isLigarColunas) return [];
    if (Array.isArray(questao.ligarColunas)) return questao.ligarColunas;
    if (typeof questao.ligarColunas === "string") {
      try {
        return JSON.parse(questao.ligarColunas);
      } catch {
        return [];
      }
    }
    return [];
  }, [isLigarColunas, questao.ligarColunas]);

  const selecaoMultiplaAlternativas = useMemo(() => {
    if (!isSelecaoMultipla) return [];
    const conteudo = parseConteudo(questao.conteudo);
    const alternativasBrutas = Array.isArray(conteudo?.alternativas)
      ? conteudo.alternativas
      : [];

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
      .filter(
        (alt: SelecaoMultiplaAlternativa | null): alt is SelecaoMultiplaAlternativa =>
          !!alt && alt.texto.trim().length > 0,
      );
  }, [isSelecaoMultipla, questao.conteudo, questao.id]);

  const completarFrases = useMemo(() => {
    if (!isCompletar) return [];
    const conteudo = parseConteudo(questao.conteudo);
    const frasesBrutas = Array.isArray(conteudo?.frases)
      ? conteudo.frases
      : [];

    return frasesBrutas
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
        if (typeof primeira !== "string" || typeof segunda !== "string")
          return null;

        return {
          id: String(frase?.id ?? `${questao.id}-completar-${index}`),
          textoBase,
          opcoes: [primeira, segunda] as [string, string],
          explicacao: typeof frase?.explicacao === "string"
            ? frase.explicacao
            : null,
        };
      })
      .filter(
        (
          item:
            | {
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

  const completarTopoConteudo = useMemo<ConteudoCompletarTopo | null>(() => {
    if (!isCompletarTopo) return null;
    const conteudo = parseConteudo(questao.conteudo);

    const frasesBrutas = Array.isArray(conteudo?.frases)
      ? conteudo.frases
      : [];
    const frasesNormalizadas = frasesBrutas
      .map((frase: any) => {
        if (typeof frase === "string") return frase;
        if (typeof frase?.texto === "string") return frase.texto;
        return "";
      })
      .filter((texto: string) => texto && /_{3,}/.test(texto));

    if (frasesNormalizadas.length === 0) return null;

    const lacunasBrutas = Array.isArray(conteudo?.lacunas)
      ? conteudo.lacunas
      : [];
    const lacunasNormalizadas = lacunasBrutas.map((lacuna: any, index: number) => ({
      id: String(
        lacuna?.id ??
          lacuna?.lacunaId ??
          `${questao.id}-completar-topo-lacuna-${index}`,
      ),
    }));

    const palavrasBrutas = Array.isArray(conteudo?.palavrasTopo)
      ? conteudo.palavrasTopo
      : [];
    const palavrasNormalizadas = palavrasBrutas
      .map(
        (
          palavra: any,
          index: number,
        ): { id: string; texto: string; distrator?: boolean } | null => {
          if (!palavra) return null;
          if (typeof palavra === "string") {
            const texto = palavra.trim();
            if (!texto) return null;
            return {
              id: `${questao.id}-completar-topo-palavra-${index}`,
              texto,
            };
          }

          const texto = typeof palavra?.texto === "string"
            ? palavra.texto.trim()
            : "";
          if (!texto) return null;

          return {
            id: String(
              palavra?.id ??
                `${questao.id}-completar-topo-palavra-${index}`,
            ),
            texto,
            distrator: !!palavra?.distrator,
          };
        },
      )
      .filter(
        (
          item:
            | { id: string; texto: string; distrator?: boolean }
            | null,
        ): item is { id: string; texto: string; distrator?: boolean } =>
          !!item && item.texto.length > 0,
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

  const respostasSelecaoMultipla = useMemo(() => {
    if (
      resposta &&
      typeof resposta === "object" &&
      Array.isArray(resposta.selecionadas)
    ) {
      return {
        selecionadas: resposta.selecionadas.map(String),
      };
    }
    return { selecionadas: [] as string[] };
  }, [resposta]);

  const respostasCompletar = useMemo(() => {
    if (Array.isArray(resposta)) {
      return resposta.map((item) =>
        typeof item === "string" ? item : "",
      );
    }
    return [] as string[];
  }, [resposta]);

  const respostasCompletarTopo = useMemo(() => {
    if (
      resposta &&
      typeof resposta === "object" &&
      Array.isArray(resposta.respostasAluno)
    ) {
      return resposta;
    }
    return {
      respostasAluno: [],
      ordemTopo: [],
    };
  }, [resposta]);

  const respostasTabela = useMemo(() => {
    if (resposta && typeof resposta === "object") {
      return resposta;
    }
    return null;
  }, [resposta]);

  const respostasColorir = useMemo(() => {
    if (
      resposta &&
      typeof resposta === "object" &&
      Array.isArray(resposta.partesMarcadas)
    ) {
      return {
        partesMarcadas: resposta.partesMarcadas.map(String),
      };
    }
    return { partesMarcadas: [] as string[] };
  }, [resposta]);

  const respostasBlocoRapido = useMemo(() => {
    if (Array.isArray(resposta)) {
      return resposta.map((item) =>
        typeof item === "string" ? item : "",
      );
    }
    return [] as string[];
  }, [resposta]);

  const respostasLigarColunas = useMemo(() => {
    if (resposta && typeof resposta === "object") {
      return resposta;
    }
    return {};
  }, [resposta]);

  const handleSelecaoMultiplaChange = useCallback(
    (value: { selecionadas: string[] }) => {
      onChange(value);
    },
    [onChange],
  );

  const handleCompletarChange = useCallback(
    (value: string[]) => {
      onChange(value);
    },
    [onChange],
  );

  const handleCompletarTopoChange = useCallback(
    (snapshot: {
      respostasAluno: Array<{ lacunaId: string; valor: string }>;
      ordemTopo: string[];
    }) => {
      onChange(snapshot);
    },
    [onChange],
  );

  const handleTabelaChange = useCallback(
    (value: any) => {
      onChange(value);
    },
    [onChange],
  );

  const handleColorirChange = useCallback(
    (value: { partesMarcadas: string[] }) => {
      onChange(value);
    },
    [onChange],
  );

  const handleBlocoRapidoChange = useCallback(
    (value: string[]) => {
      onChange(value);
    },
    [onChange],
  );

  const handleLigarColunasChange = useCallback(
    (value: Record<string, string>) => {
      onChange(value);
    },
    [onChange],
  );

  const contentWidth = useMemo(() => Math.min(width, 600) - 40, [width]);

  return (
    <View style={styles.container}>
      <RenderHTML
        contentWidth={contentWidth}
        source={htmlSource}
        baseStyle={styles.enunciado}
        defaultTextProps={defaultTextPropsSimulado}
        tagsStyles={tagsStylesSimulado}
      />

      {isObjetiva && alternativas.length > 0 ? (
        <View style={styles.alternativas}>
          {alternativas.map((alt: string, index: number) => {
            const letra = String.fromCharCode(65 + index);
            const selected = selectedIndex === index;
            const imagemUrl = imagensAlternativas[index];
            const hasImage = !!imagemUrl;
            const hasText = alt.trim().length > 0;

            return (
              <View key={`${questao.id}-alt-${index}`} style={styles.alternativaWrapper}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onChange(index)}
                  style={[
                    styles.alternativaRow,
                    selected && styles.alternativaRowSelected,
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
                    {hasImage ? (
                      <Image
                        source={{ uri: imagemUrl }}
                        style={styles.alternativaImagem}
                        resizeMode="contain"
                      />
                    ) : null}

                    {hasText ? (
                      <Text
                        style={[
                          styles.alternativaTexto,
                          selected && styles.alternativaTextoSelected,
                        ]}
                      >
                        {alt}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : null}

      {isDissertativa ? (
        <View style={styles.dissertativaContainer}>
          <Text style={styles.dissertativaLabel}>
            {questao.tipo === "objetiva_curta"
              ? "Digite sua resposta curta:"
              : "Escreva sua resposta:"}
          </Text>
          <TextInput
            value={respostaTexto}
            onChangeText={onChange}
            multiline={questao.tipo === "dissertativa"}
            numberOfLines={questao.tipo === "dissertativa" ? 8 : 3}
            textAlignVertical="top"
            placeholder={
              questao.tipo === "dissertativa"
                ? "Digite sua resposta aqui..."
                : "Resposta"
            }
            style={[
              styles.dissertativaInput,
              questao.tipo === "objetiva_curta" && styles.objetivaCurtaInput,
            ]}
          />
          {questao.tipo === "dissertativa" ? (
            <Text style={styles.charCounter}>
              {respostaTexto.length} caracteres
            </Text>
          ) : null}
        </View>
      ) : null}

      {isBlocoRapido && blocoRapidoItens.length > 0 ? (
        <BlocoRapidoAluno
          respondido={false}
          blocoRapido={blocoRapidoItens}
          respostasAluno={respostasBlocoRapido}
          setRespostasAluno={handleBlocoRapidoChange}
        />
      ) : null}

      {isLigarColunas && ligarColunasItens.length > 0 ? (
        <LigarColunasAluno
          respondido={false}
          ligarColunas={ligarColunasItens}
          respostasAluno={respostasLigarColunas}
          setRespostasAluno={handleLigarColunasChange}
        />
      ) : null}

      {isSelecaoMultipla && selecaoMultiplaAlternativas.length > 0 ? (
        <SelecaoMultiplaAluno
          respondido={false}
          alternativas={selecaoMultiplaAlternativas}
          respostasAluno={respostasSelecaoMultipla}
          setRespostasAluno={handleSelecaoMultiplaChange}
        />
      ) : null}

      {isCompletarTopo && completarTopoConteudo ? (
        <CompletarTopoAluno
          respondido={false}
          conteudo={completarTopoConteudo}
          respostasAluno={respostasCompletarTopo}
          setRespostasAluno={handleCompletarTopoChange}
        />
      ) : null}

      {isTabela && tabelaConteudo ? (
        <QuestaoTabela
          respondido={false}
          conteudo={tabelaConteudo}
          respostasAluno={respostasTabela}
          setRespostasAluno={handleTabelaChange}
        />
      ) : null}

      {isColorir && colorirConteudo ? (
        <ColorirFiguraAluno
          respondido={false}
          conteudo={colorirConteudo}
          respostasAluno={respostasColorir}
          setRespostasAluno={handleColorirChange}
        />
      ) : null}

      {isCompletar && completarFrases.length > 0 ? (
        <CompletarAluno
          respondido={false}
          frases={completarFrases}
          respostasAluno={respostasCompletar}
          setRespostasAluno={handleCompletarChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  enunciado: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111827",
    textAlign: "justify",
    fontFamily: "Inter",
  },
  paragraph: {
    marginBottom: 10,
    fontSize: 16,
    lineHeight: 24,
    color: "#111827",
    textAlign: "justify",
    fontFamily: "Inter",
  },
  strong: {
    fontWeight: "700",
    fontFamily: "Inter-SemiBold",
  },
  em: {
    fontStyle: "italic",
    fontFamily: "Inter",
  },
  alternativas: {
    gap: 12,
  },
  alternativaWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  alternativaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  alternativaRowSelected: {
    borderColor: "#C4B5FD",
    backgroundColor: "#F5F3FF",
  },
  alternativaBullet: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  alternativaLabel: {
    fontSize: 15,
    color: "#7C3AED",
    fontFamily: "Inter-SemiBold",
  },
  alternativaLabelSelected: {
    color: "#FFFFFF",
  },
  alternativaContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alternativaTexto: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
    fontFamily: "Inter",
  },
  alternativaTextoSelected: {
    color: "#5B21B6",
  },
  alternativaImagem: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  dissertativaContainer: {
    gap: 8,
  },
  dissertativaLabel: {
    fontSize: 14,
    color: "#4B5563",
    fontFamily: "Inter-Medium",
  },
  dissertativaInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    fontFamily: "Inter",
  },
  objetivaCurtaInput: {
    minHeight: 60,
  },
  charCounter: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
  },
});

