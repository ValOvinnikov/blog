# @blog/next-config

> Shared Next.js config preset.

## What it provides

`preset.ts` — `createNextConfig(overrides)`, which wraps the pieces of
`next.config.ts` that are identical across every app: the worktree-safe
Turbopack root, the SVGR Turbopack rule, the non-CSP security headers, and
the `next-intl` plugin wrapping. Each app passes only its own
`transpilePackages`, `images`, `experimental`, and computed
`contentSecurityPolicy`.

## Consumed by

`apps/web`, `apps/platform`.

## Scripts

| Script | Command                                |
| ------ | -------------------------------------- |
| `lint` | `pnpm --filter @blog/next-config lint` |

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
