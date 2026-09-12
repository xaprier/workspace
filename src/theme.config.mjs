// Theme boundary configuration.
//
// Plain JS, not .ts: this file is the single source of truth for both
// Vite/TS-land (src/lib/colorScheme.ts, imported through Astro/Svelte)
// and plain Node build scripts (scripts/render-mermaid.mjs) that have no
// TypeScript loader. A fork restricting or re-defaulting the switcher
// only ever needs to edit the two lists below.

/** @typedef {import('./lib/colorScheme.js').Scheme} Scheme */

/**
 * Schemes selectable in the UI (ThemeControl, Command Palette). Defaults
 * to the full catalog — a fork wanting fewer choices shrinks this array.
 * @type {Scheme[]}
 */
export const ENABLED_SCHEMES = [
  'warm',
  'cool',
  'ember',
  'dusk',
  'plum',
  'midnight',
  'harbor',
  'cobalt',
  'noir',
  'tropic',
];

/**
 * Fallback scheme: applied when no stored preference exists, or when a
 * stored preference is no longer in ENABLED_SCHEMES. Must be a member of
 * ENABLED_SCHEMES.
 * @type {Scheme}
 */
export const DEFAULT_SCHEME = 'warm';

/**
 * Schemes with hand-verified mermaid `themeVariables` in
 * scripts/render-mermaid.mjs, i.e. the ones that actually get
 * architecture-diagram SVGs generated. Deliberately smaller than and
 * independent from ENABLED_SCHEMES — a scheme can be user-selectable
 * without diagram art existing for it yet (ArchitectureDiagram.astro
 * falls back to DEFAULT_SCHEME's variant in that case).
 * @type {Scheme[]}
 */
//export const MERMAID_DIAGRAM_SCHEMES = ['warm', 'cool'];
export const MERMAID_DIAGRAM_SCHEMES = ENABLED_SCHEMES;

if (ENABLED_SCHEMES.length === 0) {
  throw new Error('theme.config.mjs: ENABLED_SCHEMES must not be empty.');
}
if (!ENABLED_SCHEMES.includes(DEFAULT_SCHEME)) {
  throw new Error('theme.config.mjs: DEFAULT_SCHEME must be one of ENABLED_SCHEMES.');
}
if (MERMAID_DIAGRAM_SCHEMES.length === 0) {
  throw new Error('theme.config.mjs: MERMAID_DIAGRAM_SCHEMES must not be empty.');
}
