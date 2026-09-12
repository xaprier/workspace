<script lang="ts">
  import { onMount } from 'svelte';
  import { technologies, findTechnologySlug } from '../data/technologies';

  interface DialogProjectGithub {
    stars: string;
    language: string | null;
    pushedAtLabel: string;
  }

  interface DialogProject {
    slug: string;
    title: string;
    description: string;
    technologies?: string[];
    outboundLink: { url: string; kind: 'github' | 'external' };
    github: DialogProjectGithub | null;
  }

  // Project Details Dialog: one shared Svelte island per page, mounted once
  // on the Projects listing — every index card's "View details" action
  // opens this same instance rather than each card owning its own
  // <dialog>. Data for every index-tier project is passed once at mount
  // (this is a static build; there is nothing to fetch client-side), then
  // selected per-open by slug. No store is involved: this island isn't
  // transition:persist'd (see src/stores/route.ts's seam-resolution rule —
  // that store exists only for persisted islands that never get fresh
  // props on navigation), so a plain document-level click listener is
  // enough to hear "View details" buttons that live in the surrounding
  // static markup, outside this component's own DOM.
  export let projects: DialogProject[];
  export let asOfLabel: string;

  let dialogEl: HTMLDialogElement;
  let activeProject: DialogProject | null = null;
  let triggerEl: HTMLElement | null = null;

  function openDialog(slug: string, trigger: HTMLElement) {
    const project = projects.find((p) => p.slug === slug);
    if (!project) return;
    activeProject = project;
    triggerEl = trigger;
    dialogEl.showModal();
  }

  // Fires for every close path alike (Esc, backdrop click, the close
  // button's dialogEl.close() call) — one place resets state and returns
  // focus, rather than three call sites each having to remember to do it.
  function handleClose() {
    activeProject = null;
    triggerEl?.focus();
    triggerEl = null;
  }

  // Native <dialog> has no built-in "click outside closes" — clicking the
  // ::backdrop still dispatches a click on the <dialog> element itself, so
  // the reliable way to tell a backdrop click from a content click is
  // geometry: did the click land inside the dialog's own box.
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

  onMount(() => {
    function onDocumentClick(event: MouseEvent) {
      const trigger = (event.target as HTMLElement).closest<HTMLElement>('.view-details');
      if (!trigger) return;
      const slug = trigger.dataset.projectSlug;
      if (!slug) return;
      openDialog(slug, trigger);
    }
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  });
</script>

<dialog
  bind:this={dialogEl}
  class="project-dialog"
  aria-labelledby="project-dialog-title"
  on:click={handleDialogClick}
  on:close={handleClose}
>
  {#if activeProject}
    <div class="dialog-header">
      <h2 id="project-dialog-title" class="dialog-title">{activeProject.title}</h2>
      <button
        type="button"
        class="dialog-close"
        aria-label="Close dialog"
        on:click={() => dialogEl.close()}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </button>
    </div>

    <p class="dialog-description">{activeProject.description}</p>

    {#if activeProject.technologies && activeProject.technologies.length > 0}
      <ul class="tech-chips">
        {#each activeProject.technologies as tech (tech)}
          {@const slug = findTechnologySlug(tech)}
          {@const badge = slug ? technologies[slug] : null}
          <li>
            {#if badge}
              <a class="tech-badge" href={badge.url} target="_blank" rel="noopener noreferrer">
                {#if badge.icon}
                  <svg
                    class="tech-badge-icon"
                    viewBox={badge.icon.viewBox}
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <path fill="currentColor" d={badge.icon.path} />
                  </svg>
                {/if}
                <span>{badge.name}</span>
              </a>
            {:else}
              <span class="tech-chip">{tech}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if activeProject.github}
      <div class="dialog-github">
        <dl class="github-stats">
          <div class="github-row">
            <dt>Stars</dt>
            <dd>{activeProject.github.stars}</dd>
          </div>
          {#if activeProject.github.language}
            <div class="github-row">
              <dt>Language</dt>
              <dd>{activeProject.github.language}</dd>
            </div>
          {/if}
          <div class="github-row">
            <dt>Last push</dt>
            <dd>{activeProject.github.pushedAtLabel}</dd>
          </div>
        </dl>
        <p class="dialog-as-of">as of {asOfLabel}</p>
      </div>
    {/if}

    <a class="dialog-outbound" href={activeProject.outboundLink.url} target="_blank" rel="noopener noreferrer">
      {#if activeProject.outboundLink.kind === 'github'}
        <svg class="outbound-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          />
        </svg>
        <span>View on GitHub</span>
      {:else}
        <svg class="outbound-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6.75 2.5a.75.75 0 0 0 0 1.5h3.19L4.72 9.22a.75.75 0 1 0 1.06 1.06L11 5.06v3.19a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-.75-.75h-5Z"
          />
          <path
            fill="currentColor"
            d="M3.5 4A1.5 1.5 0 0 0 2 5.5v7A1.5 1.5 0 0 0 3.5 14h7a1.5 1.5 0 0 0 1.5-1.5V10a.75.75 0 0 0-1.5 0v2.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5H6A.75.75 0 0 0 6 4H3.5Z"
          />
        </svg>
        <span>View external reference</span>
      {/if}
    </a>
  {/if}
</dialog>

<style>
  /* Native <dialog> + showModal(): free focus trap, Esc-to-close,
     ::backdrop, and top-layer promotion — no hand-rolled overlay stack,
     no custom focus-trap library. Sharp corners (no border-radius),
     bg-raised surface, bordered — the same surface language as every
     other card/panel in this system, no new visual vocabulary for the
     site's first modal. */
  .project-dialog {
    /* Capped narrower than the initial pass (~480-520px, not 560px) so
       description prose and data rows don't sprawl at the panel's own
       comfortable reading width. */
    max-width: min(520px, calc(100vw - var(--space-6)));
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

    /* Fade + subtle scale on open, --duration-fast.
       @starting-style + transition-behavior: allow-discrete
       is the native-CSS way to animate a dialog's entry across its
       display:none -> top-layer jump, with no JS-driven animation and no
       delayed-close hack needed — only entry is animated, per spec (close
       is instant on every path: Esc, backdrop click, the close button).
       First use of this pattern on the site; degrades gracefully to an
       instant, unanimated open on any browser that doesn't support it. */
    opacity: 0;
    transform: scale(0.96);
    transition:
      opacity var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard),
      overlay var(--duration-fast) allow-discrete,
      display var(--duration-fast) allow-discrete;
  }

  .project-dialog[open] {
    opacity: 1;
    transform: scale(1);
  }

  @starting-style {
    .project-dialog[open] {
      opacity: 0;
      transform: scale(0.96);
    }
  }

  /* Scrim: bg-base at high opacity via color-mix rather than a dedicated
     token — this is the one consumer so far; worth promoting to a real
     --color-scrim token if a second dialog needs one. */
  .project-dialog::backdrop {
    background: color-mix(in srgb, var(--color-bg-base) 80%, transparent);
    opacity: 0;
    transition:
      opacity var(--duration-fast) var(--ease-standard),
      overlay var(--duration-fast) allow-discrete,
      display var(--duration-fast) allow-discrete;
  }

  .project-dialog[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    .project-dialog[open]::backdrop {
      opacity: 0;
    }
  }

  /* Title and close share one header row (2026-07-19 layout pass) — the
     close button no longer sits on its own row above the title, which was
     leaving a dead zone of empty space before any real content appeared. */
  .dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .dialog-close {
    flex-shrink: 0;
    /* Optical alignment: nudges the icon onto the title's cap-height
       rather than its own box's top edge. */
    margin-top: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1);
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .dialog-close:hover {
    color: var(--color-accent);
  }

  .dialog-close:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .dialog-title {
    margin: 0;
    font-size: var(--font-size-4);
    color: var(--color-text-primary);
  }

  .dialog-description {
    margin: var(--space-3) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-2);
  }

  .tech-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    list-style: none;
    margin: var(--space-4) 0 0;
    padding: 0;
  }

  .tech-chips li {
    display: flex;
  }

  .tech-chip {
    border: 1px solid var(--color-border);
    border-radius: 2px;
    padding: 2px var(--space-2);
    font-size: var(--font-size-1);
    color: var(--color-text-secondary);
  }

  .tech-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: 2px;
    padding: 2px var(--space-2);
    font-size: var(--font-size-1);
    color: var(--color-text-secondary);
    text-decoration: none;
    transition:
      color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard);
  }

  .tech-badge:hover,
  .tech-badge:focus-visible {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .tech-badge:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .tech-badge-icon {
    flex-shrink: 0;
  }

  /* Hairline + --space-5 separates this from the chips above (2026-07-19
     layout pass) — a section break, not just another item in the flow. */
  .dialog-github {
    display: flex;
    flex-direction: column;
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  /* Label/value rows, same dl language as the Hub's Workbench block —
     label sans/muted, value mono, one
     row per data point rather than the earlier stacked-block layout, so
     three data points read as a small table instead of three separate
     mini-cards competing for space. */
  .github-stats {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
  }

  .github-row {
    display: grid;
    grid-template-columns: minmax(8rem, auto) 1fr;
    column-gap: var(--space-3);
    align-items: baseline;
  }

  .github-row dt {
    margin: 0;
    font-size: var(--font-size-1);
    color: var(--color-text-muted);
  }

  /* Computed data values (stars, language, last-push date) render mono per
     the mono dosing rule — this is the value half of a label/value pair,
     not free-text prose. */
  .github-row dd {
    margin: 0;
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    color: var(--color-text-secondary);
  }

  /* Freshness honesty: values freeze at build time, so this line always
     sits next to them rather than letting a frozen number pass as live.
     Tight gap from the data block above (a footnote to it, not a fourth
     row) — the section break lives above the whole block, not between the
     block and this line. */
  .dialog-as-of {
    margin: var(--space-2) 0 0;
    font-size: var(--font-size-1);
    font-family: var(--font-family-mono);
    color: var(--color-text-muted);
  }

  /* Hairline + --space-5 again, same section-break treatment as the
     GitHub block above — the outbound link closes the dialog as its own
     distinct section, not a trailing inline element. */
  .dialog-outbound {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    align-self: flex-start;
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--font-size-1);
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .dialog-outbound:hover,
  .dialog-outbound:focus-visible {
    color: var(--color-accent);
  }

  .dialog-outbound:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .outbound-icon {
    flex-shrink: 0;
  }
</style>
