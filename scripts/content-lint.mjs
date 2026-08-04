#!/usr/bin/env node
// Structural content validation, beyond what Zod frontmatter schemas can
// check (they validate one entry's frontmatter; these rules span an
// entry's MDX body, or span multiple entries in a collection).
//
// Keep this a validation step, not a framework: plain line-scanning over
// MDX bodies, no markdown AST dependency.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

// `.pathname` alone yields a malformed path on Windows (a leading slash
// before the drive letter, e.g. "/d:/..."), which silently fails every
// statSync/readdirSync call below without erroring — content-lint would
// report "OK" having never actually read a single file. fileURLToPath
// handles the platform-specific conversion correctly.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = join(ROOT, 'src/content');

const MANDATORY_NARRATIVE_SECTIONS = ['Problem', 'Approach', 'Outcome'];
const OPTIONAL_NARRATIVE_SECTIONS = [
  'Tradeoffs',
  'Architecture',
  'Alternatives Considered',
  'Lessons Learned',
];

/** @type {string[]} */
const errors = [];

function listContentFiles(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })) return [];
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name))
    .map((entry) => join(entry.parentPath ?? dir, entry.name));
}

/** Extracts level-2 (##) heading text, ignoring lines inside fenced code blocks. */
function extractH2Headings(body) {
  const headings = [];
  let inFence = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) headings.push(match[1]);
  }
  return headings;
}

/** Slices the body between a given ## heading and the next ## heading (or EOF). */
function sectionBody(body, heading) {
  const lines = body.split('\n');
  const startIndex = lines.findIndex((line) => line.match(/^##\s+(.+?)\s*$/)?.[1] === heading);
  if (startIndex === -1) return null;
  const rest = lines.slice(startIndex + 1);
  const nextIndex = rest.findIndex((line) => /^##\s+/.test(line));
  return (nextIndex === -1 ? rest : rest.slice(0, nextIndex)).join('\n');
}

/** Loose heuristic: a diagram is a markdown image, an <img> tag, or a fenced code block. */
function containsDiagram(sectionText) {
  if (!sectionText) return false;
  return (
    /!\[.*?\]\(.*?\)/.test(sectionText) ||
    /<img\s/i.test(sectionText) ||
    /<ArchitectureDiagram\b/.test(sectionText) ||
    /^\s*(```|~~~)/m.test(sectionText)
  );
}

function lintNarrativeProject(file, frontmatter, body) {
  const headings = extractH2Headings(body);

  for (const required of MANDATORY_NARRATIVE_SECTIONS) {
    if (!headings.includes(required)) {
      errors.push(`${file}: narrative missing mandatory section "## ${required}".`);
    }
  }

  for (const heading of headings) {
    const isKnown =
      MANDATORY_NARRATIVE_SECTIONS.includes(heading) ||
      OPTIONAL_NARRATIVE_SECTIONS.includes(heading);
    if (!isKnown) {
      errors.push(
        `${file}: unknown top-level section "## ${heading}" — not in the mandatory set or the closed optional list (${OPTIONAL_NARRATIVE_SECTIONS.join(', ')}).`,
      );
    }
  }

  if (frontmatter.architectureDiagramRequired) {
    const waived =
      typeof frontmatter.architectureDiagramWaived === 'string' &&
      frontmatter.architectureDiagramWaived.trim().length > 0;

    // A waiver suppresses the Architecture-section promotion requirement
    // itself (Project Narrative Spec: Architecture Diagram Requirement) —
    // closed-source client work can meet the criteria with nothing
    // shareable to diagram. The section may still exist (honesty about the
    // withholding), just without a diagram inside it.
    if (!waived) {
      if (!headings.includes('Architecture')) {
        errors.push(
          `${file}: architectureDiagramRequired is true but "## Architecture" section is missing (set architectureDiagramWaived if there's a reason to withhold the diagram).`,
        );
      } else if (!containsDiagram(sectionBody(body, 'Architecture'))) {
        errors.push(
          `${file}: "## Architecture" section has no detectable diagram (image, <img>, or fenced code block).`,
        );
      }
    }
  }
}

function lintProjects() {
  const dir = join(CONTENT_DIR, 'projects');
  for (const file of listContentFiles(dir)) {
    const raw = readFileSync(file, 'utf-8');
    const { data: frontmatter, content: body } = matter(raw);
    const relPath = relative(ROOT, file);
    if (frontmatter.tier === 'narrative') {
      lintNarrativeProject(relPath, frontmatter, body);
    }
  }
}

/** Generic singleton-collection check: a collection directory must contain at most one entry. */
function lintSingleton(name, dir) {
  const files = listContentFiles(dir);
  if (files.length > 1) {
    errors.push(
      `${name}: singleton collection has ${files.length} entries (max 1). Files: ${files.map((f) => relative(ROOT, f)).join(', ')}`,
    );
  }
}

lintProjects();
// Hub Surface Definition: Cardinality — Framing Statement, singleton pattern.
lintSingleton('framing', join(CONTENT_DIR, 'framing'));

if (errors.length > 0) {
  console.error(`content-lint: ${errors.length} violation(s) found:\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('content-lint: OK');
