// src/lib/katex/katexRenderers.ts
// Configuração de custom renderers para react-native-render-html
// Transforma elementos gf-katex-inline/gf-katex-block em componentes KatexFormula

import type { Element } from "react-native-render-html";
import {
  HTMLContentModel,
  HTMLElementModel,
} from "react-native-render-html";

/**
 * domVisitors: renomeia <span class="gf-katex-inline"> e <div class="gf-katex-block">
 * para tags customizadas que não interferem com a renderização normal de span/div.
 */
export const katexDomVisitors = {
  onElement: (element: Element) => {
    const classes = element.attribs?.class ?? "";
    if (classes.includes("gf-katex-inline")) {
      element.tagName = "katex-inline" as string;
    } else if (classes.includes("gf-katex-block")) {
      element.tagName = "katex-block" as string;
    }
  },
};

/**
 * Modelos de elementos customizados para as tags katex-inline e katex-block.
 */
export const katexCustomHTMLElementModels = {
  "katex-inline": HTMLElementModel.fromCustomModel({
    tagName: "katex-inline" as string,
    contentModel: HTMLContentModel.block,
  }),
  "katex-block": HTMLElementModel.fromCustomModel({
    tagName: "katex-block" as string,
    contentModel: HTMLContentModel.block,
  }),
};

import React from "react";
import KatexFormula from "@/components/shared/KatexFormula";

function KatexInlineRenderer({ tnode }: { tnode: { domNode?: Element } }) {
  const latex = (tnode.domNode as Element)?.attribs?.["data-latex"] ?? "";
  if (!latex) return null;
  return React.createElement(KatexFormula, {
    latex,
    displayMode: false,
  });
}

function KatexBlockRenderer({ tnode }: { tnode: { domNode?: Element } }) {
  const latex = (tnode.domNode as Element)?.attribs?.["data-latex"] ?? "";
  if (!latex) return null;
  return React.createElement(KatexFormula, {
    latex,
    displayMode: true,
  });
}

export const katexRenderers = {
  "katex-inline": KatexInlineRenderer,
  "katex-block": KatexBlockRenderer,
};
