<script lang="ts">
  import { onMount } from 'svelte';
  import { buildFixedWindowPages } from '../lib/pagination';
  import VerticalPaginationRail from './VerticalPaginationRail.svelte';
  import { withBase } from '../lib/withBase';

  interface Narrative {
    slug: string;
    title: string;
    description: string;
    technologies: string[];
    pinned: boolean;
    status?: string;
    updatedAt: string;
  }

  interface IndexEntry {
    slug: string;
    title: string;
    description: string;
    technologies: string[];
    status?: string;
    outboundLink: { url: string; kind: string };
    github: {
      stars: string;
      language: string;
      pushedAtLabel: string;
    } | null;
  }

  export let narratives: Narrative[];
  export let indexEntries: IndexEntry[];
  export let narrativePageSize = 3;
  export let indexPageSize = 9;

  let narrativePage = 1;
  let indexPage = 1;

  $: totalNarrativePages = Math.ceil(narratives.length / narrativePageSize);
  $: totalIndexPages = Math.ceil(indexEntries.length / indexPageSize);

  $: narrativeStart = (narrativePage - 1) * narrativePageSize;
  $: narrativeEnd = narrativeStart + narrativePageSize;
  $: visibleNarratives = narratives.slice(narrativeStart, narrativeEnd);

  $: indexStart = (indexPage - 1) * indexPageSize;
  $: indexEnd = indexStart + indexPageSize;
  $: visibleIndexEntries = indexEntries.slice(indexStart, indexEnd);

  $: indexPages = buildFixedWindowPages(indexPage, totalIndexPages);

  function buildURL(nPage: number, iPage: number, lastSection: 'narrative' | 'index'): string {
    const base = window.location.pathname;
    const params: string[] = [];
    if (nPage > 1) params.push(`narrative=${nPage}`);
    if (iPage > 1) params.push(`index=${iPage}`);
    if (params.length === 0) return base;
    if (params.length === 2) {
      const narrativeFirst = lastSection === 'narrative';
      return `${base}?${narrativeFirst ? params[0] + '&' + params[1] : params[1] + '&' + params[0]}`;
    }
    return `${base}?${params[0]}`;
  }

  function goToNarrativePage(page: number) {
    if (page < 1 || page > totalNarrativePages || page === narrativePage) return;
    narrativePage = page;
    history.pushState({}, '', buildURL(narrativePage, indexPage, 'narrative'));
  }

  function goToIndexPage(page: number) {
    if (page < 1 || page > totalIndexPages || page === indexPage) return;
    indexPage = page;
    history.pushState({}, '', buildURL(narrativePage, indexPage, 'index'));
    setTimeout(() => {
      document.getElementById('more-projects')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  function handlePopState() {
    const params = new URLSearchParams(window.location.search);
    narrativePage = Math.max(1, Math.min(parseInt(params.get('narrative') || '1', 10), totalNarrativePages));
    indexPage = Math.max(1, Math.min(parseInt(params.get('index') || '1', 10), totalIndexPages));
  }

  function dateLabel(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    narrativePage = Math.max(1, Math.min(parseInt(params.get('narrative') || '1', 10), totalNarrativePages));
    indexPage = Math.max(1, Math.min(parseInt(params.get('index') || '1', 10), totalIndexPages));

    const qs = window.location.search;
    if (qs) {
      const idxN = qs.indexOf('narrative=');
      const idxI = qs.indexOf('index=');
      const scroll_to_index = (idxI !== -1 && idxI > idxN) || idxN === -1;
      if (scroll_to_index) {
        setTimeout(() => {
          document.getElementById('more-projects')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });
</script>

<section class="narratives-section" aria-label="Narrative projects">
  <div class="narratives-grid" class:single-column={totalNarrativePages <= 1}>
    {#if totalNarrativePages > 1}
      <VerticalPaginationRail
        currentPage={narrativePage}
        totalPages={totalNarrativePages}
        onNavigate={goToNarrativePage}
        ariaLabel="Narrative page navigation"
      />
    {/if}

    <div class="narrative-cards">
      {#each visibleNarratives as project (project.slug)}
        <article class="narrative-card" class:pinned={project.pinned}>
          {#if project.pinned}
            <p class="pinned-indicator">
              <span class="pinned-dot" aria-hidden="true"></span>
              Pinned
            </p>
          {/if}
          <h2 class="narrative-title">{project.title}</h2>
          <p class="narrative-description">{project.description}</p>
          <div class="tech-chips">
            {#each project.technologies as tech}
              <span class="tech-chip">{tech}</span>
            {/each}
          </div>
          {#if project.status}
            <p class="narrative-status">{project.status}</p>
          {/if}
          <div class="narrative-footer">
            <p class="narrative-updated">Updated {dateLabel(project.updatedAt)}</p>
            <a class="read-story" href={withBase(`/projects/${project.slug}`)} aria-label="Read the story: {project.title}">
              Read the story →
            </a>
          </div>
        </article>
      {/each}
    </div>
  </div>
</section>

{#if indexEntries.length > 0}
  <section id="more-projects" class="index-entries" aria-label="Index-tier projects">
    <h2 class="index-heading">More Projects</h2>
    <ul class="index-grid">
      {#each visibleIndexEntries as project (project.slug)}
        <li class="index-card">
          <h3 class="index-card-title">{project.title}</h3>
          <p class="index-card-description">{project.description}</p>
          <div class="tech-chips">
            {#each project.technologies as tech}
              <span class="tech-chip">{tech}</span>
            {/each}
          </div>
          {#if project.status}
            <p class="index-card-status">{project.status}</p>
          {/if}
          <div class="index-card-footer">
            <a class="kind-label" href={project.outboundLink.url} target="_blank" rel="noopener noreferrer">
              {project.outboundLink.kind === 'github' ? 'GitHub' : 'External'} →
            </a>
            <span class="view-details" data-project-slug={project.slug}>View details →</span>
          </div>
        </li>
      {/each}
    </ul>

    {#if totalIndexPages > 1}
      <nav class="pagination" aria-label="Index page navigation">
        {#if indexPage > 1}
          <button type="button" class="pagination-link prev" on:click={() => goToIndexPage(indexPage - 1)}>← Previous</button>
        {:else}
          <span class="pagination-link prev disabled" aria-disabled="true">← Previous</span>
        {/if}

        <ol class="page-numbers">
          {#each indexPages as item}
            {#if item === 'ellipsis'}
              <li><span class="page-ellipsis">…</span></li>
            {:else}
              <li>
                {#if item === indexPage}
                  <span class="page-number current" aria-current="page">{item}</span>
                {:else}
                  <button type="button" class="page-number" on:click={() => goToIndexPage(item)}>{item}</button>
                {/if}
              </li>
            {/if}
          {/each}
        </ol>

        {#if indexPage < totalIndexPages}
          <button type="button" class="pagination-link next" on:click={() => goToIndexPage(indexPage + 1)}>Next →</button>
        {:else}
          <span class="pagination-link next disabled" aria-disabled="true">Next →</span>
        {/if}
      </nav>
    {/if}
  </section>
{/if}

<style>
  /* --- Narratives: 2-column grid — pagination rail + cards --- */
  .narratives-section {
    margin-top: 0;
  }

  .narratives-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 var(--space-4);
  }

  /* Without a rail, "auto 1fr" still reserves a real (non-zero,
     content-sized) first column via grid auto-placement, leaving the
     unused 1fr track as dead space on the right. Collapsing to a single
     column when there's nothing to page through keeps narrative-cards
     at the section's full width, matching the search bar/index-entries
     above/below it. */
  .narratives-grid.single-column {
    grid-template-columns: 1fr;
  }

  /* --- Narrative cards (right column) --- */
  .narrative-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .narrative-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--color-bg-raised);
    padding: var(--space-5);
    border: 1px solid transparent;
    transition:
      border-color var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }

  .narrative-card:hover,
  .narrative-card:focus-within {
    border-color: var(--color-accent);
    transform: translateY(-2px);
  }

  .narrative-card.pinned {
    border-left: 3px solid var(--color-accent);
  }

  .narrative-card .read-story {
    position: relative;
  }

  .narrative-card .read-story::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  .pinned-indicator {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-size: var(--font-size-1);
    color: var(--color-text-muted);
  }

  .pinned-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
  }

  .narrative-title {
    margin: 0;
    font-size: var(--font-size-4);
    color: var(--color-text-primary);
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .narrative-card:hover .narrative-title,
  .narrative-card:focus-within .narrative-title {
    color: var(--color-accent);
  }

  .narrative-description {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .narrative-status {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
  }

  .narrative-footer {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .narrative-updated {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
  }

  .read-story {
    color: var(--color-accent);
    font-size: var(--font-size-1);
    text-decoration: none;
    white-space: nowrap;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .read-story:hover,
  .read-story:focus-visible {
    color: var(--color-accent-hover);
  }

  .read-story:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  /* --- Tech Chips (shared) --- */
  .tech-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .tech-chip {
    display: inline-block;
    padding: var(--space-1) var(--space-2);
    background: var(--color-accent-subtle);
    color: var(--color-accent-muted);
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    line-height: 1;
  }

  /* --- Index Entries --- */
  .index-entries {
    margin-top: var(--space-7);
  }

  .index-heading {
    font-size: var(--font-size-2);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-4);
  }

  .index-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-4);
  }

  .index-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    transition:
      border-color var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }

  .index-card:hover,
  .index-card:focus-within {
    border-color: var(--color-accent);
    transform: translateY(-2px);
  }

  .index-card-title {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-2);
    font-weight: 600;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .index-card:hover .index-card-title,
  .index-card:focus-within .index-card-title {
    color: var(--color-accent);
  }

  .index-card-description {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .index-card-status {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
  }

  .index-card-footer {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .kind-label {
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .kind-label:hover,
  .kind-label:focus-visible {
    color: var(--color-accent);
  }

  .kind-label:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .view-details {
    color: var(--color-accent);
    font-size: var(--font-size-1);
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .view-details:hover,
  .view-details:focus-visible {
    color: var(--color-accent-hover);
  }

  /* --- Horizontal Pagination (index) --- */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-6) 0;
  }

  .pagination-link {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: var(--font-size-1);
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .pagination-link:hover {
    color: var(--color-accent);
  }

  .pagination-link:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .pagination-link.disabled {
    color: var(--color-text-muted);
    opacity: 0.5;
    cursor: default;
  }

  .page-numbers {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: var(--space-2);
  }

  .page-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2em;
    padding: var(--space-1) var(--space-2);
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    text-decoration: none;
    cursor: pointer;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .page-number:hover {
    color: var(--color-accent);
  }

  .page-number:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .page-number.current {
    color: var(--color-accent);
    font-weight: 600;
  }

  .page-ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2em;
    padding: var(--space-1) var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
  }
</style>
