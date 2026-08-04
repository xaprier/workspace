<script lang="ts">
  import { buildFixedWindowPages } from '../lib/pagination';

  export let currentPage: number;
  export let totalPages: number;
  export let onNavigate: (page: number) => void;
  export let ariaLabel: string;

  $: pageList = buildFixedWindowPages(currentPage, totalPages);
</script>

<nav class="vertical-pagination" aria-label={ariaLabel}>
  {#if currentPage > 1}
    <button type="button" class="vp-arrow vp-arrow-up" on:click={() => onNavigate(currentPage - 1)} aria-label="Previous page">↑</button>
  {:else}
    <span class="vp-arrow vp-arrow-up disabled" aria-disabled="true">↑</span>
  {/if}

  <ol class="vp-pages">
    {#each pageList as item, i (typeof item === 'number' ? item : `ellipsis-${i}`)}
      {#if item === 'ellipsis'}
        <li><span class="vp-ellipsis">…</span></li>
      {:else}
        <li>
          {#if item === currentPage}
            <span class="vp-number current" aria-current="page">{item}</span>
          {:else}
            <button type="button" class="vp-number" on:click={() => onNavigate(item)}>{item}</button>
          {/if}
        </li>
      {/if}
    {/each}
  </ol>

  {#if currentPage < totalPages}
    <button type="button" class="vp-arrow vp-arrow-down" on:click={() => onNavigate(currentPage + 1)} aria-label="Next page">↓</button>
  {:else}
    <span class="vp-arrow vp-arrow-down disabled" aria-disabled="true">↓</span>
  {/if}
</nav>

<style>
  /* Spans the full height of the grid row it shares with the content
     column (parent grid must NOT set align-items: start — default
     stretch is what gives this element its height). The three children
     below are independently sticky against that full-height box, so the
     rail visually runs from content-top to content-bottom while each
     piece tries to stay reachable within the viewport as you scroll a
     tall page — same technique as ReadingLayout.astro's .side-rail. */
  .vertical-pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-1);
    padding: var(--space-2) 0;
    height: 100%;
    justify-self: center;
  }

  .vp-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2em;
    height: 2em;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
    font-size: var(--font-size-1);
    cursor: pointer;
    transition:
      color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard);
  }

  .vp-arrow-up {
    position: sticky;
    top: var(--space-4);
  }

  .vp-arrow-down {
    position: sticky;
    bottom: var(--space-4);
  }

  .vp-arrow:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .vp-arrow:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .vp-arrow.disabled {
    color: var(--color-text-muted);
    opacity: 0.4;
    cursor: default;
    border-color: var(--color-border);
  }

  .vp-pages {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .vp-number {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2em;
    min-height: 2em;
    background: var(--color-bg-base);
    border: 1px solid transparent;
    color: var(--color-text-secondary);
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    cursor: pointer;
    transition:
      color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard);
  }

  .vp-number:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .vp-number:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .vp-number.current {
    color: var(--color-accent);
    font-weight: 600;
    border-color: var(--color-accent);
  }

  .vp-ellipsis {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2em;
    min-height: 2em;
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
  }
</style>
