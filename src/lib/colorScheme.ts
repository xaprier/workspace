export type Scheme = 'warm' | 'cool';

export const SCHEMES: { value: Scheme; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
];

export const STORAGE_KEY = 'color-scheme';
export const SCHEME_CHANGE_EVENT = 'colorscheme-change';

export function getScheme(): Scheme {
  return document.documentElement.dataset.colorScheme === 'cool' ? 'cool' : 'warm';
}

export function setScheme(scheme: Scheme): void {
  document.documentElement.dataset.colorScheme = scheme;
  localStorage.setItem(STORAGE_KEY, scheme);
  window.dispatchEvent(new CustomEvent<Scheme>(SCHEME_CHANGE_EVENT, { detail: scheme }));
}
