import { atom } from 'nanostores';

// Seam-resolution rule: a transition:persist'd element is never
// re-rendered by Astro on a soft
// navigation — it keeps the exact server-rendered props it had at first
// paint, frozen, for the life of the page session. Any island living
// inside that persisted subtree that needs to react to later
// navigations (active-route state here; future command-palette state
// elsewhere) needs its own client-side channel, because a fresh prop
// will never arrive. A non-persisted, per-page island doesn't have this
// problem — Astro re-renders it with correct server props on every
// navigation, so no store is needed. This module is that channel for
// the nav/identity bar's Switcher island.
//
// Guarded by `typeof document` so this only runs in the browser: Astro
// static builds evaluate this module once per Node process, and an
// unconditional `.set()` here would leak one page's path into another
// page's static HTML.
export const currentPath = atom<string | null>(null);

if (typeof document !== 'undefined') {
  currentPath.set(window.location.pathname);
  document.addEventListener('astro:page-load', () => {
    currentPath.set(window.location.pathname);
  });
}
