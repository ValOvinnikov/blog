# @blog/utils

> Framework-free, dependency-free pure helper functions.

This is the one package every other workspace may depend on with zero
coupling risk: no React, no Next.js, no Sanity, no workspace dependencies at
all — only `culori` for OKLCH color math. Helpers are grouped by concern,
each pure and independently testable, so any layer can pull in exactly the
logic it needs without inheriting framework baggage.

## Layer contract

- **Depends on:** `culori` only (no workspace dependencies).
- **Consumed by:** `@blog/ui`, `@blog/service`, `@blog/db`, `apps/web`, `apps/cms`, `apps/admin`.
- **Never imports:** React, Next.js, Sanity, or any sibling workspace.

## Layout

- `async/` — `safeAsync`, a result-wrapping helper for async calls (`TResult<T>`).
- `color/` — `oklchToHex`, `wcagContrastRatio`, `WCAG_AA_CONTRAST_MIN`.
- `encryption/` — `encryptSecret` / `decryptSecret`.
- `log/` — `sanitizeLogMessage`.
- `merge/` — `deepMergePartial`, `TDeepPartial<T>`.
- `pagination/` — `toTotalPages`.
- `primitives/` — `objectKeys`, `toTitleCase`.
- `reading-time/` — `toReadingTimeMinutes`.

Each directory re-exports through its own `index.ts` and gets its own
`package.json` `exports` subpath (`@blog/utils/async`, `@blog/utils/color`,
…) alongside the root barrel (`.`, `src/index.ts`) that re-exports all of
them.

## Scripts

| Script       | Command                                |
| ------------ | -------------------------------------- |
| `lint`       | `pnpm --filter @blog/utils lint`       |
| `type-check` | `pnpm --filter @blog/utils type-check` |
| `format`     | `pnpm --filter @blog/utils format`     |
| `test`       | `pnpm --filter @blog/utils test`       |
| `test:watch` | `pnpm --filter @blog/utils test:watch` |

Root-level `pnpm type-check` / `pnpm lint` / `pnpm test` run every
workspace's equivalent script through Turborepo, this one included.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
- [`../../docs/context/frontend-conventions.md`](../../docs/context/frontend-conventions.md) — dependency rules, type flow, per-workspace alias wiring.
