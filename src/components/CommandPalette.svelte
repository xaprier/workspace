<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { stripTrailingSlash } from '../lib/pagefind';
  import { SCHEMES, getScheme, setScheme, type Scheme } from '../lib/colorScheme';
  import { withBase } from '../lib/withBase';
  import ClearButton from './ClearButton.svelte';

  type NavigateItem = { kind: 'navigate'; href: string; label: string; excerpt?: undefined };
  type ResultItem = { kind: 'result'; href: string; label: string; excerpt: string };
  type ActionItem = { kind: 'action'; label: string; run: () => void; active: boolean };
  type PaletteItem = NavigateItem | ResultItem | ActionItem;

  const destinations = [
    { href: '/', label: 'Workspace' },
    { href: '/projects', label: 'Projects' },
    { href: '/notes', label: 'Notes' },
  ] as const;

  const isDev = import.meta.env.DEV;
  const isMac =
    typeof navigator !== 'undefined' &&
    (navigator.platform?.includes('Mac') || navigator.userAgentData?.platform === 'macOS');

  let dialogEl: HTMLDialogElement;
  let triggerEl: HTMLButtonElement;
  let inputEl: HTMLInputElement;
  let listEl: HTMLUListElement;
  let query = '';
  let activeIndex = 0;
  let results: ResultItem[] = [];
  let loading = false;
  let pagefind: any = null;
  let debounceTimer: ReturnType<typeof setTimeout>;
  let currentScheme: Scheme = 'warm';

  $: themeMatches = SCHEMES.filter((s) =>
    `switch to ${s.label}`.toLowerCase().includes(query.trim().toLowerCase()),
  ).map(
    (s): ActionItem => ({
      kind: 'action',
      label: `Switch to ${s.label}`,
      run: () => setScheme(s.value),
      active: s.value === currentScheme,
    }),
  );

  $: navigateMatches = destinations
    .filter((d) => d.label.toLowerCase().includes(query.trim().toLowerCase()))
    .map((d): NavigateItem => ({ kind: 'navigate', href: withBase(d.href), label: d.label }));

  $: combined = [...themeMatches, ...navigateMatches, ...results] as PaletteItem[];

  $: {
    query;
    activeIndex = 0;
  }

  $: if (combined.length > 0 && activeIndex >= combined.length) {
    activeIndex = combined.length - 1;
  }
  $: if (combined.length === 0) {
    activeIndex = 0;
  }

  $: if (activeIndex >= 0 && listEl) {
    tick().then(() => {
      const option = listEl.querySelector(`#palette-option-${activeIndex}`);
      option?.scrollIntoView({ block: 'nearest' });
    });
  }

  async function loadPagefind() {
    if (!pagefind) {
      try {
        const pagefindPath = withBase('pagefind/pagefind.js');
        pagefind = await import(/* @vite-ignore */ pagefindPath);
        await pagefind.init();
      } catch {
        return null;
      }
    }
    return pagefind;
  }

  function handleQueryInput() {
    clearTimeout(debounceTimer);
    const trimmed = query.trim();
    if (!trimmed) {
      results = [];
      loading = false;
      return;
    }
    if (isDev) return;
    debounceTimer = setTimeout(() => performSearch(trimmed), 250);
  }

  async function performSearch(q: string) {
    loading = true;
    const pf = await loadPagefind();
    if (!pf) {
      loading = false;
      return;
    }

    const searchResult = await pf.search(q);

    const loaded = await Promise.all(
      searchResult.results.slice(0, 20).map(async (r: any) => {
        const data = await r.data();
        return {
          kind: 'result' as const,
          href: stripTrailingSlash(data.url),
          label: data.meta?.title ?? data.url,
          excerpt: data.excerpt ?? '',
        };
      }),
    );

    results = loaded;
    loading = false;
  }

  async function openDialog() {
    query = '';
    results = [];
    loading = false;
    currentScheme = getScheme();
    dialogEl.showModal();
    await tick();
    inputEl?.focus();
  }

  function handleClose() {
    query = '';
    results = [];
    loading = false;
    triggerEl?.focus();
  }

  function handleDialogClick(event: MouseEvent) {
    if (!dialogEl) return;
    const rect = dialogEl.getBoundingClientRect();
    const insideContent =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!insideContent) dialogEl.close();
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (!isShortcut) return;
    event.preventDefault();
    if (dialogEl?.open) {
      dialogEl.close();
    } else {
      openDialog();
    }
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (combined.length > 0) activeIndex = (activeIndex + 1) % combined.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (combined.length > 0) activeIndex = (activeIndex - 1 + combined.length) % combined.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = combined[activeIndex];
      if (item) activateItem(item);
    }
  }

  function activateItem(item: PaletteItem) {
    dialogEl.close();
    if (item.kind === 'action') {
      item.run();
      return;
    }
    navigate(item.href);
  }

  function clearQuery() {
    query = '';
    inputEl?.focus();
  }

  onMount(() => {
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  });
</script>

<button
  type="button"
  class="palette-trigger"
  bind:this={triggerEl}
  on:click={openDialog}
  aria-label="Open command palette"
>
  <svg class="palette-trigger-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path
      fill="currentColor"
      d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"
    />
  </svg>
  <span class="palette-trigger-hint" aria-hidden="true">{isMac ? '⌘K' : 'Ctrl+K'}</span>
</button>

<dialog
  bind:this={dialogEl}
  class="palette-dialog"
  aria-label="Command palette"
  on:click={handleDialogClick}
  on:close={handleClose}
>
  <div class="palette-header">
    <div class="palette-input-wrap">
      <input
        bind:this={inputEl}
        bind:value={query}
        type="text"
        class="palette-input"
        placeholder="Search or jump to…"
        aria-label="Command palette query"
        role="combobox"
        aria-expanded={dialogEl?.open}
        aria-controls="palette-listbox"
        aria-autocomplete="list"
        aria-activedescendant={combined.length > 0 ? `palette-option-${activeIndex}` : undefined}
        on:input={handleQueryInput}
        on:keydown={handleInputKeydown}
      />
      {#if query}
        <ClearButton on:click={clearQuery} />
      {/if}
    </div>
  </div>

  <ul
    bind:this={listEl}
    class="palette-list"
    role="listbox"
    id="palette-listbox"
    aria-label="Command palette results"
  >
    {#if themeMatches.length > 0}
      <li class="palette-group-label" role="presentation">Theme</li>
      {#each themeMatches as item, i (item.label)}
        <!-- svelte-ignore a11y_click_events_have_key_events -- keyboard activation routes through the input's Enter handler (roving aria-activedescendant), not a per-item listener -->
        <li
          role="option"
          id={`palette-option-${i}`}
          aria-selected={activeIndex === i}
          class="palette-item"
          class:active={activeIndex === i}
          on:mousemove={() => (activeIndex = i)}
          on:click={() => activateItem(item)}
        >
          <span class="palette-item-title">
            {item.label}
            {#if item.active}
              <span class="palette-item-current" aria-hidden="true">current</span>
            {/if}
          </span>
        </li>
      {/each}
    {/if}

    {#if navigateMatches.length > 0}
      <li class="palette-group-label" role="presentation">Navigate</li>
      {#each navigateMatches as item, i (item.href)}
        {@const globalIndex = themeMatches.length + i}
        <!-- svelte-ignore a11y_click_events_have_key_events -- keyboard activation routes through the input's Enter handler (roving aria-activedescendant), not a per-item listener -->
        <li
          role="option"
          id={`palette-option-${globalIndex}`}
          aria-selected={activeIndex === globalIndex}
          class="palette-item"
          class:active={activeIndex === globalIndex}
          on:mousemove={() => (activeIndex = globalIndex)}
          on:click={() => activateItem(item)}
        >
          <span class="palette-item-title">{item.label}</span>
        </li>
      {/each}
    {/if}

    {#if loading}
      <li class="palette-status" role="presentation">Searching…</li>
    {/if}

    {#if results.length > 0}
      <li class="palette-group-label" role="presentation">
        Results <span class="palette-result-count">· Found {results.length}</span>
      </li>
      {#each results as item, i (item.href)}
        {@const globalIndex = themeMatches.length + navigateMatches.length + i}
        <!-- svelte-ignore a11y_click_events_have_key_events -- keyboard activation routes through the input's Enter handler (roving aria-activedescendant), not a per-item listener -->
        <li
          role="option"
          id={`palette-option-${globalIndex}`}
          aria-selected={activeIndex === globalIndex}
          class="palette-item"
          class:active={activeIndex === globalIndex}
          on:mousemove={() => (activeIndex = globalIndex)}
          on:click={() => activateItem(item)}
        >
          <span class="palette-item-title">{item.label}</span>
          {#if item.excerpt}
            <p class="palette-item-excerpt">{@html item.excerpt}</p>
          {/if}
        </li>
      {/each}
    {/if}

    {#if isDev && query.trim()}
      <li class="palette-dev-notice" role="presentation">
        Content search requires a production build — npm run build && npm run preview.
      </li>
    {/if}

    {#if combined.length === 0 && !loading}
      <li class="palette-empty" role="presentation">No matches.</li>
    {/if}
  </ul>
</dialog>

<style>
  .palette-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: 2px;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .palette-trigger:hover {
    color: var(--color-accent);
  }

  .palette-trigger:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .palette-trigger-icon {
    flex-shrink: 0;
  }

  .palette-trigger-hint {
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    color: var(--color-text-muted);
  }

  /* Keyboard shortcut hint is meaningless on touch; hide it outright
     (rather than shrink it) to free up cramped nav-bar space there. */
  @media (hover: none) and (pointer: coarse) {
    .palette-trigger-hint {
      display: none;
    }
  }

  .palette-dialog {
    max-width: min(560px, calc(100vw - var(--space-6)));
    width: 100%;
    max-height: min(80vh, 640px);
    overflow-y: auto;
    margin: auto;
    padding: var(--space-5);
    border: 1px solid var(--color-border);
    background: var(--color-bg-raised);
    color: var(--color-text-primary);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    opacity: 0;
    transform: scale(0.96);
    pointer-events: none;
    transition:
      opacity var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard),
      overlay var(--duration-fast) allow-discrete,
      display var(--duration-fast) allow-discrete;
  }

  .palette-dialog[open] {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  @starting-style {
    .palette-dialog[open] {
      opacity: 0;
      transform: scale(0.96);
    }
  }

  .palette-dialog::backdrop {
    background: color-mix(in srgb, var(--color-bg-base) 80%, transparent);
    opacity: 0;
    transition:
      opacity var(--duration-fast) var(--ease-standard),
      overlay var(--duration-fast) allow-discrete,
      display var(--duration-fast) allow-discrete;
  }

  .palette-dialog[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    .palette-dialog[open]::backdrop {
      opacity: 0;
    }
  }

  .palette-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .palette-input-wrap {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .palette-input {
    width: 100%;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 2px;
    color: var(--color-text-primary);
    font-family: var(--font-family-ui);
    font-size: var(--font-size-2);
    padding: var(--space-3) var(--space-4);
    padding-right: var(--space-8);
    outline: none;
    transition: border-color var(--duration-fast) var(--ease-standard);
  }

  .palette-input::placeholder {
    color: var(--color-text-muted);
  }

  .palette-input:focus {
    border-color: var(--color-accent);
  }

  .palette-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .palette-group-label {
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: var(--space-2) var(--space-2) var(--space-1);
  }

  .palette-result-count {
    text-transform: none;
    letter-spacing: normal;
    font-weight: 400;
  }

  .palette-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-radius: 2px;
    cursor: pointer;
    color: var(--color-text-primary);
  }

  .palette-item.active {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
  }

  .palette-item-excerpt {
    margin: 0;
    font-size: var(--font-size-1);
    color: var(--color-text-muted);
  }

  .palette-item-excerpt :global(mark) {
    background: var(--color-accent-subtle);
    color: var(--color-text-primary);
    padding: 0 2px;
  }

  .palette-item-current {
    margin-left: var(--space-2);
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    color: var(--color-accent);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .palette-status,
  .palette-empty {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-1);
    color: var(--color-text-muted);
  }

  .palette-dev-notice {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    color: var(--color-text-muted);
  }
</style>
