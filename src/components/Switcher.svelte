<script lang="ts">
  import { currentPath } from '../stores/route';
  import { withBase } from '../lib/withBase';

  export let initialPath: string;

  // Hub joins as the first entry, replacing
  // the separate site-identity element — see Application Shell Spec's
  // Navigation Mechanic revision.
  const destinations = [
    { href: '/', label: 'Hub' },
    { href: '/projects', label: 'Projects' },
    { href: '/notes', label: 'Notes' },
  ] as const;

  $: activePath = $currentPath ?? initialPath;

  // A destination's dot stays active on its own nested routes too
  // (e.g. /projects/some-narrative), not only on its exact listing
  // URL — every content surface is more than one page. Hub (href '/')
  // has no nested routes to extend to, so this naturally resolves to an
  // exact-match-only rule for it without a special case: `path.startsWith('//')`
  // never matches a real URL path.
  const isActive = (path: string, href: string) =>
    path === href || path.startsWith(`${href}/`);
</script>

<nav class="switcher" aria-label="Primary destinations">
  {#each destinations as dest (dest.href)}
    {@const resolvedHref = withBase(dest.href)}
    {@const active = isActive(activePath, resolvedHref)}
    <a
      class="switcher-dot"
      class:active
      href={resolvedHref}
      aria-label={dest.label}
      aria-current={active ? 'page' : undefined}
    >
      <span class="dot" aria-hidden="true"></span>
      <span class="switcher-label">{dest.label}</span>
    </a>
  {/each}
</nav>

<style>
  /* Centered in the nav bar (2026-07-19 revision) — the switcher is now
     the bar's only element, so NavBar centers it via justify-content
     rather than this component claiming an edge. */
  .switcher {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .switcher-dot {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1);
    text-decoration: none;
    color: var(--color-text-secondary);
    border-radius: 2px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-border);
    transition: background var(--duration-fast) var(--ease-standard);
  }

  .switcher-dot.active .dot {
    background: var(--color-accent);
  }

  /* Active state colors dot and label together — one signal, not two
     independently-toggled ones. */
  .switcher-dot.active {
    color: var(--color-accent);
  }

  /* Labels are permanently visible (2026-07-19 revision) — no opacity
     transition, no hover/focus reveal, no touch-specific carve-out. The
     same rendering applies across pointer, keyboard, and touch. */
  .switcher-label {
    font-size: var(--font-size-1);
    white-space: nowrap;
  }

  .switcher-dot:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
</style>
