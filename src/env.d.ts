/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Optional: raises GitHub's unauthenticated 60 req/h REST rate limit when
  // present. Never required — src/lib/githubData.ts degrades to
  // unauthenticated requests without it.
  readonly GITHUB_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
