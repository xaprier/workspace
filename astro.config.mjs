// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), mdx()],
  // Enforces one URL shape at the source ("/projects", never "/projects/")
  // so every consumer comparing Astro.url.pathname against a route href
  // — the destination switcher, the command palette — gets a match
  // without per-component normalization.
  trailingSlash: 'never',
  // deploy.yml sets these for the GitHub Pages subpath build; default to
  // root so local dev/build without the env vars is unaffected.
  base: process.env.ASTRO_BASE || '/',
  site: process.env.ASTRO_SITE || undefined
});
