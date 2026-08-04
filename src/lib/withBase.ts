// Prefixes a site-root-relative path ("/projects") with the configured
// deploy base (import.meta.env.BASE_URL — "/" locally, "/workspace/" on
// GitHub Pages). Astro does not rewrite hardcoded "/"-leading hrefs
// itself, so every internal link/asset reference has to go through this.
//
// Scheme-prefixed ("https://...", "mailto:...") and protocol-relative
// ("//...") values pass through unchanged — content fields like
// contact.resume accept either a local path or a full external URL.
const ABSOLUTE = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

export function withBase(path: string): string {
  if (ABSOLUTE.test(path)) return path;
  const base = import.meta.env.BASE_URL;
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${normalizedPath}` || '/';
}
