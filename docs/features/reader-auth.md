---
title: Reader sign-in
status: built
layers: [auth, db, email, web]
code:
  - packages/auth/src/**
  - packages/db/src/schema/auth.ts
  - apps/web/src/server/auth/**
  - apps/web/src/app/api/auth/**
  - apps/web/src/components/shared/auth-menu/**
  - apps/web/src/hooks/use-oauth-error-param/**
  - packages/email/src/templates/tenant/magic-link-email/**
  - packages/email/src/templates/tenant/magic-link-invite-email/**
epics: [4979, 4958, 4083, 5459]
---

# Reader sign-in

## What it does

A reader signs in to a public site from a popover in the header, with GitHub, Google or an emailed magic link. The session is a database session stored in Neon, and the identity behind it is one `users` row per email address, shared by every tenant site and by the platform. The magic-link email carries the tenant's brand, its authored copy and sender settings, in the reader's language.

## Surfaces and routes

- **Header** — `AuthMenu` renders only when the site has a reader account (see [reader-account](./reader-account.md)). Signed out, it is a round "Sign in" pill with a person glyph from `lg`, and a 44px person circle below it, opening the sign-in panel; signed in, the avatar sits in a round frame matching the other header controls and opens the account menu (My bookmarks, Account settings, Sign out). Pages are statically rendered, so the slot is sized before first paint from a `signed_in_hint` cookie: a non-HttpOnly, non-secret flag the client writes with the session's expiry once the session resolves signed in, and clears when it resolves signed out or the reader signs out or deletes their account. A pre-hydration `<head>` script (the theme script's pattern) marks `<html data-signed-in>` when the hint is present, and while the session loads the slot shows the empty outline of the hinted control — the avatar frame, or the "Sign in" pill from `lg` (the 44px frame below it) — with only the "loading account status" announcement. The real `useSession()` result still decides what renders; a wrong hint costs at most one shift. The resolved control fades in over `duration-fast` (opacity only, none under reduced motion). The phone menu's account row opens the same panel.
- **Sign-in panel** — a 320px popover from `lg`; below it, a sheet anchored to the header (gutter to gutter, 8px under the header, scrolling inside the viewport), as is the account panel and the OAuth error notice. One button per configured OAuth provider, then "Continue with email", which expands into an email field and a "check your inbox" state.
- `/api/auth/*` — the Auth.js handlers (`GET`/`POST`).
- There is no `/login` page. A failed OAuth callback redirects to `/` with `?error=`; `useOAuthErrorParam` reads it, strips it from the URL and the popover shows an inline error.
- The platform builds its own `NextAuth()` from the same `buildAuthConfig` (see [platform-sign-in-and-onboarding](./platform-sign-in-and-onboarding.md)).

## Data

- Neon (Auth.js Drizzle adapter tables, column names fixed by the adapter): `users` (`id`, `name` and `nameEncrypted`, `email` unique, `emailEncrypted` and `emailIndex`, `emailVerified`, `image`, `termsAcceptedAt`, `termsVersion`), `accounts` (PK `provider` + `providerAccountId`, cascade on user delete), `sessions` (`sessionToken` — the SHA-256 hex of the session cookie, `userId`, `expires`, `app`), `verification_tokens` (the magic-link token).
- No tenant column on any of them: a reader is global, and tenant scoping happens in the rows that reference `users` (bookmarks, memberships).
- Magic-link copy comes from `email_templates` (`MAGIC_LINK` on a site, always — a pending membership invite never changes a site's email; the platform uses `TENANT_INVITE` for an invited address) and sender settings from `email_config`. Only subject and body fall back to `EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE`; sender name, reply-to, logo and postal footer stay unset when not configured, and the from address is `MAGIC_LINK_FROM_ADDRESS`, else Resend's testing sender.
- Nothing is cached; every session read is a database lookup.

## Configuration

- **Operator (env)** — an OAuth provider is registered only when both its id and secret are set; the header advertises exactly the registered set (`getEnabledOAuthProviderIds`). The magic-link provider is always registered.
- **Owner (platform Email page)** — the magic-link and invite email subject, body, logo, sender name, reply-to and footer postal address (see [email](./email.md)).
- **Plan / capability** — no capability of its own. The sign-in entry point exists only while bookmarks, comments or newsletter is enabled, so a `FREE` site shows no sign-in.
- **Look** — the email brand follows the tenant's preset, accent and logo hue (`resolveTenantEmailBrand`). Popover copy is fixed (`authMenu.*`), not Voice.

## Constraints and invariants

- Session strategy is `database`; the `session` callback returns only the user (`id`, `name`, `email`, `image`) and `expires` — `user.id` is what every authorization lookup keys on, and the session row's `sessionToken`, `userId` and `app` never reach `/api/auth/session`.
- An `accounts` row never holds the provider's `access_token`, `refresh_token` or `id_token`: nothing calls Google or GitHub on a user's behalf, so the adapter drops them before the row is written. The columns stay because the adapter expects them.
- A `sessions` row never holds the session cookie's value: the adapter stores and looks a session up by the SHA-256 hex of the cookie token, and only the cookie carries the raw token.
- A user's email and name are read only from their encrypted forms (`emailEncrypted`, `nameEncrypted`), decrypted with `PERSONAL_DATA_ENCRYPTION_KEY`, and a user is looked up by email through `emailIndex`, `accountEmailIndex`'s keyed HMAC of the exact address (trimmed and lower-cased, `+tag` kept) under `PERSONAL_DATA_INDEX_KEY`. A lookup also checks the decrypted email equals the requested address, ignoring case, so `name+tag@domain` never opens the account of `name@domain` by magic link or OAuth linking. Every user write fills the encrypted forms beside the plain `email` and `name`, which are still written until they are dropped. Sign-in therefore needs both keys set, and a user row written before the backfill reads as an error until the backfill fills it.
- Each session row records the app that issued it (`sessions.app`). Each app reads the other's session as no session: the platform names its cookies apart, and a site stamps its sessions `SITE` and keeps Auth.js's default cookie names.
- The magic-link send never fails on a lookup: tenant identity, invite lookup and template/settings reads each degrade to neutral or default copy. A malformed stored reply-to is dropped.
- The tenant is resolved from the magic-link URL's host. The email's language is the first segment of the `callbackUrl` path, matched only against the tenant's live locales, else the default locale; with no tenant behind the host it is the invited tenant's locale, else English.
- A site registers no `events.signIn`: a reader's sign-in leaves pending membership invites pending, for the next admin sign-in to consume.
- `@blog/auth` never logs; `db` must never import it.
- Magic-link sends are limited per client IP (20) and per email (10) in a one-hour fixed window, counted in Neon's `magic_link_send_counters` under SHA-256 keys, so no raw email or IP is stored. The IP is counted first, and a request over its IP limit never spends the address's sends, so a single IP cannot lock an owner out. A refused send delivers nothing and shows the same check-your-inbox page as a real one. The limits are constants in `is-magic-link-send-allowed.ts`, and they apply to both apps.

## Dependencies

- Layers: `auth` (config, providers), `db` (adapter tables, invites, email settings), `email` (templates, Resend transport), `config` (locales, template types), `web`.
- Features: [reader-account](./reader-account.md), [bookmarks](./bookmarks.md), [email](./email.md), [tenant-access](./tenant-access.md) (invites), [languages](./languages.md), [plans-and-entitlements](./plans-and-entitlements.md).
- Env: `AUTH_SECRET` (required), `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `MAGIC_LINK_FROM_ADDRESS` (falls back to Resend's testing sender), `RESEND_API_KEY`, `DATABASE_URL`.

## Entry points

- `packages/auth/src/config.ts` — `buildAuthConfig`
- `packages/auth/src/providers/magic-link/magic-link-provider/magic-link-provider.ts`
- `packages/auth/src/utils/oauth-providers/oauth-providers.ts`
- `packages/auth/src/events/consume-pending-invites-on-sign-in.ts`
- `apps/web/src/server/auth/auth.ts` — lazy `NextAuth()`, `pages.error: '/'`
- `apps/web/src/components/shared/auth-menu/auth-menu.tsx`
- `apps/web/src/components/shared/auth-menu/hooks/use-email-sign-in.ts`
- `apps/web/src/components/shared/site-header/site-header.tsx`

## Tests and stories

- `packages/auth/src/**/*.test.ts` (config, providers, env, invite consumption).
- `apps/web/src/components/shared/auth-menu/**/*.test.tsx`, `use-oauth-error-param.test.ts`.
- `packages/email/src/templates/tenant/magic-link-*/**/*.test.ts`.
- No story of its own; the header appears in `site-navigation.stories.tsx`.

## Related

- #4979 — epic: web and platform stay separate. Per-app session cookies and session rows, the shared cookie domain retired, invites consumed only on the platform (#4982, #4983, #4986).
- #4958 — magic-link send limits per email and IP, and terms acceptance on first sign-in.
- #4083 — epic: per-tenant email usage tracking and a separate Resend account for tenant mail.
