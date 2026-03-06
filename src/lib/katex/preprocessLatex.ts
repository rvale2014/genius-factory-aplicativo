// src/lib/katex/preprocessLatex.ts
// Pré-processador que normaliza formatos LaTeX no HTML vindo do backend

/**
 * Decodifica entidades HTML comuns encontradas dentro de expressões LaTeX.
 */
function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Escapa aspas duplas para uso seguro no atributo data-latex="..."
 */
function escaparAtributo(latex: string): string {
  return latex.replace(/"/g, "&quot;");
}

/**
 * Normaliza formatos legados de classes KaTeX do backend.
 * Ex: <span class="katex-inline gf-katex"> → <span class="gf-katex-inline">
 */
function normalizarClassesLegadas(html: string): string {
  // katex-inline gf-katex → gf-katex-inline
  html = html.replace(
    /class="[^"]*katex-inline[^"]*gf-katex[^"]*"/g,
    'class="gf-katex-inline"',
  );
  // katex-block gf-katex → gf-katex-block
  html = html.replace(
    /class="[^"]*katex-block[^"]*gf-katex[^"]*"/g,
    'class="gf-katex-block"',
  );
  // gf-katex katex-inline → gf-katex-inline (ordem invertida)
  html = html.replace(
    /class="[^"]*gf-katex[^"]*katex-inline[^"]*"/g,
    'class="gf-katex-inline"',
  );
  // gf-katex katex-block → gf-katex-block (ordem invertida)
  html = html.replace(
    /class="[^"]*gf-katex[^"]*katex-block[^"]*"/g,
    'class="gf-katex-block"',
  );
  return html;
}

/**
 * Converte delimitadores $...$ e $$...$$ em elementos HTML estruturados.
 * Ignora R$, US$ e \$ (escapes) para evitar falsos positivos com valores monetários.
 */
function converterDelimitadores(html: string): string {
  // Primeiro: $$...$$ (bloco) — precisa vir antes do inline
  html = html.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_match, latex: string) => {
      const limpo = decodificarEntidades(latex.trim());
      return `<div class="gf-katex-block" data-latex="${escaparAtributo(limpo)}"></div>`;
    },
  );

  // Depois: $...$ (inline) — mas não R$, US$, \$, ou $ isolado
  html = html.replace(
    /(?<![A-Za-z\\])\$((?!\s)[^$\n]+?(?<!\s))\$/g,
    (_match, latex: string) => {
      const limpo = decodificarEntidades(latex.trim());
      return `<span class="gf-katex-inline" data-latex="${escaparAtributo(limpo)}"></span>`;
    },
  );

  return html;
}

/**
 * Extrai o conteúdo LaTeX de elementos que já possuem a fórmula como texto interno
 * (ex: <span class="gf-katex-inline">x^2</span>) e move para data-latex.
 */
function extrairLatexDeConteudo(html: string): string {
  // Inline: <span class="gf-katex-inline">conteúdo</span>
  html = html.replace(
    /<span\s+class="gf-katex-inline"(?:\s+[^>]*)?>([^<]+)<\/span>/g,
    (_match, conteudo: string) => {
      const latex = decodificarEntidades(conteudo.trim());
      return `<span class="gf-katex-inline" data-latex="${escaparAtributo(latex)}"></span>`;
    },
  );

  // Block: <div class="gf-katex-block">conteúdo</div>
  html = html.replace(
    /<div\s+class="gf-katex-block"(?:\s+[^>]*)?>([^<]+)<\/div>/g,
    (_match, conteudo: string) => {
      const latex = decodificarEntidades(conteudo.trim());
      return `<div class="gf-katex-block" data-latex="${escaparAtributo(latex)}"></div>`;
    },
  );

  return html;
}

/**
 * Pré-processa HTML com fórmulas LaTeX, normalizando todos os formatos
 * para uma estrutura consistente com classes gf-katex-inline/gf-katex-block
 * e atributo data-latex contendo a expressão.
 */
export function preprocessLatex(html: string): string {
  if (!html) return html;

  // Verificação rápida: tem algo que pareça LaTeX?
  const temLatex =
    html.includes("$") ||
    html.includes("katex") ||
    html.includes("gf-katex");

  if (!temLatex) return html;

  let resultado = html;

  // 1. Normalizar classes legadas
  resultado = normalizarClassesLegadas(resultado);

  // 2. Extrair LaTeX de conteúdo de texto para data-latex
  resultado = extrairLatexDeConteudo(resultado);

  // 3. Converter delimitadores $...$ e $$...$$
  resultado = converterDelimitadores(resultado);

  return resultado;
}
