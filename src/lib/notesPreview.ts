import type { CollectionEntry } from 'astro:content';

/**
 * Notes Spec: Ordering Semantics and Preview Contract.
 * 1. No pinning — recency alone is the signal.
 * 2. Selects by most recently created-OR-updated (Math.max), not stream
 *    order (which is created-time only, see notes/index.astro).
 * 3. Zero notes -> no preview (legitimate empty state).
 */
export function getNotesPreview(notes: CollectionEntry<'notes'>[]): CollectionEntry<'notes'> | null {
  if (notes.length === 0) return null;

  const freshness = (note: CollectionEntry<'notes'>) =>
    Math.max(note.data.createdAt.valueOf(), note.data.updatedAt.valueOf());

  return notes.reduce((mostRecent, candidate) =>
    freshness(candidate) > freshness(mostRecent) ? candidate : mostRecent,
  );
}
