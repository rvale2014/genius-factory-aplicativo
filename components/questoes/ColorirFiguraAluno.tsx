import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
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

const ERRO_COLOR = "#ef4444";

function buildHtml(conteudo: ConteudoColorir) {
  const svgHtml = conteudo?.svgHtml ?? "";
  const partes = Array.isArray(conteudo?.partes) ? conteudo.partes : [];
  const corSelecao = conteudo?.paleta?.corSelecao ?? "#60a5fa";
  const corAcerto = conteudo?.paleta?.corAcerto ?? "#22c55e";

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
      let respondido = false;

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
        partes.forEach((parte) => {
          const root = document.getElementById(parte.id);
          if (!root) return;
          const shapes = obterShapes(root);

          shapes.forEach((shape) => {
            shape.style.stroke = "";
            shape.style.strokeWidth = "";
            shape.style.fill = "";
          });

          const marcada = selecionadas.has(parte.id);
          const correta = !!parte.correta;

          shapes.forEach((shape) => {
            if (!respondido) {
              if (marcada) {
                shape.style.fill = corSelecao;
              }
              return;
            }

            if (marcada && correta) {
              shape.style.fill = corAcerto;
            } else if (marcada && !correta) {
              shape.style.fill = corErro;
            } else if (!marcada && correta) {
              shape.style.stroke = corAcerto;
              shape.style.strokeWidth = "2px";
            }
          });
        });
      }

      function toggleParte(id) {
        if (respondido) return;
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
        prepararFundo();
        registrarListeners();
        aplicarEstilos();
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "ready" }));
      }

      window.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "syncState") {
            selecionadas = new Set(data.partesMarcadas || []);
            respondido = !!data.respondido;
            aplicarEstilos();
          }
        } catch (err) {
          console.error("syncState error", err);
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

  const html = useMemo(() => buildHtml(conteudo), [conteudo]);
  const partesMarcadas = respostasAluno?.partesMarcadas ?? [];

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
      } catch {
        // ignore malformed message
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
      </View>
    );
  }

  return (
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
  );
}

const styles = StyleSheet.create({
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
  },
});

