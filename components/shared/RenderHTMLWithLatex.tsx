// components/shared/RenderHTMLWithLatex.tsx
// Wrapper drop-in para RenderHTML com suporte a fórmulas LaTeX via KaTeX

import React, { useMemo } from "react";
import RenderHTML from "react-native-render-html";
import type { RenderHTMLProps } from "react-native-render-html";
import { preprocessLatex } from "@/src/lib/katex/preprocessLatex";
import {
  katexCustomHTMLElementModels,
  katexDomVisitors,
  katexRenderers,
} from "@/src/lib/katex/katexRenderers";

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

  // Merge renderers
  const mergedRenderers = useMemo(
    () => ({
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
