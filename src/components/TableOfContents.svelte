<script lang="ts">
  import { onMount } from 'svelte';

  export let sections: { slug: string; text: string }[];

  // Trigger line: a heading becomes active once it crosses this far below
  // the viewport top, not when it's merely somewhere in a middle band —
  // this lands a clicked TOC target inside its own active zone immediately.
  const TRIGGER_OFFSET = 100;

  let activeSlug = sections[0]?.slug ?? '';
  let suppressScrollUpdates = false;

  function computeActive(): string | null {
    const elements = sections
      .map((section) => document.getElementById(section.slug))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return null;

    const doc = document.documentElement;
    const atTop = window.scrollY <= 0;
    const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 1;

    // Edge cases override the trigger-line math outright: a short final
    // section may never cross the trigger line on its own, and the very
    // top of the page should always read as the first section.
    if (atTop) return elements[0].id;
    if (atBottom) return elements[elements.length - 1].id;

    let current = elements[0].id;
    for (const el of elements) {
      if (el.getBoundingClientRect().top <= TRIGGER_OFFSET) {
        current = el.id;
      }
    }
    return current;
  }

  function updateActive() {
    if (suppressScrollUpdates) return;
    const next = computeActive();
    if (next !== null) activeSlug = next;
  }

  function handleSelectChange(event: Event) {
    const slug = (event.target as HTMLSelectElement).value;
    handleClick(slug);
    document.getElementById(slug)?.scrollIntoView();
  }

  function handleClick(slug: string) {
    // Set active optimistically on click rather than waiting for scroll
    // events to catch up, then suppress scroll-driven recalculation until
    // the browser's smooth scroll settles, so the active item doesn't
    // flicker through intermediate headings mid-scroll.
    activeSlug = slug;
    suppressScrollUpdates = true;

    const clearSuppression = () => {
      suppressScrollUpdates = false;
      updateActive();
    };

    if ('onscrollend' in window) {
      window.addEventListener('scrollend', clearSuppression, { once: true });
    } else {
      setTimeout(clearSuppression, 700);
    }
  }

  onMount(() => {
    updateActive();

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActive();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  });
</script>

<nav class="toc" aria-label="Sections">
  {#each sections as section (section.slug)}
    <a
      class="toc-link"
      class:active={activeSlug === section.slug}
      href={`#${section.slug}`}
      aria-current={activeSlug === section.slug ? 'true' : undefined}
      on:click={() => handleClick(section.slug)}
    >
      {section.text}
    </a>
  {/each}
</nav>

<select class="toc-select" aria-label="Jump to section" bind:value={activeSlug} on:change={handleSelectChange}>
  {#each sections as section (section.slug)}
    <option value={section.slug}>{section.text}</option>
  {/each}
</select>

<style>
  .toc {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .toc-select {
    display: none;
  }

  /* Mirrors the site's one existing breakpoint (ReadingLayout.astro,
     ThemeControl.svelte) — the scrollspy nav has no room below it, so the
     TOC's mobile layer is a native jump-menu instead. */
  @media (max-width: 959px) {
    .toc {
      display: none;
    }

    .toc-select {
      display: block;
      width: 100%;
      background: var(--color-bg-raised);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      border-radius: 2px;
      padding: var(--space-2) var(--space-3);
      font-family: var(--font-family-ui);
      font-size: var(--font-size-1);
    }

    .toc-select:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }
  }

  .toc-link {
    padding: var(--space-1) 0 var(--space-1) var(--space-3);
    border-left: 2px solid transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
    text-decoration: none;
    transition:
      color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard);
  }

  .toc-link:hover,
  .toc-link:focus-visible {
    color: var(--color-text-secondary);
  }

  .toc-link.active {
    color: var(--color-accent);
    border-left-color: var(--color-accent);
  }

  .toc-link:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
</style>
