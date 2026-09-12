<script lang="ts">
  import { NOTE_TYPE_LABELS, type NoteType } from '../lib/noteTypeLabels';
  import { withBase } from '../lib/withBase';

  interface NoteSummary {
    slug: string;
    title: string;
    type: NoteType;
    createdAt: string;
    linkedProject: { slug: string; title: string } | null;
  }

  export let notes: NoteSummary[];

  // Notes Spec: Ordering Semantics — stream order is authorship
  // chronology (created time). Notes arrives here already sorted by
  // notes/index.astro; filtering below only narrows the same order, it
  // never re-sorts.
  const presentTypes = [...new Set(notes.map((note) => note.type))];

  let activeType: NoteType | null = null;

  $: filtered = activeType ? notes.filter((note) => note.type === activeType) : notes;

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formatDate = (iso: string) => dateFormatter.format(new Date(iso));
</script>

<div class="notes-stream">
  {#if presentTypes.length > 1}
    <div class="filter-chips" role="group" aria-label="Filter notes by type">
      <button
        type="button"
        class="chip"
        class:active={activeType === null}
        aria-pressed={activeType === null}
        on:click={() => (activeType = null)}
      >
        All
      </button>
      {#each presentTypes as type (type)}
        <button
          type="button"
          class="chip"
          class:active={activeType === type}
          aria-pressed={activeType === type}
          on:click={() => (activeType = type)}
        >
          {NOTE_TYPE_LABELS[type]}
        </button>
      {/each}
    </div>
  {/if}

  <ol class="stream">
    {#each filtered as note (note.slug)}
      <li class="stream-entry">
        <a class="entry-title" href={withBase(`/notes/${note.slug}`)}>{note.title}</a>
        <p class="entry-meta">
          <span class="entry-type">{NOTE_TYPE_LABELS[note.type]}</span>
          <span class="entry-date">{formatDate(note.createdAt)}</span>
        </p>
        {#if note.linkedProject}
          <p class="entry-linked-project">
            <span class="linked-project-label">Part of:</span>
            <a href={withBase(`/projects/${note.linkedProject.slug}`)}>{note.linkedProject.title}</a>
          </p>
        {/if}
      </li>
    {/each}
  </ol>
</div>

<style>
  /* Separation between the chip row and the list is owned here, by the
     wrapper (a flex gap between its own children), not borrowed from the
     chip row's own margin — so it holds whether or not the chip row
     renders at all (Notes Spec: chip row omitted below two types), and
     the list never has to know whether chips preceded it. */
  .notes-stream {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .chip {
    border: 1px solid var(--color-border);
    border-radius: 2px;
    background: transparent;
    color: var(--color-text-secondary);
    font-family: var(--font-family-ui);
    font-size: var(--font-size-1);
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
  }

  .chip.active {
    border-color: var(--color-accent-subtle);
    background: var(--color-accent-subtle);
    color: var(--color-text-primary);
  }

  .chip:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .stream {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  /* Every row — first, middle, last — gets identical padding on all four
     sides, so the hover surface below (bounded by this padding box) is
     geometrically identical regardless of position. Horizontal padding
     plus an equal negative margin keeps the text column exactly where it
     already sat (flush with the stream's own width) while giving the
     hover surface room to inset the text within it rather than touching
     its edge — the row's box extends into the gutter by --space-4 on
     each side, text stays put. */
  .stream-entry {
    padding: var(--space-5) var(--space-4);
    margin: 0 calc(var(--space-4) * -1);
    border-top: 1px solid var(--color-border);
    transition:
      background-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
  }

  /* Only the separator line is omitted on the first entry (Notes Spec's
     documented rhythm — separation from whatever precedes the list is
     the wrapper's gap, above, not this row's own line). Padding is
     deliberately NOT zeroed here: an asymmetric first-row padding is
     exactly what made its hover box hug the chip row above instead of
     floating with the same breathing room every other row gets. */
  .stream-entry:first-child {
    border-top: none;
  }

  /* Row hover/focus: background tint plus a transient left accent edge —
     the same visual device as the pinned-card/blockquote accent stripe,
     disambiguated by time domain rather than dropped: that stripe is
     persistent (a standing state), this one is transient (appears only
     while hovered/focused, gone otherwise).
     The inset box-shadow (not a real border) avoids any layout shift on
     appearance, and the reduced-motion policy (Motion Tokens) collapses
     its transition to instant — it appears, it doesn't slide in. */
  .stream-entry:hover,
  .stream-entry:focus-within {
    background-color: var(--color-bg-raised);
    box-shadow: inset 3px 0 0 var(--color-accent);
  }

  .entry-title {
    display: block;
    font-size: var(--font-size-3);
    font-weight: 600;
    color: var(--color-text-primary);
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
    display: flex;
    gap: var(--space-3);
    margin: var(--space-2) 0 0;
    font-size: var(--font-size-1);
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
  }

  .entry-linked-project {
    margin: var(--space-2) 0 0;
    font-size: var(--font-size-1);
  }

  .linked-project-label {
    color: var(--color-text-muted);
  }

  /* Quieter dosage than the detail header's standing-accent treatment —
     muted until hover, matching the stream's overall quiet register (one
     pattern, two dosage levels). */
  .entry-linked-project a {
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .entry-linked-project a:hover,
  .entry-linked-project a:focus-visible {
    color: var(--color-accent);
  }

  .entry-linked-project a:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
</style>
