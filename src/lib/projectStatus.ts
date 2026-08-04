/**
 * Narrative Cards session: Project Narrative Spec's `status` field is free
 * text, but listing cards (unlike the narrative detail meta sidebar, which
 * renders it unconditionally) only surface it when it signals active
 * development — a completed project stays unlabeled by default, and no
 * negative status ever renders on a card. Matched case-insensitively
 * against a closed trigger set rather than a substring/fuzzy test, so an
 * unanticipated status value (e.g. "Deprecated") fails safe by rendering
 * nothing instead of accidentally matching.
 */
const ACTIVE_STATUS_VALUES = new Set(['in development', 'active']);

export function isActiveStatus(status?: string): boolean {
  if (!status) return false;
  return ACTIVE_STATUS_VALUES.has(status.trim().toLowerCase());
}
