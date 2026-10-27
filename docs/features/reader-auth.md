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

- **Header** — `AuthMenu` renders only when the site has a reader account (see [reader-account](./reader-account.md)). Its look follows three Look settings on `site_config` (`getAccountControl`): the account button (Pill with label, the default, or Circle), the account panel (Card, the default, Profile or Hub) and where the account sits on phones (In the bar, the default, or In the menu). From `lg` the bar shows the chosen button — the pill holds one width signed in and signed out, a person glyph and "Sign in" or the avatar and "Account" — and any panel opens from either button. Below `lg`, In the bar shows a 44px circle that opens the panel as a sheet under the bar; In the menu shows no account control in the bar, and the phone menu ends with an account row ("Sign in" or "Account") that opens the same panel in place, like a sub-menu, without closing the menu. Signed in, the panel shows the reader's name, or their handle when they have none, and their email, then My bookmarks, Account settings and a neutral Sign out; Hub lays the two links out as tiles with one fixed line each. The settings are read as stored on every plan until the Look plan fallback lands. Pages are statically rendered, so while the session loads the slot shows the empty outline of the chosen button with only the "loading account status" announcement; the client still writes the `signed_in_hint` cookie (a non-HttpOnly, non-secret flag carrying the session's expiry), which a pre-hydration `<head>` script turns into `<html data-signed-in>`. The real `useSession()` result decides what renders. The resolved control fades in over `duration-fast` (opacity only, none under reduced motion).
- **Sign-in panel** — a 320px dialog from `lg`; below it, a sheet anchored to the header (gutter to gutter, 8px under the header, scrolling inside the viewport), as is the account panel and the OAuth error notice. One button per configured OAuth provider, "or", then the email field and "Email me a sign-in link", all visible at once. A pressed provider row says where it is taking the reader while the others wait; the send button shows "Sending…" while busy; a sent link replaces the whole form with "Check your inbox", the address and "Use a different email"; a failed send shows the error under the field.
- `/api/auth/*` — the Auth.js handlers (`GET`/`POST`).
- There is no `/login` page. A failed OAuth callback redirects to `/` with `?error=`; `useOAuthErrorParam` reads it, strips it from the URL and the header shows an alert beside the account control.
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
- **Look** — the account button, account panel and phone placement (Growth-only on the Look page) shape the header control; the email brand follows the tenant's preset, accent and logo hue (`resolveTenantEmailBrand`). Panel copy is fixed (`authMenu.*`), not Voice, including Hub's two tile lines.

## Constraints and invariants

- Session strategy is `database`; the `session` callback returns only the user (`id`, `name`, `email`, `image`) and `expires` — `user.id` is what every authorization lookup keys on, and the session row's `sessionToken`, `userId` and `app` never reach `/api/auth/session`.
- An `accounts` row never holds the provider's `access_token`, `refresh_token` or `id_token`: nothing calls Google or GitHub on a user's behalf, so the adapter drops them before the row is written. The columns stay because the adapter expects them.
- A `sessions` row never holds the session cookie's value: the adapter stores and looks a session up by the SHA-256 hex of the cookie token, and only the cookie carries the raw token.
- A user's email and name are read from their encrypted forms (`emailEncrypted`, `nameEncrypted`), decrypted with `PERSONAL_DATA_ENCRYPTION_KEY`, and a user is looked up by email (`findUserByEmail`) through `emailIndex`, `accountEmailIndex`'s keyed HMAC of the exact address (trimmed and lower-cased, `+tag` kept) under `PERSONAL_DATA_INDEX_KEY`. A lookup also checks the decrypted email equals the requested address, ignoring case, so `name+tag@domain` never opens the account of `name@domain` by magic link or OAuth linking. Every user write fills the encrypted forms beside the plain `email` and `name`, which are still written until they are dropped; with the encryption key unset a write fills only the plain forms.
- Until the plain columns are dropped (#5666), every read falls back to them: a user row with no encrypted form, or any row while `PERSONAL_DATA_ENCRYPTION_KEY` is unset, is read from the plain `email` and `name`, and an email lookup that the index does not answer — no match, or `PERSONAL_DATA_INDEX_KEY` unset — retries on the plain `email`, ignoring case. So a user written before the backfill signs in and keeps their session, and an environment missing a key still signs users in. Each fallback is reported through `@blog/db`'s `onPersonalDataFallback`, and each app's `instrumentation.ts` logs it once as `personal_data.plain_fallback` (warn) with the owner and reason, never the address. The user handed back to Auth.js carries only `id`, `email`, `name`, `emailVerified` and `image` — never an encrypted or index column.
- Each session row records the app that issued it (`sessions.app`). Each app reads the other's session as no session: the platform names its cookies apart, and a site stamps its sessions `SITE` and keeps Auth.js's default cookie names.
- The magic-link send never fails on a lookup: tenant identity, invite lookup and template/settings reads each degrade to neutral or default copy. A malformed stored reply-to is dropped.
- The tenant is resolved from the magic-link URL's host. The email's language is the first segment of the `callbackUrl` path, matched only against the tenant's live locales, else the default locale; with no tenant behind the host it is the invited tenant's locale, else English.
- A site registers no `events.signIn`: a reader's sign-in leaves pending membership invites pending, for the next admin sign-in to consume.
- `@blog/auth` never logs; `db` must never import it.
- Magic-link sends are limited per client IP (20) and per email (10) in a one-hour fixed window, counted in Neon's `magic_link_send_counters` under SHA-256 keys, so no raw email or IP is stored. The IP is counted first, and a request over its IP limit never spends the address's sends, so a single IP cannot lock an owner out. A refused send delivers nothing. A blocked address or a failed check shows the same check-your-inbox page as a real send, so a block is never confirmed; a send over either limit throws `MagicLinkSendLimitedError`, which a client `signIn('email')` reads as `code` `MAGIC_LINK_SIGN_IN_CODE.SEND_LIMITED`, and the popover shows `authMenu.sendLimited` ("Too many sign-in links were requested for this address. Try again in an hour.", fixed site copy) in place of its generic send error. `findMagicLinkSendRefusal` names why it refused (`MAGIC_LINK_REFUSAL`: blocked, network limit, address limit, check failed), and each app logs that as one `auth.sign_in_link_refused` warn line carrying the reason, plus the error's name and Postgres code for a failed check — never its message, which can embed a counter key, and never the email, the IP or a hash of either. The limits are constants in `find-magic-link-send-refusal.ts`, and they apply to both apps.

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
- `apps/web/src/components/shared/auth-menu/components/account-menu-group/account-menu-group.tsx` — the phone menu's account row
- `apps/web/src/components/shared/auth-menu/hooks/use-sign-in-attempt.ts`
- `apps/web/src/server/site-config/get-account-control/get-account-control.ts`
- `apps/web/src/components/shared/site-header/site-header.tsx`

## Tests and stories

- `packages/auth/src/**/*.test.ts` (config, providers, env, invite consumption).
- `apps/web/src/components/shared/auth-menu/**/*.test.tsx`, `site-header.test.tsx`, `get-account-control.test.ts`, `use-oauth-error-param.test.ts`.
- `packages/email/src/templates/tenant/magic-link-*/**/*.test.ts`.
- The `@blog/ui` stories `AccountTrigger`, `AccountPanel` and `SignInPanel` draw every variant and state; the composed header appears in `site-navigation.stories.tsx`, including the account in the phone menu.

## Related

- #4979 — epic: web and platform stay separate. Per-app session cookies and session rows, the shared cookie domain retired, invites consumed only on the platform (#4982, #4983, #4986).
- #4958 — magic-link send limits per email and IP, and terms acceptance on first sign-in.
- #4083 — epic: per-tenant email usage tracking and a separate Resend account for tenant mail.
