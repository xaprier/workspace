import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Field naming is directional — proposed here, kept consistent across collections.

const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/projects' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      // Project Narrative Spec: Content Model Instantiation — one type, tier field.
      tier: z.enum(['narrative', 'index']),
      // Project Narrative Spec: Outbound Links — classification of what the
      // link points to (open-source vs. external/closed-source).
      outboundLink: z
        .object({
          url: z.string().url(),
          kind: z.enum(['github', 'external']),
        })
        .optional(),
      // Project Narrative Spec: Pinning and Hub Preview Contract — narrative-tier only.
      pinned: z.boolean().default(false),
      // Project Narrative Spec: Architecture Diagram Requirement — author
      // declares whether the project meets >=1 of the 5 criteria. Structural
      // presence (Architecture heading + diagram) is checked by
      // scripts/content-lint.mjs, not by this schema — the criteria
      // themselves are a judgment call about the project, not derivable
      // from frontmatter alone.
      architectureDiagramRequired: z.boolean().default(false),
      // Architecture Diagram Requirement escape hatch (2026-07-19, Diagram
      // Waiver session): closed-source client work can meet the criteria
      // yet have nothing shareable to diagram. Presence of a non-empty
      // reason here suppresses the Architecture-section promotion
      // requirement in scripts/content-lint.mjs — see that file for the
      // enforcement side. The reason is author-facing prose, rendered
      // nowhere on the page; it exists so the waiver itself is never a bare
      // boolean with no accountability for why it was invoked.
      architectureDiagramWaived: z.string().min(1).optional(),
      // Closed optional meta set (2026-07-17 Projects redesign session).
      // Narrative-tier oriented — the narrative detail sidebar is where
      // most of these render — but not schema-restricted to that tier:
      // `technologies` also renders on index-tier cards when present.
      // No new content-lint rule; these are purely additive frontmatter.
      technologies: z.array(z.string()).optional(),
      role: z.string().optional(),
      timeframe: z.string().optional(),
      collaborators: z.array(z.string()).optional(),
      company: z.string().optional(),
      status: z.string().optional(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    })
    .superRefine((data, ctx) => {
      if (data.tier === 'index' && !data.outboundLink) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Index-tier Projects require an outboundLink (Project Narrative Spec: Outbound Links).',
          path: ['outboundLink'],
        });
      }
      if (data.tier === 'index' && data.pinned) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Pinning applies only to narrative-tier Projects (Project Narrative Spec: Pinning and Hub Preview Contract).',
          path: ['pinned'],
        });
      }
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z
    .object({
      title: z.string(),
      // Notes Spec: Content Model Instantiation — one type, mutable type field.
      type: z.enum(['quick-note', 'deep-dive', 'build-log', 'tutorial', 'retrospective']),
      // Notes Spec: Linked Project — one-directional, at most one, mandatory
      // for build-log only.
      linkedProject: reference('projects').optional(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'build-log' && !data.linkedProject) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Build log Notes require a linkedProject (Notes Spec: Linked Project).',
          path: ['linkedProject'],
        });
      }
    }),
});

const framing = defineCollection({
  // Hub Surface Definition: Cardinality — singleton, capped at one entry,
  // same enforcement pattern as `focus` (content-lint, not Zod).
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/framing' }),
  schema: z.object({
    name: z.string(),
    identityLine: z.string(),
    // Hub Surface Definition: contact info is a facet of the Framing
    // Statement, not a separate content item — kept as a nested object here.
    contact: z.object({
      email: z.string().email().optional(),
      github: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      // Identity & Polish nav pass: contact enrichment. `location` is
      // plain text ("Based in {city}"), not a link. `resume` is a path
      // or URL (z.string(), not z.string().url(), so a same-origin
      // static path like "/resume.pdf" is valid alongside a full URL).
      // Both optional; nothing renders for either when absent.
      location: z.string().optional(),
      resume: z.string().optional(),
    }),
    // Timeline entries live as frontmatter data on the same singleton file
    // rather than a sibling collection — small, evolves in lockstep with
    // the rest of the Framing Statement.
    timeline: z
      .array(
        z.object({
          // Renamed from `year` (2026-07-19 range refinement): entries now
          // display a date range ("2021 – 2023", "Sep 2023 – Sep 2024"),
          // not a bare year. Kept as a free display string rather than
          // start/end date fields — the ranges mix granularity (year-only
          // vs. month+year) and this is presentation data the author
          // types directly, not a value anything computes from, so a
          // structured start/end pair would buy formatting logic this
          // content never needs (flagged: a start/end-field alternative
          // was considered and set aside for this reason).
          dateRange: z.string(),
          label: z.string(),
          description: z.string().optional(),
          // Marks the "you are here" entry for accent-dosing on the Hub
          // (2026-07-18 composition pass) — a content-authored signal, not
          // derived from the system clock, so it stays correct after the
          // calendar year moves on without needing a redeploy.
          current: z.boolean().default(false).optional(),
          // Hub TOC/timeline session: classifies an entry as education,
          // work, or a milestone, so a reader scanning the timeline can
          // tell school from employment without the chronology splitting
          // into separate sections. Optional — absence renders no label,
          // backward compatible with entries that predate this field.
          kind: z.enum(['education', 'work', 'milestone']).optional(),
        }),
      )
      .min(1),
    // Identity & Polish nav pass: lets the Hub's section labels be
    // content-authored instead of hardcoded. Extended (Hub TOC session)
    // from just `timeline` to every section the Hub renders, so the
    // Hub TOC can source its entry text from the exact same field each
    // section heading already reads, rather than hardcoding the label a
    // second time for the TOC. Every key optional, falls back to the
    // existing hardcoded default when unset.
    sectionLabels: z
      .object({
        timeline: z.string().optional(),
        projects: z.string().optional(),
        notes: z.string().optional(),
        workbench: z.string().optional(),
        techStack: z.string().optional(),
        contact: z.string().optional(),
      })
      .optional(),
    // Identity & Polish pass: the Hub's Workbench block — a closed set of
    // labeled entries describing the actual working environment, not a
    // freeform list (an equipment list, not a terminal
    // cosplay). Every field optional; the whole object is optional so a
    // Framing Statement can exist without one, and the Workbench section
    // is omitted entirely when it's absent (same omission pattern as the
    // other optional Hub preview sections).
    workbench: z
      .object({
        os: z.string().optional(),
        wm: z.string().optional(),
        editor: z.string().optional(),
        shell: z.string().optional(),
        buildTools: z.string().optional(),
      })
      .optional(),
    // Identity & Polish nav pass: the Hub's Tech Stack section —
    // categorized plain lists (no percentage bars, no proficiency
    // indicator of any kind; presence in a category is the whole
    // signal), sourced as an array of category/slug groups rather than
    // a closed field set like `workbench`, since the category set
    // itself is author-defined, not a fixed list. `items` are technology
    // registry slugs (src/data/technologies.ts) — unlike Projects'
    // `technologies` field, which resolves free text, this is a small,
    // author-curated list where writing the registry key directly is
    // the natural authoring form. The whole field is optional; the
    // section is omitted entirely when absent (same omission pattern as
    // the other optional Hub sections).
    techStack: z
      .array(
        z.object({
          category: z.string(),
          items: z.array(z.string()).min(1),
        }),
      )
      .optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }),
});

export const collections = { projects, notes, framing };
