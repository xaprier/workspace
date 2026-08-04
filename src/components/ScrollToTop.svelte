<script lang="ts">
  import { onMount } from 'svelte';

  const SHOW_AFTER_VIEWPORTS = 1;

  let visible = false;

  function scrollToTop() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  onMount(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        visible = window.scrollY > window.innerHeight * SHOW_AFTER_VIEWPORTS;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<button
  type="button"
  class="scroll-to-top"
  class:visible
  aria-label="Scroll to top"
  aria-hidden={!visible}
  tabindex={visible ? 0 : -1}
  on:click={scrollToTop}
>
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path
      fill="currentColor"
      d="M8 3.5a.75.75 0 0 1 .53.22l4 4a.75.75 0 1 1-1.06 1.06L8.75 6.06V12a.75.75 0 0 1-1.5 0V6.06L4.53 8.78a.75.75 0 1 1-1.06-1.06l4-4A.75.75 0 0 1 8 3.5Z"
    />
  </svg>
</button>

<style>
  .scroll-to-top {
    position: fixed;
    right: var(--space-5);
    bottom: var(--space-5);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--color-bg-raised);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    color: var(--color-text-muted);
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-fast) var(--ease-standard);
  }

  .scroll-to-top:hover,
  .scroll-to-top:focus-visible {
    color: var(--color-accent);
  }

  .scroll-to-top:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .scroll-to-top.visible {
    opacity: 1;
    pointer-events: auto;
  }
</style>
