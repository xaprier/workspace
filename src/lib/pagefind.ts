/**
 * Pagefind returns URLs derived from file paths (e.g. /notes/something/),
 * which carry trailing slashes. Astro's `trailingSlash: 'never'` config
 * means those URLs 404. This normalizer strips the trailing slash at the
 * point of use — both CommandPalette and SearchIsland apply it.
 */
export function stripTrailingSlash(href: string): string {
  return href.length > 1 && href.endsWith('/') ? href.slice(0, -1) : href;
}
