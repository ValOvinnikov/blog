# @blog/tailwind-config

> Shared Tailwind CSS v4 design tokens.

## What it provides

- `theme.css` — the only source of Tailwind theme tokens and global base
  styling, imported via `@import '@blog/tailwind-config/theme.css'`.
  Consumers add only local `@source` scanning directives on top; new tokens
  are added here, not duplicated per workspace.
- `preset.ts` — a legacy Tailwind v3 preset entrypoint kept for consumers
  that still expect a JS config object. No current consumer imports it; new
  tokens go in `theme.css`.

## Consumed by

`packages/ui` (`index.css`, and parsed at build time by
`src/lib/design-tokens/token-registry.ts`), `apps/web` (`index.css`), and
`apps/platform` (`index.css`).

## Scripts

| Script | Command                                    |
| ------ | ------------------------------------------ |
| `lint` | `pnpm --filter @blog/tailwind-config lint` |

## Further reading

- [`../../SPEC.md`](../../SPEC.md) §4 — workspace map & layer contracts.
