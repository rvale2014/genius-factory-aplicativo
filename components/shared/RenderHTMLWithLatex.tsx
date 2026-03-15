// components/shared/RenderHTMLWithLatex.tsx
// Wrapper drop-in para RenderHTML com suporte a fórmulas LaTeX via KaTeX

import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import RenderHTML, { useIMGElementProps } from "react-native-render-html";
import type { InternalBlockRenderer, RenderHTMLProps } from "react-native-render-html";
import { preprocessLatex } from "@/src/lib/katex/preprocessLatex";
import {
  katexCustomHTMLElementModels,
  katexDomVisitors,
  katexRenderers,
} from "@/src/lib/katex/katexRenderers";

/**
 * Custom img renderer que usa expo-image diretamente.
 * Usa useIMGElementProps da biblioteca apenas para normalizar a URL,
 * sem chamar useIMGElementState (que faria download duplo via RN Image.getSize).
 */
const ExpoIMGRenderer: InternalBlockRenderer = (props) => {
  const imgProps = useIMGElementProps(props);
  const { source, contentWidth } = imgProps;

  const [dimensoes, setDimensoes] = useState<{ width: number; height: number } | null>(null);

  const maxWidth = contentWidth ?? 500;

  // Se o HTML especifica width/height, usa direto
  const specWidth = imgProps.width ? Number(imgProps.width) : null;
  const specHeight = imgProps.height ? Number(imgProps.height) : null;

  let displayWidth = maxWidth;
  let displayHeight = maxWidth * 0.6; // ratio padrão antes de conhecer o tamanho real

  if (specWidth && specHeight) {
    displayWidth = Math.min(specWidth, maxWidth);
    displayHeight = displayWidth * (specHeight / specWidth);
  } else if (dimensoes) {
    displayWidth = Math.min(dimensoes.width, maxWidth);
    displayHeight = displayWidth * (dimensoes.height / dimensoes.width);
  }

  const onLoad = useCallback((e: any) => {
    if (e?.source?.width && e?.source?.height) {
      setDimensoes({ width: e.source.width, height: e.source.height });
    }
  }, []);

  if (!source?.uri) return null;

  return (
    <View style={[imgStyles.container, { width: displayWidth, height: displayHeight }]}>
      <ExpoImage
        source={{ uri: source.uri }}
        style={{ width: displayWidth, height: displayHeight }}
        contentFit="contain"
        cachePolicy="disk"
        transition={{ duration: 150 }}
        onLoad={onLoad}
      />
    </View>
  );
};

const imgStyles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginVertical: 8,
  },
});

const expoImgRenderers = {
  img: ExpoIMGRenderer,
};

type Props = RenderHTMLProps;

export default function RenderHTMLWithLatex(props: Props) {
  const { source, customHTMLElementModels, renderers, domVisitors, ...rest } = props;

  // Aplica preprocessLatex no HTML source (memoizado)
  const processedSource = useMemo(() => {
    if (source && "html" in source && typeof source.html === "string") {
      return { html: preprocessLatex(source.html) };
    }
    return source;
  }, [source]);

  // Merge customHTMLElementModels
  const mergedModels = useMemo(
    () => ({
      ...katexCustomHTMLElementModels,
      ...customHTMLElementModels,
    }),
    [customHTMLElementModels],
  );

  // Merge renderers (expo-image img + katex + renderers do caller)
  const mergedRenderers = useMemo(
    () => ({
      ...expoImgRenderers,
      ...katexRenderers,
      ...renderers,
    }),
    [renderers],
  );

  // Merge domVisitors
  const mergedDomVisitors = useMemo(() => {
    if (!domVisitors?.onElement) {
      return katexDomVisitors;
    }
    const originalOnElement = domVisitors.onElement;
    return {
      ...domVisitors,
      onElement: (element: Parameters<typeof katexDomVisitors.onElement>[0]) => {
        katexDomVisitors.onElement(element);
        originalOnElement(element);
      },
    };
  }, [domVisitors]);

  return (
    <RenderHTML
      {...rest}
      source={processedSource}
      customHTMLElementModels={mergedModels}
      renderers={mergedRenderers}
      domVisitors={mergedDomVisitors}
    />
  );
}
