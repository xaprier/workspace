#!/usr/bin/env node
// Offline dual-render: each .mmd source under scripts/diagrams/ is rendered
// twice, once per Color Scheme preset, producing the two static SVGs each
// narrative's ArchitectureDiagram component references. Run manually
// whenever a diagram's .mmd source changes. This replaced the live
// rehype-mermaid build-time pipeline (2 diagrams total, changed rarely;
// not worth a per-build headless-Chromium pass for two static outputs).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, basename } from 'node:path';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeMermaid from 'rehype-mermaid';
import rehypeStringify from 'rehype-stringify';

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
// [data-color-scheme='warm'] and [data-color-scheme='cool'] blocks
// hex-for-hex.
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
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",
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
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",
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
      mermaidConfig: { theme: 'base', themeVariables },
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
    for (const [scheme, themeVariables] of Object.entries(schemes)) {
      const svg = await renderVariant(source, themeVariables);
      const outPath = join(outputDir, `${slug}-${scheme}.svg`);
      writeFileSync(outPath, svg);
      console.log(`wrote ${outPath}`);
    }
  }
}

main();
