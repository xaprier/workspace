<script lang="ts">
  import { onMount } from 'svelte';
  import VerticalPaginationRail from './VerticalPaginationRail.svelte';
  import { withBase } from '../lib/withBase';

  interface Note {
    slug: string;
    title: string;
    type: string;
    createdAt: string;
    linkedProject: { slug: string; title: string } | null;
  }

  export let notes: Note[];
  export let pageSize = 5;

  let currentPage = 1;

  $: totalPages = Math.ceil(notes.length / pageSize);
  $: start = (currentPage - 1) * pageSize;
  $: end = start + pageSize;
  $: visibleNotes = notes.slice(start, end);

  function goToPage(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    const sp = new URLSearchParams();
    if (currentPage > 1) sp.set('page', String(currentPage));
    const qs = sp.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePopState() {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('page') || '1', 10);
    currentPage = Math.max(1, Math.min(p, totalPages));
  }

  function typeLabel(type: string): string {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  function dateLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('page') || '1', 10);
    currentPage = Math.max(1, Math.min(p, totalPages));

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });
</script>

<div class="notes-grid" class:single-column={totalPages <= 1}>
  {#if totalPages > 1}
    <VerticalPaginationRail
      currentPage={currentPage}
      totalPages={totalPages}
      onNavigate={goToPage}
      ariaLabel="Page navigation"
    />
  {/if}

  <ol class="stream">
    {#each visibleNotes as note (note.slug)}
      <li class="stream-entry">
        <a class="entry-title" href={withBase(`/notes/${note.slug}`)}>{note.title}</a>
        <p class="entry-meta">
          <span class="entry-type">{typeLabel(note.type)}</span>
          <span class="entry-date">{dateLabel(note.createdAt)}</span>
          {#if note.linkedProject}
            <span class="entry-meta-dot" aria-hidden="true">·</span>
            <span class="entry-linked-project">
              <span class="linked-project-label">Part of:</span>
              <a href={withBase(`/projects/${note.linkedProject.slug}`)}>{note.linkedProject.title}</a>
            </span>
          {/if}
        </p>
      </li>
    {/each}
  </ol>
</div>

<style>
  .notes-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 var(--space-4);
  }

  /* Without a rail, "auto 1fr" still reserves a real (non-zero,
     content-sized) first column via grid auto-placement, leaving the
     unused 1fr track as dead space on the right. Collapsing to a single
     column when there's nothing to page through keeps the stream at
     the page's full width. */
  .notes-grid.single-column {
    grid-template-columns: 1fr;
  }

  /* --- Stream (same as NotesStream.svelte) --- */
  .stream {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .stream-entry {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-4);
    border-top: 1px solid var(--color-border);
    transition:
      background var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
  }

  .stream-entry:first-child {
    border-top: none;
  }

  .stream-entry:hover {
    background: var(--color-bg-raised);
    box-shadow: inset 3px 0 0 var(--color-accent);
  }

  .entry-title {
    color: var(--color-text-primary);
    font-size: var(--font-size-3);
    font-weight: 600;
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .entry-title:hover,
  .entry-title:focus-visible {
    color: var(--color-accent);
  }

  .entry-title:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .entry-meta {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
  }

  .entry-type {
    text-transform: capitalize;
  }

  .entry-date {
    font-family: var(--font-family-mono);
  }

  .entry-meta-dot {
    color: var(--color-text-muted);
  }

  .entry-linked-project {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-1);
    color: var(--color-text-muted);
  }

  .linked-project-label {
    color: var(--color-text-muted);
  }

  .entry-linked-project a {
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .entry-linked-project a:hover,
  .entry-linked-project a:focus-visible {
    color: var(--color-accent);
  }
</style>
