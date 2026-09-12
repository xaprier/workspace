import { ENABLED_SCHEMES, DEFAULT_SCHEME } from '../theme.config.mjs';

export type Scheme =
  | 'warm'
  | 'cool'
  | 'ember'
  | 'dusk'
  | 'plum'
  | 'midnight'
  | 'harbor'
  | 'cobalt'
  | 'noir'
  | 'tropic';

const ALL_SCHEMES: { value: Scheme; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'ember', label: 'Ember' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'plum', label: 'Plum' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'harbor', label: 'Harbor' },
  { value: 'cobalt', label: 'Cobalt' },
  { value: 'noir', label: 'Noir' },
  { value: 'tropic', label: 'Tropic' },
];

// Boundary-filtered against theme.config.mjs's ENABLED_SCHEMES —
// ThemeControl and the Command Palette iterate this list without
// hardcoding a preset count, so restricting the boundary shrinks both
// automatically.
export const SCHEMES: { value: Scheme; label: string }[] = ALL_SCHEMES.filter((s) =>
  (ENABLED_SCHEMES as string[]).includes(s.value),
);

const SCHEME_VALUES = SCHEMES.map((s) => s.value);

export const STORAGE_KEY = 'color-scheme';
export const SCHEME_CHANGE_EVENT = 'colorscheme-change';

export function getScheme(): Scheme {
  const attr = document.documentElement.dataset.colorScheme;
  return (SCHEME_VALUES as string[]).includes(attr ?? '')
    ? (attr as Scheme)
    : (DEFAULT_SCHEME as Scheme);
}

export function setScheme(scheme: Scheme): void {
  if (!(SCHEME_VALUES as string[]).includes(scheme)) return;
  document.documentElement.dataset.colorScheme = scheme;
  localStorage.setItem(STORAGE_KEY, scheme);
  window.dispatchEvent(new CustomEvent<Scheme>(SCHEME_CHANGE_EVENT, { detail: scheme }));
}
