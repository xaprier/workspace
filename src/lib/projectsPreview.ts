import type { CollectionEntry } from 'astro:content';

/**
 * Project Narrative Spec: Pinning and Hub Preview Contract.
 * 1. Pinned narratives exist -> most recently updated among them.
 * 2. No pinned narratives -> most recently updated among all narratives.
 * 3. Index-tier entries are never previewed.
 * 4. No narratives at all -> no preview (legitimate empty state).
 */
export function getProjectsPreview(
  projects: CollectionEntry<'projects'>[],
): CollectionEntry<'projects'> | null {
  const narratives = projects.filter((project) => project.data.tier === 'narrative');
  if (narratives.length === 0) return null;

  const pinned = narratives.filter((project) => project.data.pinned);
  const pool = pinned.length > 0 ? pinned : narratives;

  return pool.reduce((mostRecent, candidate) =>
    candidate.data.updatedAt.valueOf() > mostRecent.data.updatedAt.valueOf() ? candidate : mostRecent,
  );
}
