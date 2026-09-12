/**
 * Build-time-only GitHub repository data for index-tier Projects whose
 * outboundLink is kind: github (Project Details Dialog spec). Fetched once
 * per build via GitHub's public REST API — never at request/client time, so
 * shipping this data costs zero client JS.
 *
 * Resilience contract: unauthenticated GitHub REST calls are rate-limited
 * to 60 req/h, which
 * comfortably covers this site's handful of index-tier repos, but a build
 * must never fail because GitHub is unreachable or rate-limited — non-
 * essential display data should never be load-bearing. Every failure mode
 * here (network error, non-2xx, malformed URL) resolves to a missing map
 * entry rather than a thrown error; callers render without the live-data
 * block.
 *
 * Dev-mode cache: npm run dev never produces dist/, so there's no built
 * output to read cached data from. A simple JSON file at .cache/
 * github-data.json avoids repeated network calls during local iteration.
 * - Production builds always fetch live and write the cache as a side
 *   effect — the deployed site never reads from or depends on the cache.
 * - Dev mode reads the cache first. On cache hit: instant return, zero
 *   network. On cache miss (first-ever dev run): fetch once, write cache,
 *   subsequent reloads are instant. Cache miss fetch failures degrade
 *   gracefully to an empty map, same as production fetch failures.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface GithubRepoData {
  stars: number;
  language: string | null;
  description: string | null;
  pushedAt: string;
}

const CACHE_DIR = '.cache';
const CACHE_FILE = 'github-data.json';

function getCachePath(): string {
  return join(process.cwd(), CACHE_DIR, CACHE_FILE);
}

function readCache(): Map<string, GithubRepoData> | null {
  try {
    const raw = readFileSync(getCachePath(), 'utf-8');
    const obj = JSON.parse(raw) as Record<string, GithubRepoData>;
    return new Map(Object.entries(obj));
  } catch {
    return null;
  }
}

function writeCache(map: Map<string, GithubRepoData>): void {
  try {
    const dir = join(process.cwd(), CACHE_DIR);
    mkdirSync(dir, { recursive: true });
    const obj: Record<string, GithubRepoData> = {};
    for (const [k, v] of map) obj[k] = v;
    writeFileSync(getCachePath(), JSON.stringify(obj, null, 2));
  } catch {
    // Cache write failure is non-fatal — next dev run will re-fetch.
  }
}

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== 'github.com' && hostname !== 'www.github.com') return null;
    const [owner, repo] = pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, '') };
  } catch {
    return null;
  }
}

async function fetchGithubRepoData(url: string): Promise<GithubRepoData | null> {
  const parsed = parseGithubUrl(url);
  if (!parsed) return null;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'workspace-build',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  // Optional — raises the unauthenticated 60 req/h limit when set, never
  // required for the build to succeed.
  const token = import.meta.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      headers,
    });
    if (!response.ok) return null;

    const data = await response.json();
    return {
      stars: data.stargazers_count ?? 0,
      language: data.language ?? null,
      description: data.description ?? null,
      pushedAt: data.pushed_at,
    };
  } catch {
    // Network failure, DNS failure, timeout, GitHub outage — all fall
    // through to "no live data," never a failed build.
    return null;
  }
}

async function fetchAll(projects: { id: string; url: string }[]): Promise<Map<string, GithubRepoData>> {
  const results = await Promise.all(
    projects.map(async ({ id, url }) => [id, await fetchGithubRepoData(url)] as const),
  );

  const map = new Map<string, GithubRepoData>();
  for (const [id, data] of results) {
    if (data) map.set(id, data);
  }
  return map;
}

/**
 * Fetches GitHub data for a set of projects in parallel, keyed by project
 * id. A project whose fetch fails (or whose outboundLink isn't a GitHub
 * URL) is simply absent from the returned map — callers check for presence,
 * they never see an error.
 */
export async function fetchGithubDataForProjects(
  projects: { id: string; url: string }[],
): Promise<Map<string, GithubRepoData>> {
  if (import.meta.env.DEV) {
    // Dev mode: read cache first. On hit, zero network — instant return.
    // On miss (first-ever dev run), fetch once, write cache for subsequent
    // reloads. Fetch failure degrades to empty map, same as production.
    const cached = readCache();
    if (cached) return cached;

    const map = await fetchAll(projects);
    writeCache(map);
    return map;
  }

  // Production: always fetch live. Write cache as a dev convenience so the
  // next `npm run dev` session starts with warm data.
  const map = await fetchAll(projects);
  writeCache(map);
  return map;
}
