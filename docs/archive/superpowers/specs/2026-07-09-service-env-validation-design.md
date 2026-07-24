# Design: Zod environment-variable validation for `@blog/service`

> **Archived — implemented.** See SPEC.md §7. Environment & configuration for current behavior.

Date: 2026-07-09
Status: Approved (design), pending implementation plan

## Problem

The service layer reads environment variables ad-hoc in
`packages/service/src/sanity/client.ts`:

```ts
const projectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');

client = createClient({
  projectId,
  dataset: process.env['NEXT_PUBLIC_SANITY_DATASET'] ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env['NODE_ENV'] === 'production',
  token: process.env['SANITY_API_READ_TOKEN'],
});
```

Only `projectId` is checked. `SANITY_API_READ_TOKEN`, the dataset, and
`NODE_ENV` are read untyped with no validation; a missing or malformed value
fails deep inside a request rather than at startup. There is no single typed
source of truth for the service layer's environment.

`zod` is already present in the dependency tree transitively (via
`groqd@1.7.1`, which depends on `zod@^3.22.4`), so adopting Zod-based
validation adds no new validation library to evaluate.

## Scope

**In scope (now):** validate the environment consumed by the service layer —
the only real env consumer in the runtime today.

**Explicitly deferred:** `apps/web` has _no_ direct env-var consumers at
present (no `metadataBase`/sitemap using `NEXT_PUBLIC_SITE_URL`, and the
`app/api/revalidate` route from the implementation brief is not built). A web
env module is a separate follow-up ticket, to be created when web first reads
an env var.

**Not covered:** `apps/cms` keeps its existing Sanity/Vite-native env loading.
It is not a Next.js app and is out of scope for this change.

## Decisions

| Decision            | Choice                        | Rationale                                                                                                                                                      |
| ------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library             | `@t3-oss/env-core` (+ `zod`)  | Service is framework-agnostic by contract ("no React", "no framework") and server-only. `env-core` fits; `env-nextjs` would couple a non-Next library to Next. |
| Placement           | `packages/service/src/env.ts` | Colocated with the code that consumes it; each package validates exactly what it reads.                                                                        |
| Client/server split | None                          | Service is server-only (holds the read token, imported only by Server Components). All vars are server-side; no `clientPrefix`/`client` block needed.          |
| Read token          | `optional()`                  | Public reads work without it; only drafts/private content require it. Matches current behaviour.                                                               |
| `NODE_ENV`          | `shared`                      | Semantically shared; drives `useCdn`.                                                                                                                          |

## The module

```ts
// packages/service/src/env.ts
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).default('production'),
    SANITY_API_READ_TOKEN: z.string().min(1).optional(),
  },
  shared: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});
```

Notes:

- `emptyStringAsUndefined: true` makes an empty `NEXT_PUBLIC_SANITY_DATASET=`
  fall back to `production` via `.default()`, preserving today's `?? 'production'`
  behaviour.
- The `NEXT_PUBLIC_` names live under `server` (not `client`) because service
  never runs in the browser; no `clientPrefix` is set, so no prefix enforcement
  applies.
- `zod` is pinned to `^3` to match the version `groqd` resolves, avoiding a
  second Zod major inside the service package.

## `client.ts` refactor

Replace the four `process.env['…']` reads and the hand-rolled
`if (!projectId) throw` with typed `env.*` accesses:

```ts
import { env } from '../env';

client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: env.NODE_ENV === 'production',
  token: env.SANITY_API_READ_TOKEN,
});
```

The manual guard is removed: `env-core` produces an aggregated error listing
every missing/invalid variable at once, at import time, instead of failing on
the first one at request time.

## Error handling & validation timing

`env-core` validates **at module import**. Importing `env.ts` (via `client.ts`)
triggers validation, giving fail-fast behaviour at process start.

**Primary risk — CI.** Two CI jobs currently pass without Sanity env vars set,
and import-time validation could break them:

- **`build`** (`pnpm --filter web build`): Next may execute service fetches
  during static generation, importing `env.ts`.
- **`test`** (`pnpm test`): if any service test transitively imports `client.ts`.

Mitigation: the `skipValidation` escape hatch gated on `SKIP_ENV_VALIDATION`.
During implementation planning, verify **how the current CI build tolerates
missing Sanity env today** (are pages dynamic? does the fetch run at build?)
and mirror that behaviour explicitly — either set `SKIP_ENV_VALIDATION=1` on the
affected jobs or provide placeholder env values. This must be confirmed
empirically, not assumed.

## Testing

- New `packages/service/src/env.test.ts` covering:
  - valid environment parses and exposes typed values;
  - missing `NEXT_PUBLIC_SANITY_PROJECT_ID` throws;
  - empty `NEXT_PUBLIC_SANITY_DATASET` falls back to `production`;
  - absent `SANITY_API_READ_TOKEN` yields `undefined`.
  - Tests set/reset `process.env` (and use `skipValidation`/injected values as
    needed) so they are hermetic.
- The existing service suite must stay green — ensure it does not fail on
  import-time validation (via `SKIP_ENV_VALIDATION` in the vitest config or an
  injected test environment).

## Dependencies

- Add `@t3-oss/env-core` and `zod@^3` as **direct** dependencies of
  `packages/service` (Zod is currently only transitive via groqd).

## Layer-contract check

- `service → types` only; `env-core`/`zod` are leaf runtime deps, no new
  cross-layer edges, graph stays acyclic.
- No React introduced into `service`.
- `apps/web` and `@blog/ui` unaffected.

## Follow-ups (separate tickets)

- `apps/web` env module using `@t3-oss/env-nextjs` (with the server/client
  split for `SANITY_REVALIDATE_SECRET` vs `NEXT_PUBLIC_SITE_URL`), created when
  web first consumes an env var.

## Acceptance criteria

- [ ] `packages/service/src/env.ts` exists and is the single typed source of the
      service layer's environment.
- [ ] `client.ts` reads only from `env`, with no direct `process.env` access and
      no hand-rolled guard.
- [ ] Missing/invalid required env fails fast with an aggregated error.
- [ ] `@t3-oss/env-core` and `zod` are direct deps of `packages/service`.
- [ ] `pnpm --filter @blog/service type-check | lint | test` pass; CI `build`
      and `test` jobs remain green (validation-skip or placeholder env applied
      and verified).
