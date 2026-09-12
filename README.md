# Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy](https://github.com/xaprier/workspace/actions/workflows/deploy.yml/badge.svg)](https://github.com/xaprier/workspace/actions/workflows/deploy.yml)

**A content-driven personal engineering site template.**

Astro + Svelte islands, token-themed, MDX-driven. Renders a software
engineer's projects and notes as structured content, not a static resume
— a small set of typed content collections drive every page, so adding a
project or writing up a build log means authoring a file, not touching
layout code.

**Live example**: [workspace](https://xaprier.dev/workspace) — a real, populated instance of this template, not placeholder sample content. Clone this repo and your own demo lands at your own domain or GitHub Pages URL instead

> This is a template, not a hosted product. Clone it, replace the sample
> content and identity with your own, and it becomes your site.

## Feature tour

### Content Model

- **Three primary surfaces.** Hub (orientation — a single "Framing
  Statement" plus a timeline, workbench, and tech stack), Projects
  (narratives and index entries), and Notes (five closed content types).
- **Narratives vs. index-tier Projects.** A narrative is a full write-up
  (mandatory Problem / Approach / Outcome, optional Tradeoffs /
  Architecture / Alternatives Considered / Lessons Learned). An index
  entry is a lightweight name + description + outbound link, for work
  that doesn't warrant a full write-up. Narratives can be pinned for
  Projects-surface prominence; the Hub always previews exactly one
  (most-recently-updated pinned narrative, or most-recently-updated
  narrative overall).
- **Five Notes types**, one content model: Quick note, Deep dive, Build
  log, Tutorial, Retrospective. A Note may point at one Project via a
  one-directional `linkedProject` reference (mandatory for Build log).

### Interaction

- **Command Palette** (⌘K / Ctrl+K, Shell-owned). Jump to any page or
  full-text search across content, powered by Pagefind at build time —
  zero client-side index shipped until the palette opens. Search only
  works against a production build (`npm run build && npm run preview`);
  the dev server has no Pagefind index to query.
- **Project Details Dialog with build-time GitHub data.** Index-tier
  Projects linking to a GitHub repo show live star count, primary
  language, and last-push date in a dialog — fetched once at build time
  (never at request or client time), so it costs zero client JS and
  never blocks a build on GitHub being unreachable.
- **Paginated Projects and Notes listings.** Both surfaces page their
  content lists rather than rendering everything at once, so a growing
  archive doesn't turn into one long scroll.

### Theming

- **One Color Scheme axis, ten presets.** Warm, Cool, Ember, Dusk, Plum,
  Midnight, Harbor, Cobalt, Noir, and Tropic — plain CSS custom
  properties, no runtime framework tax. The site is dark-only by design.
  Switchable anytime via the Shell-owned Theme Control or the Command
  Palette's Theme group, and the choice persists across visits.
- **Restricting or re-defaulting the switcher.** Edit `src/theme.config.mjs`:
  `ENABLED_SCHEMES` is the list of presets exposed in the UI (shrink it
  to whatever subset you want — everything else in the app derives from
  this array, no other file needs touching), and `DEFAULT_SCHEME` is the
  fallback applied on first visit and whenever a stored preference is no
  longer enabled. `DEFAULT_SCHEME` must be one of `ENABLED_SCHEMES`; the
  config throws at load time if it isn't.

### Diagrams

- **Architecture diagrams, two ways.** A ```` ```mermaid ```` code block
  in any narrative's MDX renders to an inline SVG at build time — zero
  client JS, no Mermaid runtime shipped to the browser. A hand-authored
  or pre-rendered static SVG works identically, referenced as a normal
  Markdown image. Both get the same visual framing (see Content Guide,
  below).

## Quickstart

Requires Node.js ≥ 22.12 (see `engines` in `package.json`).

```sh
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
npm run preview  # preview the production build locally
```

`npm run build` runs `npm run lint:content` first (via the `prebuild`
script) — a structural content validator (`scripts/content-lint.mjs`)
that checks things Zod schemas can't: mandatory narrative sections,
unknown section names, the Architecture Diagram Requirement, and
singleton-collection cardinality (Hub's Framing Statement).

## Content guide

All content lives under `src/content/<collection>/` as `.md` or `.mdx`
files, typed by the Zod schemas in `src/content.config.ts`. Field tables
below are generated from that file directly, so they can't drift from
what the schema actually enforces.

### `projects`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | Yes | |
| `description` | `string` | Yes | |
| `tier` | `'narrative' \| 'index'` | Yes | |
| `outboundLink` | `{ url: string (URL), kind: 'github' \| 'external' }` | Index-tier only | Narratives may optionally carry one too. |
| `pinned` | `boolean` | No (default `false`) | Narrative-tier only. |
| `architectureDiagramRequired` | `boolean` | No (default `false`) | Author-declared; see the Architecture Diagram Requirement below. |
| `architectureDiagramWaived` | `string` | No | Non-empty reason required when set; see the Architecture Diagram Requirement below. |
| `technologies` | `string[]` | No | Free text. |
| `role` | `string` | No | |
| `timeframe` | `string` | No | |
| `collaborators` | `string[]` | No | |
| `company` | `string` | No | |
| `status` | `string` | No | |
| `createdAt` | `date` | Yes | |
| `updatedAt` | `date` | Yes | |

A narrative is any Project with a `## Problem`, `## Approach`, and
`## Outcome` section in its body (checked by content-lint, not the
schema). Four further sections are allowed, and no others:
`## Tradeoffs`, `## Architecture`, `## Alternatives Considered`,
`## Lessons Learned`.

**Architecture Diagram Requirement.** If `architectureDiagramRequired`
is `true`, content-lint requires an `## Architecture` section containing
at least one detectable diagram — a Markdown image, an `<img>` tag, or a
fenced code block (which covers a ```` ```mermaid ```` block). Set this
to `true` once a project has a real diagram to back the section; leaving
it `false` keeps Architecture optional.

Setting `architectureDiagramWaived` to a non-empty reason suppresses that
requirement instead — for a project that meets the criteria but has
nothing shareable to diagram (closed-source client work under
confidentiality, for example). The Architecture section reverts to
optional; if included anyway, it should state the withholding rather
than fabricate structural detail or ship a diagram vague enough to say
nothing.

### `notes`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | Yes | |
| `type` | `'quick-note' \| 'deep-dive' \| 'build-log' \| 'tutorial' \| 'retrospective'` | Yes | |
| `linkedProject` | reference to `projects` | Build log only | At most one; one-directional. |
| `createdAt` | `date` | Yes | |
| `updatedAt` | `date` | Yes | |

### `framing` (Hub's singleton Framing Statement)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | Yes | |
| `identityLine` | `string` | Yes | |
| `contact` | `{ email?, github?, linkedin?, location?, resume? }` | Yes (object itself required; every sub-field optional) | |
| `timeline` | array of `{ dateRange: string, label: string, description?: string, current?: boolean, kind?: 'education' \| 'work' \| 'milestone' }`, min 1 | Yes | |
| `sectionLabels` | `{ timeline?, projects?, notes?, workbench?, techStack?, contact? }` (all `string`) | No | Overrides hardcoded section headings. |
| `workbench` | `{ os?, wm?, editor?, shell?, buildTools? }` (all `string`) | No | Section omitted entirely when absent. |
| `techStack` | array of `{ category: string, items: string[] (min 1) }` | No | `items` are slugs from `src/data/technologies.ts`. |
| `createdAt` | `date` | Yes | |
| `updatedAt` | `date` | Yes | |

At most one entry (enforced by content-lint, not the schema).

## Deployment notes

`npm run build` produces a fully static `dist/` — no server runtime
required. Host it on any static file host (the repo doesn't commit to
one).

An optional `GITHUB_TOKEN` environment variable (see `.env.example`)
raises the GitHub API rate limit used by the Project Details Dialog's
build-time fetch (60 req/hour anonymous → 5,000 req/hour authenticated).
It needs no scopes beyond public-repo read access, and the build
succeeds without it — the dialog simply omits the live GitHub data block
for any repo it couldn't fetch.

GitHub does not allow a repository secret to be literally named
`GITHUB_TOKEN` (the name is reserved for the token GitHub Actions
provides automatically). To raise the build's GitHub API rate limit
using a Personal Access Token instead of the default automatic token,
store it under a different secret name (e.g. `GH_TOKEN`) and map it to
the build step's `GITHUB_TOKEN` env var in the workflow, as
`.github/workflows/deploy.yml` already does:
`env: { GITHUB_TOKEN: ${{ secrets.GH_TOKEN }} }`.

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the
site and deploys it to GitHub Pages on every push to `main`.

`astro.config.mjs` reads `ASTRO_BASE`/`ASTRO_SITE` from the environment
(defaulting to root `/` if unset) to support hosting under a subpath —
e.g. GitHub Pages project sites, which serve from
`https://username.github.io/repo-name/` rather than a domain root. If
deploying to a subpath, set both env vars at build time (the included
`.github/workflows/deploy.yml` already does this for GitHub Pages);
deploying at a domain root needs neither.

