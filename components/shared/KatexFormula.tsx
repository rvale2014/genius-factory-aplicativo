// components/shared/KatexFormula.tsx
// Componente WebView auto-dimensionável para renderizar fórmulas LaTeX com KaTeX

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { KATEX_CSS, KATEX_JS } from "@/src/lib/katex/katexBundle";

type Props = {
  latex: string;
  displayMode: boolean;
  fontSize?: number;
  color?: string;
};

// Cache global de alturas medidas por hash (latex + displayMode)
const alturaCache = new Map<string, number>();

function gerarChave(latex: string, displayMode: boolean): string {
  return `${displayMode ? "B" : "I"}:${latex}`;
}

function gerarHtml(latex: string, displayMode: boolean, fontSize: number, color: string): string {
  // Escapar backticks e backslashes no LaTeX para uso seguro em JS string
  const latexEscapado = latex
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
${KATEX_CSS}
html, body {
  margin: 0;
  padding: 0;
  background: transparent;
  overflow: hidden;
  text-align: center;
}
.formula-container {
  display: block;
  font-size: ${fontSize}px;
  color: ${color};
  padding: 2px 0;
}
.katex-display {
  margin: 0.5em 0;
  text-align: center;
}
.erro-formula {
  font-family: monospace;
  font-size: ${fontSize * 0.85}px;
  color: #b00020;
  word-break: break-all;
}
</style>
</head>
<body>
<div id="root" class="formula-container"></div>
<script>${KATEX_JS}</script>
<script>
try {
  katex.render(\`${latexEscapado}\`, document.getElementById('root'), {
    displayMode: ${displayMode},
    throwOnError: false,
    strict: false,
    trust: true,
    output: 'html'
  });
} catch(e) {
  document.getElementById('root').innerHTML = '<span class="erro-formula">' +
    \`${latexEscapado}\`.replace(/</g, '&lt;') + '</span>';
}
// Medir altura e enviar para React Native
setTimeout(function() {
  var h = document.getElementById('root').getBoundingClientRect().height;
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: Math.ceil(h + 4) }));
}, 50);
</script>
</body>
</html>`;
}

function KatexFormulaInner({ latex, displayMode, fontSize = 15, color = "#111827" }: Props) {
  const chave = gerarChave(latex, displayMode);
  const alturaInicial = alturaCache.get(chave) ?? (displayMode ? 60 : 28);
  const [altura, setAltura] = useState(alturaInicial);
  const [erro, setErro] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const htmlSource = useMemo(
    () => ({ html: gerarHtml(latex, displayMode, fontSize, color) }),
    [latex, displayMode, fontSize, color],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "height" && typeof data.value === "number") {
          const novaAltura = Math.max(data.value, 20);
          alturaCache.set(chave, novaAltura);
          setAltura(novaAltura);
        }
      } catch {
        // ignorar mensagens inválidas
      }
    },
    [chave],
  );

  const handleError = useCallback(() => {
    setErro(true);
  }, []);

  // Fallback: mostra LaTeX cru se WebView falhar
  if (erro) {
    return (
      <Text style={[styles.fallbackTexto, { fontSize: fontSize * 0.85 }]}>
        {latex}
      </Text>
    );
  }

  return (
    <View style={[styles.container, displayMode && styles.containerBloco, { height: altura }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={htmlSource}
        onMessage={handleMessage}
        onError={handleError}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        style={styles.webview}
        androidLayerType="hardware"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        {...(Platform.OS === "android" && { overScrollMode: "never" as const })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "transparent",
    minHeight: 20,
  },
  containerBloco: {
    alignSelf: "stretch",
    marginVertical: 4,
  },
  webview: {
    backgroundColor: "transparent",
    flex: 1,
  },
  fallbackTexto: {
    fontFamily: "monospace",
    color: "#b00020",
  },
});

const KatexFormula = React.memo(KatexFormulaInner);
export default KatexFormula;
