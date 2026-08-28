# @blog/auth

> Shared Auth.js configuration for the two Next.js apps.

Holds the Auth.js (`next-auth` v5) configuration that `apps/web` and
`apps/platform` each pass to their own `NextAuth()` call — providers, the
Drizzle adapter binding, session strategy, and the `session` callback that
puts `user.id` on `session.user`. It exists so both apps share one
configuration rather than maintaining two independently: a difference in
provider setup, session strategy, or the session shape between them would
silently break signing in on one app and staying signed in on the other.

This package handles **authentication** only — establishing who a signed-in
user is. **Authorization** (whether that user may see a given page) is each
app's own decision, made against its own `admins` or `memberships` row; that
logic does not belong here.

## Layer contract

- **Depends on:** `@blog/db` (the adapter tables — `users`, `accounts`,
  `sessions`, `verificationTokens`), `next-auth`, `@auth/drizzle-adapter`
- **Consumed by:** `apps/web`, `apps/platform` — each constructs its own
  `NextAuth()` instance from `buildAuthConfig()` so it keeps its own
  `auth`/`handlers` bound to its own runtime
- **Never imports:** React components, `@blog/ui`, `@blog/service`, or a
  Sanity SDK; and is never imported by `@blog/db` (the tables live in `db`,
  this package reaches for them, not the other way around)

## Layout

- `src/config.ts` — `buildAuthConfig()`, which returns the `NextAuthConfig`:
  the `DrizzleAdapter` bound to `@blog/db`'s adapter tables, the `database`
  session strategy, and the `session` callback
- `src/providers/magic-link/` — the hand-rolled Auth.js Email (magic-link)
  provider; delivery is injected via a `sendEmail` callback so this package
  never depends on an email-sending SDK directly
- `src/types/next-auth.d.ts` — module augmentation that types
  `session.user.id`, kept alongside the `session` callback that actually
  populates it
- `src/utils/env/env.ts` — the `@t3-oss/env-core` schema for this package's
  environment variables (provider credentials optional and
  feature-flag-by-absence; `AUTH_SECRET` required)
- `src/index.ts` — the package's public surface

## Scripts

| Script       | Command                               |
| ------------ | ------------------------------------- |
| `lint`       | `pnpm --filter @blog/auth lint`       |
| `type-check` | `pnpm --filter @blog/auth type-check` |
| `format`     | `pnpm --filter @blog/auth format`     |
| `test`       | `pnpm --filter @blog/auth test`       |
| `test:watch` | `pnpm --filter @blog/auth test:watch` |

Root-level `pnpm type-check` / `pnpm lint` / `pnpm test` run every
workspace, including this one, through Turborepo.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) — §4 has this package's row in the
  workspace map and layer-contract table
- [`../../docs/context/environment-variables.md`](../../docs/context/environment-variables.md) —
  `AUTH_SECRET`, `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`,
  `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `MAGIC_LINK_FROM_ADDRESS`
