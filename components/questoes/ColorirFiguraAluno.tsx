// components/questoes/ColorirFiguraAluno.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export type ParteSvg = { id: string; correta: boolean };

export type ConteudoColorir = {
  tipo: "colorir_figura";
  svgHtml: string;
  partes: ParteSvg[];
  paleta?: { corAcerto?: string; corSelecao?: string };
};

type Props = {
  respondido: boolean;
  conteudo: ConteudoColorir;
  respostasAluno: { partesMarcadas: string[] };
  setRespostasAluno: (value: { partesMarcadas: string[] }) => void;
};

const ERRO_COLOR = "#ef4444"; // Vermelho para erro
const ACERTO_COLOR = "#22c55e"; // Verde para acerto
const SELECAO_COLOR = "#60a5fa"; // Azul para seleção (modo resolução)

function buildHtml(conteudo: ConteudoColorir, respondido: boolean) {
  const svgHtml = conteudo?.svgHtml ?? "";
  const partes = Array.isArray(conteudo?.partes) ? conteudo.partes : [];
  const corSelecao = conteudo?.paleta?.corSelecao ?? SELECAO_COLOR;
  const corAcerto = conteudo?.paleta?.corAcerto ?? ACERTO_COLOR;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 8px;
        overflow: auto;
      }
      #wrapper {
        max-width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      svg {
        max-width: 100%;
        height: auto;
      }
    </style>
  </head>
  <body>
    <div id="wrapper">${svgHtml}</div>
    <script>
      const partes = ${JSON.stringify(partes)};
      const corSelecao = ${JSON.stringify(corSelecao)};
      const corAcerto = ${JSON.stringify(corAcerto)};
      const corErro = ${JSON.stringify(ERRO_COLOR)};

      let selecionadas = new Set();
      let respondido = ${respondido};

      function obterShapes(root) {
        if (!root) return [];
        if (root.matches("path,rect,polygon,circle,ellipse,polyline")) {
          return [root];
        }
        return Array.from(
          root.querySelectorAll("path,rect,polygon,circle,ellipse,polyline")
        );
      }

      function aplicarEstilos() {
        console.log('[WebView] Aplicando estilos. Respondido:', respondido, 'Selecionadas:', Array.from(selecionadas));
        
        partes.forEach((parte) => {
          const root = document.getElementById(parte.id);
          if (!root) {
            console.warn('[WebView] Parte não encontrada:', parte.id);
            return;
          }
          const shapes = obterShapes(root);

          // Reset styles
          shapes.forEach((shape) => {
            shape.style.stroke = "";
            shape.style.strokeWidth = "";
            shape.style.fill = "";
          });

          const marcada = selecionadas.has(parte.id);
          const correta = !!parte.correta;

          console.log('[WebView] Parte:', parte.id, '| Marcada:', marcada, '| Correta:', correta);

          shapes.forEach((shape) => {
            if (!respondido) {
              // Modo resolução: azul se marcada
              if (marcada) {
                shape.style.fill = corSelecao;
                console.log('[WebView] Aplicando cor de seleção:', corSelecao);
              }
              return;
            }

            // Modo correção
            if (marcada && correta) {
              // ✅ Marcou certo: verde
              shape.style.fill = corAcerto;
              console.log('[WebView] Aplicando cor de acerto:', corAcerto);
            } else if (marcada && !correta) {
              // ❌ Marcou errado: vermelho
              shape.style.fill = corErro;
              console.log('[WebView] Aplicando cor de erro:', corErro);
            } else if (!marcada && correta) {
              // Não marcou, mas era correta: borda verde (indicação)
              shape.style.stroke = corAcerto;
              shape.style.strokeWidth = "3px";
              console.log('[WebView] Aplicando borda de acerto');
            }
            // Se não marcou e não era correta, deixa sem estilo (cinza)
          });
        });
      }

      function toggleParte(id) {
        if (respondido) return; // Não permite interação quando respondido
        if (selecionadas.has(id)) {
          selecionadas.delete(id);
        } else {
          selecionadas.add(id);
        }
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: "selection",
            partesMarcadas: Array.from(selecionadas),
          })
        );
        aplicarEstilos();
      }

      function prepararFundo() {
        const elementos = document.querySelectorAll("rect:not([id])");
        elementos.forEach((el) => {
          const dentroParte = partes.some((parte) => {
            const root = document.getElementById(parte.id);
            if (!root) return false;
            return el.closest("#" + parte.id);
          });
          if (!dentroParte) {
            el.style.pointerEvents = "none";
          }
        });
      }

      function registrarListeners() {
        if (respondido) {
          // No modo correção, desabilita cliques
          console.log('[WebView] Modo correção - listeners desabilitados');
          return;
        }

        partes.forEach((parte) => {
          const root = document.getElementById(parte.id);
          if (!root) return;
          const shapes = obterShapes(root);

          root.style.pointerEvents = "all";
          root.style.cursor = "pointer";
          shapes.forEach((shape) => {
            shape.style.pointerEvents = "all";
            shape.style.cursor = "pointer";
            shape.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleParte(parte.id);
            });
          });
        });
      }

      function inicializar() {
        console.log('[WebView] Inicializando. Respondido:', respondido);
        prepararFundo();
        registrarListeners();
        aplicarEstilos();
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "ready" }));
      }

      window.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "syncState") {
            console.log('[WebView] Recebido syncState:', data);
            selecionadas = new Set(data.partesMarcadas || []);
            respondido = !!data.respondido;
            aplicarEstilos();
          }
        } catch (err) {
          console.error("[WebView] syncState error", err);
        }
      });

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
      } else {
        inicializar();
      }
    </script>
  </body>
</html>
  `;
}

export default function ColorirFiguraAluno({
  respondido,
  conteudo,
  respostasAluno,
  setRespostasAluno,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const [webReady, setWebReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const html = useMemo(() => buildHtml(conteudo, respondido), [conteudo, respondido]);
  const partesMarcadas = respostasAluno?.partesMarcadas ?? [];

  // Estatísticas de correção
  const estatisticas = useMemo(() => {
    if (!respondido) return null;

    const partes = conteudo?.partes ?? [];
    const marcadasSet = new Set(partesMarcadas);

    let acertos = 0;
    let erros = 0;
    let naoMarcadas = 0;

    partes.forEach((parte) => {
      const marcada = marcadasSet.has(parte.id);
      const correta = parte.correta;

      if (marcada && correta) {
        acertos++;
      } else if (marcada && !correta) {
        erros++;
      } else if (!marcada && correta) {
        naoMarcadas++;
      }
    });

    const total = partes.filter((p) => p.correta).length;
    const acertouTudo = acertos === total && erros === 0;

    return { acertos, erros, naoMarcadas, total, acertouTudo };
  }, [respondido, conteudo, partesMarcadas]);

  useEffect(() => {
    setWebReady(false);
    setIsLoading(true);
  }, [html]);

  const syncStateWithWeb = useCallback(() => {
    const ref = webViewRef.current;
    if (!ref) return;

    ref.postMessage(
      JSON.stringify({
        type: "syncState",
        respondido,
        partesMarcadas,
      }),
    );
  }, [partesMarcadas, respondido]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === "ready") {
          setWebReady(true);
          setIsLoading(false);
          return;
        }
        if (data.type === "selection") {
          const recebidas = Array.isArray(data.partesMarcadas) ? data.partesMarcadas : [];
          setRespostasAluno({ partesMarcadas: recebidas });
          return;
        }
      } catch (err) {
        console.error('[React Native] Erro ao processar mensagem:', err);
      }
    },
    [setRespostasAluno],
  );

  useEffect(() => {
    if (webReady) {
      syncStateWithWeb();
    }
  }, [webReady, syncStateWithWeb]);

  const androidLayerType = Platform.OS === "android" ? "hardware" : undefined;

  if (!conteudo || !conteudo.svgHtml) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator size="small" color="#6b7280" />
        <Text style={styles.fallbackText}>Conteúdo não disponível</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#6b7280" />
          </View>
        )}
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={handleMessage}
          automaticallyAdjustContentInsets={false}
          scrollEnabled
          bounces={false}
          style={styles.webview}
          containerStyle={styles.webviewContainer}
          setSupportMultipleWindows={false}
          hideKeyboardAccessoryView
          keyboardDisplayRequiresUserAction={false}
          javaScriptEnabled
          androidLayerType={androidLayerType}
          onLoadEnd={() => setIsLoading(false)}
        />
      </View>

      {/* Feedback visual abaixo da figura */}
      {respondido && estatisticas && (
        <View
          style={[
            styles.feedbackContainer,
            estatisticas.acertouTudo ? styles.feedbackSuccess : styles.feedbackPartial,
          ]}
        >
          <View style={styles.feedbackHeader}>
            <Ionicons
              name={estatisticas.acertouTudo ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={estatisticas.acertouTudo ? "#047857" : "#D97706"}
            />
            <Text style={styles.feedbackTitle}>
              {estatisticas.acertouTudo
                ? "Parabéns! Você coloriu corretamente todas as partes!"
                : `Você acertou ${estatisticas.acertos} de ${estatisticas.total} partes.`}
            </Text>
          </View>

          {!estatisticas.acertouTudo && (
            <View style={styles.feedbackDetails}>
              {estatisticas.acertos > 0 && (
                <View style={styles.feedbackRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.feedbackText}>
                    {estatisticas.acertos} corretas
                  </Text>
                </View>
              )}
              {estatisticas.erros > 0 && (
                <View style={styles.feedbackRow}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={styles.feedbackText}>
                    {estatisticas.erros} incorretas
                  </Text>
                </View>
              )}
              {estatisticas.naoMarcadas > 0 && (
                <View style={styles.feedbackRow}>
                  <Ionicons name="help-circle" size={16} color="#6B7280" />
                  <Text style={styles.feedbackText}>
                    {estatisticas.naoMarcadas} não marcadas (veja bordas verdes)
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  container: {
    width: "100%",
    minHeight: 240,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    zIndex: 1,
  },
  fallback: {
    width: "100%",
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#d1d5db",
    backgroundColor: "#f3f4f6",
    gap: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "Inter-Medium",
  },
  feedbackContainer: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  feedbackSuccess: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  feedbackPartial: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedbackTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter-SemiBold",
  },
  feedbackDetails: {
    gap: 6,
    paddingLeft: 28,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  feedbackText: {
    fontSize: 13,
    color: "#374151",
    fontFamily: "Inter",
  },
});

