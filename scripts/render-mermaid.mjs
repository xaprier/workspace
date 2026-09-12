#!/usr/bin/env node
// Offline render: each .mmd source under scripts/diagrams/ is rendered once
// per scheme in theme.config.mjs's MERMAID_DIAGRAM_SCHEMES, producing the
// static SVGs each narrative's ArchitectureDiagram component references.
// Run manually whenever a diagram's .mmd source changes, or after adding a
// scheme to MERMAID_DIAGRAM_SCHEMES. This replaced a live rehype-mermaid
// build-time pipeline (few diagrams total, changed rarely; not worth a
// per-build headless-Chromium pass for static outputs).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, basename } from 'node:path';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeMermaid from 'rehype-mermaid';
import rehypeStringify from 'rehype-stringify';

import { MERMAID_DIAGRAM_SCHEMES } from '../src/theme.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const diagramsDir = join(__dirname, 'diagrams');
const outputDir = join(__dirname, '..', 'public', 'projects');

const monoFontBase64 = readFileSync(
  join(__dirname, '..', 'src', 'fonts', 'JetBrainsMonoVariable.woff2'),
).toString('base64');
const mermaidFontCss = `@font-face {
  font-family: 'JetBrains Mono Variable';
  src: url(data:font/woff2;base64,${monoFontBase64}) format('woff2');
}`;
const mermaidFontCssDataUri = `data:text/css;base64,${Buffer.from(mermaidFontCss).toString('base64')}`;

// One themeVariables set per Color Scheme preset — must match tokens.css's
// [data-color-scheme='<name>'] blocks hex-for-hex. Only the schemes listed in
// theme.config.mjs's MERMAID_DIAGRAM_SCHEMES are actually rendered below —
// this catalog can hold more entries than are currently in use.
const monoFont = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";
const schemes = {
  warm: {
    background: '#362d27', // --color-bg-raised
    primaryColor: '#47392f', // --color-bg-overlay
    primaryTextColor: '#f0e1c5', // --color-text-primary
    primaryBorderColor: '#5a4a3a', // --color-border
    lineColor: '#b7a488', // --color-text-muted
    clusterBkg: '#362d27',
    clusterBorder: '#5a4a3a',
    edgeLabelBackground: '#362d27',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  cool: {
    background: '#2e2d2a', // --color-bg-raised
    primaryColor: '#3a3835', // --color-bg-overlay
    primaryTextColor: '#e8e6e1', // --color-text-primary
    primaryBorderColor: '#46443f', // --color-border
    lineColor: '#9d9a93', // --color-text-muted
    clusterBkg: '#2e2d2a',
    clusterBorder: '#46443f',
    edgeLabelBackground: '#2e2d2a',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  ember: {
    background: '#292c32', // --color-bg-raised
    primaryColor: '#333840', // --color-bg-overlay
    primaryTextColor: '#e6e2e2', // --color-text-primary
    primaryBorderColor: '#3f444e', // --color-border
    lineColor: '#a39d9d', // --color-text-muted
    clusterBkg: '#292c32',
    clusterBorder: '#3f444e',
    edgeLabelBackground: '#292c32',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  dusk: {
    background: '#2c2b30', // --color-bg-raised
    primaryColor: '#37353d', // --color-bg-overlay
    primaryTextColor: '#dee3e3', // --color-text-primary
    primaryBorderColor: '#44424b', // --color-border
    lineColor: '#99a09f', // --color-text-muted
    clusterBkg: '#2c2b30',
    clusterBorder: '#44424b',
    edgeLabelBackground: '#2c2b30',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  plum: {
    background: '#2e2635', // --color-bg-raised
    primaryColor: '#3a2f43', // --color-bg-overlay
    primaryTextColor: '#f2dad9', // --color-text-primary
    primaryBorderColor: '#483a53', // --color-border
    lineColor: '#b79492', // --color-text-muted
    clusterBkg: '#2e2635',
    clusterBorder: '#483a53',
    edgeLabelBackground: '#2e2635',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  midnight: {
    background: '#242837', // --color-bg-raised
    primaryColor: '#2c3246', // --color-bg-overlay
    primaryTextColor: '#dcdeeb', // --color-text-primary
    primaryBorderColor: '#363d57', // --color-border
    lineColor: '#989bac', // --color-text-muted
    clusterBkg: '#242837',
    clusterBorder: '#363d57',
    edgeLabelBackground: '#242837',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  harbor: {
    background: '#242f36', // --color-bg-raised
    primaryColor: '#2d3c46', // --color-bg-overlay
    primaryTextColor: '#e2e5ea', // --color-text-primary
    primaryBorderColor: '#374a56', // --color-border
    lineColor: '#9ca0a8', // --color-text-muted
    clusterBkg: '#242f36',
    clusterBorder: '#374a56',
    edgeLabelBackground: '#242f36',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  cobalt: {
    background: '#242937', // --color-bg-raised
    primaryColor: '#2c3346', // --color-bg-overlay
    primaryTextColor: '#d0e3e8', // --color-text-primary
    primaryBorderColor: '#363f57', // --color-border
    lineColor: '#89a0a6', // --color-text-muted
    clusterBkg: '#242937',
    clusterBorder: '#363f57',
    edgeLabelBackground: '#242937',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  noir: {
    background: '#35252a', // --color-bg-raised
    primaryColor: '#442e34', // --color-bg-overlay
    primaryTextColor: '#e3dfdf', // --color-text-primary
    primaryBorderColor: '#543940', // --color-border
    lineColor: '#a09b9b', // --color-text-muted
    clusterBkg: '#35252a',
    clusterBorder: '#543940',
    edgeLabelBackground: '#35252a',
    fontFamily: monoFont,
    fontSize: '14px',
  },
  tropic: {
    background: '#36252b', // --color-bg-raised
    primaryColor: '#452e36', // --color-bg-overlay
    primaryTextColor: '#d5e7b4', // --color-text-primary
    primaryBorderColor: '#553842', // --color-border
    lineColor: '#91a373', // --color-text-muted
    clusterBkg: '#36252b',
    clusterBorder: '#553842',
    edgeLabelBackground: '#36252b',
    fontFamily: monoFont,
    fontSize: '14px',
  },
};

async function renderVariant(source, themeVariables) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeMermaid, {
      strategy: 'inline-svg',
      css: mermaidFontCssDataUri,
      // htmlLabels: false (root-level — flowchart.htmlLabels is deprecated
      // and only affected edge labels, not node labels) — labels render as
      // plain SVG <text>/<tspan> instead of a fixed-width foreignObject
      // <div>. With HTML labels, Mermaid sizes that fixed width before the
      // custom variable font's real glyph metrics are settled; if the
      // actual rendered text comes out even slightly wider, the
      // foreignObject's implicit overflow clipping crops the last
      // character(s) — reproduces intermittently (font-metrics timing, not
      // the diagram source). SVG text has no such fixed-width clip box.
      mermaidConfig: { theme: 'base', themeVariables, htmlLabels: false },
    })
    .use(rehypeStringify);

  const markdown = '```mermaid\n' + source.trim() + '\n```\n';
  const { value } = await processor.process(markdown);
  const match = /<svg[\s\S]*<\/svg>/.exec(String(value));
  if (!match) throw new Error('rehype-mermaid produced no <svg> output');
  return match[0];
}

async function main() {
  const files = readdirSync(diagramsDir).filter((f) => f.endsWith('.mmd'));
  if (files.length === 0) {
    console.error(`No .mmd files found in ${diagramsDir}`);
    process.exit(1);
  }
  for (const file of files) {
    const slug = basename(file, '.mmd');
    const source = readFileSync(join(diagramsDir, file), 'utf8');
    for (const scheme of MERMAID_DIAGRAM_SCHEMES) {
      const themeVariables = schemes[scheme];
      if (!themeVariables) {
        throw new Error(
          `render-mermaid.mjs: no themeVariables entry for scheme "${scheme}" (theme.config.mjs's MERMAID_DIAGRAM_SCHEMES references it, but the schemes catalog above has no matching key).`,
        );
      }
      const svg = await renderVariant(source, themeVariables);
      const outPath = join(outputDir, `${slug}-${scheme}.svg`);
      writeFileSync(outPath, svg);
      console.log(`wrote ${outPath}`);
    }
  }
}

main();
