// Notes Spec: Content Types (closed list) — human-readable labels for the
// five closed type values. Kept independent of astro:content's inferred
// enum type so this file can be imported from Svelte islands without
// pulling in Astro content-collection types on the client.
export const NOTE_TYPES = ['quick-note', 'deep-dive', 'build-log', 'tutorial', 'retrospective'] as const;

export type NoteType = (typeof NOTE_TYPES)[number];

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  'quick-note': 'Quick note',
  'deep-dive': 'Deep dive',
  'build-log': 'Build log',
  tutorial: 'Tutorial',
  retrospective: 'Retrospective',
};
