<script lang="ts">
  import { onMount } from 'svelte';
  import { SCHEMES, getScheme, setScheme, SCHEME_CHANGE_EVENT, type Scheme } from '../lib/colorScheme';

  let current: Scheme = 'warm';
  let locked = false;
  let hovered = false;
  let focused = false;
  let wrapperEl: HTMLDivElement;
  let triggerEl: HTMLButtonElement;
  let hoverCloseTimeout: ReturnType<typeof setTimeout> | undefined;

  $: expanded = hovered || focused || locked;

  function select(scheme: Scheme) {
    current = scheme;
    setScheme(scheme);
    locked = false;
  }

  function toggleLocked() {
    locked = !locked;
  }

  function handleMouseEnter() {
    clearTimeout(hoverCloseTimeout);
    hovered = true;
  }

  function handleMouseLeave() {
    clearTimeout(hoverCloseTimeout);
    hoverCloseTimeout = setTimeout(() => {
      hovered = false;
    }, 120);
  }

  function handleFocusIn() {
    focused = true;
  }

  function handleFocusOut(e: FocusEvent) {
    if (wrapperEl && !wrapperEl.contains(e.relatedTarget as Node)) {
      focused = false;
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (locked && wrapperEl && !wrapperEl.contains(e.target as Node)) {
      locked = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && (locked || focused)) {
      locked = false;
      triggerEl?.focus();
    }
  }

  function handleSchemeChange(e: Event) {
    current = (e as CustomEvent<Scheme>).detail;
  }

  onMount(() => {
    current = getScheme();
    window.addEventListener(SCHEME_CHANGE_EVENT, handleSchemeChange);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener(SCHEME_CHANGE_EVENT, handleSchemeChange);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
      clearTimeout(hoverCloseTimeout);
    };
  });
</script>

<div
  class="theme-control"
  class:expanded
  role="group"
  aria-label="Color scheme"
  bind:this={wrapperEl}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:focusin={handleFocusIn}
  on:focusout={handleFocusOut}
>
  <div class="theme-chips-track">
    <ul class="theme-chips" role="listbox" aria-label="Color scheme options">
      {#each SCHEMES as scheme (scheme.value)}
        <li role="presentation">
          <button
            type="button"
            class="theme-chip"
            class:active={current === scheme.value}
            data-color-scheme={scheme.value}
            role="option"
            aria-pressed={current === scheme.value}
            aria-selected={current === scheme.value}
            aria-label={scheme.label}
            tabindex={expanded ? 0 : -1}
            on:click={() => select(scheme.value)}
          >
            <span class="theme-chip-dot" aria-hidden="true"></span>
            <span class="theme-chip-label">{scheme.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <button
    type="button"
    class="theme-trigger"
    class:active={expanded}
    bind:this={triggerEl}
    aria-label="Change color scheme"
    aria-expanded={expanded}
    on:click={toggleLocked}
  >
    <svg class="theme-trigger-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 12.5V2.5a5.5 5.5 0 0 1 0 11Z"
      />
    </svg>
  </button>
</div>

<style>
  .theme-control {
    position: relative;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    border: 1px solid transparent;
    transition:
      background-color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard);
  }

  .theme-control.expanded {
    background: var(--color-bg-raised);
    border-color: var(--color-border);
  }

  .theme-chips-track {
    position: absolute;
    top: 100%;
    right: 0;
    width: max-content;
    border-radius: 2px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-raised);
    opacity: 0;
    transform: translateY(-4px);
    pointer-events: none;
    transition:
      opacity var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }

  .theme-control.expanded .theme-chips-track {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .theme-chips {
    list-style: none;
    margin: 0;
    max-height: min(360px, 60vh);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: var(--space-2);
  }

  .theme-chip {
    display: flex;
    width: 100%;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 2px;
    white-space: nowrap;
  }

  .theme-chip-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent);
    transition:
      transform var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
  }

  .theme-chip.active .theme-chip-dot {
    transform: scale(1.15);
    box-shadow:
      0 0 0 2px var(--color-bg-raised),
      0 0 0 3px var(--color-accent);
  }

  .theme-chip-label {
    font-size: var(--font-size-1);
    color: var(--color-text-secondary);
  }

  .theme-chip:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .theme-trigger {
    display: inline-flex;
    align-items: center;
    padding: var(--space-2);
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: 50%;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .theme-trigger:hover,
  .theme-trigger.active {
    color: var(--color-accent);
  }

  .theme-trigger:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
</style>
