---
title: Platform sign-in and onboarding
status: partial
layers: [platform, auth, db, email, config, worker]
code:
  - apps/platform/src/app/api/auth/**
  - apps/platform/src/app/*/workspace-pending/**
  - apps/platform/src/app/*/sign-in-error/**
  - apps/platform/src/app/*/sign-in/**
  - apps/platform/src/app/*/signup/**
  - apps/platform/src/components/features/sign-up/**
  - apps/platform/src/server/auth/accept-signup-terms-action*
  - apps/platform/src/utils/legal-page-urls/**
  - apps/platform/src/instrumentation-client.ts
  - apps/platform/src/components/features/sign-in/**
  - apps/platform/src/server/auth/send-sign-in-link-action*
  - apps/platform/src/server/auth/sign-in-with-provider-action*
  - apps/platform/src/utils/safe-callback-path/**
  - apps/platform/src/utils/sign-in-error/**
  - apps/platform/src/components/features/layout/workspace-pending-view/**
  - apps/platform/src/components/features/layout/sign-out-button/**
  - apps/platform/src/server/auth/auth.ts
  - apps/platform/src/server/auth/require-session-user-id.ts
  - apps/platform/src/server/auth/resolve-home-href*
  - apps/platform/src/server/auth/sign-out-action*
  - apps/platform/src/app/*/page.tsx
  - apps/platform/src/proxy.ts
  - apps/platform/src/utils/requested-path/**
  - apps/platform/src/server/create-site-gate/**
  - apps/platform/src/server/rate-limit/**
epics: [4840, 4960, 4979, 4982, 4958, 4949, 5649]
---

# Platform sign-in and onboarding

## What it does

How a person gets into `apps/platform` and, once signed in, into a workspace.
Today every platform user, operator, owner or invited editor, signs in on one
branded `/sign-in` page, and a prospect passes a `/signup` gate first; there
is still no way to create a site without an operator. The decided shape adds
an `/onboarding` wizard that creates a Free site.

## Surfaces and routes

Today:

- `/sign-in` is Auth.js's `pages.signIn`, public and in the panel's own
  pre-shell styling: a button per configured OAuth provider, then an email
  field that sends a magic link and says to check your inbox on the same page.
  `adminRoutes.signIn(callbackUrl)` builds it, always with an explicit
  `callbackUrl` (`/` by default). A session gate passes the page the visitor
  asked for, which `src/proxy.ts` records in the `x-admin-requested-path`
  request header; a sign-in therefore lands on that page, by email link,
  GitHub or Google alike. `toSafeCallbackPath` keeps only a same-origin path,
  so a crafted `callbackUrl` falls back to `/`. Auth.js's own
  `/api/auth/signin` redirects here.
- Auth.js sends a sign-in failure back to `/sign-in?error=…`.
  `OAuthAccountNotLinked` (the email already signs in with another provider)
  gets its own message; any other error a general one.
- `/` redirects by `resolveHomeHref`: an admin to `/tenants`, anyone else to
  `/dashboard`, a signed-out visitor to sign-in.
- A signed-in user opening `/sign-in` is sent on to its `callbackUrl`.
- Providers come from `@blog/auth`: GitHub and Google when their credentials
  are set, and the email magic link always.
- `/sign-in-error`: Auth.js's `pages.error`, public and in the panel's own
  styling. A `Verification` error (a magic link already used or expired) says
  so and links to sign-in for a new link; any other error gets a plain message
  and a link back to sign-in.
- `/workspace-pending`: a session-gated dead end for a signed-in user with no
  membership, with "Try again" (to `/dashboard`) and "Sign out".
- `/signup`: a public gate in front of the same providers, not a second
  login. The visitor ticks acceptance of the Terms of Service and the Privacy
  Policy, linked at `https://<TENANT_ROOT_DOMAIN>/terms` and `/privacy`
  (`routes.terms()` and `routes.privacy()` in `@blog/config`; the marketing
  site serves them), or named as plain text without a root domain. Continue
  runs `acceptSignupTermsAction`: Vercel BotID with Deep Analysis, then the
  `SIGNUP_TERMS_COOKIE_NAME` cookie set to `TERMS_VERSION` for two days, then
  `/sign-in` with a `callbackUrl` of `/`. A bot, or a failed check, gets a
  neutral "try again later" and no cookie; a failed check is logged. A
  signed-in visitor is sent to `/`. `/sign-in` links to it ("New here?").
- Sign-out (account menu, or the button on pre-shell pages) runs
  `signOutAction` and returns to the sign-in page, whose next sign-in lands on
  `/`.

Decided:

- `/onboarding`: site type, name, slug with a live availability check,
  language, preset and accent with the site preview, then **Create site**.

## Data

- Today: the Auth.js tables in Neon (`users`, `accounts`, `sessions`,
  `verification_tokens`) with the `database` session strategy. On sign-in,
  pending `membership_invites` for the email become `memberships`.
- Today, built ahead of Create site: `@blog/db`'s `createSelfServeTenant`
  writes a FREE tenant (status ACTIVE, provisioning PENDING, `site_type`),
  the OWNER membership, the `tenant_domains` row for `<slug>.<domain>`,
  `site_config` with the chosen preset and accent hue, `settings_features`
  and a `CREATED` / `TENANT` audit event with the owner as actor. `neon-http`
  has no transactions, so a failed dependent write deletes the tenant row and
  its FK cascades sweep the rest. It refuses an invalid domain or address, a
  taken domain (`DB_DUPLICATE_DOMAIN`, including a concurrent submit of the
  same slug) and a person who already owns a Free tenant
  (`DB_ALREADY_OWNS_FREE_TENANT`). Decided: Create site calls it after
  `admitCreateSite`, then enqueues the worker.
- One Free tenant per person: `ownsFreeTenant(email)` is the pre-check. It
  strips the `+tag` (`normalizeEmailIdentity`) and matches a FREE,
  non-archived tenant whose `self_serve_owner_email_index` is that address's
  index — exactly what the database guard below compares, so the two never
  disagree for a self-served site — or which an OWNER membership ties to the
  account at the stripped address (operator-created Free sites). Accepted
  gap: an operator-created Free site owned by `name+1@…` does not block
  `name+2@…`. An archived tenant frees the slot; suspended and failed ones
  keep it, and an unaccepted OWNER invite doesn't count. The database
  enforces it too: `createSelfServeTenant` stores the `+tag`-free hash in
  `tenants.self_serve_owner_email_index`, under a partial unique index over
  FREE, non-archived rows, so two simultaneous submits can't both succeed.
  Operator-created tenants leave it null. The index guards every write, not
  only Create site: reactivating an archived self-serve tenant
  (`reactivateTenant`, `DB_ALREADY_OWNS_FREE_TENANT`) or an operator setting
  one back to FREE (`updateTenantDetails`, shown in the tenant details form as
  a refusal alert, with no audit event) is refused while its owner holds
  another.
- Today: a new user's first platform sign-in records `users.termsAcceptedAt`
  and `termsVersion` when the request carries the `SIGNUP_TERMS_COOKIE_NAME`
  cookie with the current `TERMS_VERSION` (both in `@blog/config`). Existing
  users are never stamped, and a recorded acceptance is never overwritten.
  `/signup` sets that cookie. Decided: a magic link opened in another browser
  has no cookie, so `/onboarding` asks for acceptance again.

## Configuration

- Operator access is decided by an `admins` row after sign-in, never by a
  separate sign-in. The first admin is granted by hand with
  `pnpm --filter @blog/db db:seed-admin`.
- Decided: v1 offers the FREE plan only, one Free tenant per user. Wizard,
  card and email copy is fixed platform copy, not [Voice](./voice.md).
- Today, built ahead of Create site: `takeCreateSiteSlot(clientKey)` allows
  at most `MAX_SITES_PER_IP_PER_DAY` (3) creates per IP and
  `MAX_SELF_SERVE_SITES_PER_DAY` (50) in total per UTC day, counted in Upstash
  Redis. The first refusal past the total cap emails every super admin once
  that day. `admitCreateSite({ clientKey, email })` wraps it: an email that
  `isSignupBlocked` matches is refused first and takes no slot, and a failed
  lookup refuses too. Create site (#4960) calls `admitCreateSite` before
  enqueuing anything and answers every refusal with the same neutral "try
  again later" message, so the blocklist can't be probed.
- Today: `@blog/db`'s `normalizeSignupEmail` lower-cases an address and drops
  any `+tag`, so `name+1@…` and `name+2@…` resolve to one person. #4960's
  one-site-per-user lookup compares addresses in that form.

## Constraints and invariants

- Today `@blog/auth`'s `isMagicLinkSendAllowed` refuses a magic-link send to
  an address or domain on `@blog/db`'s signup blocklist (`isSignupBlocked`),
  then past the per-IP and per-address hourly limits. The per-address count
  keys on `normalizeEmailIdentity`, so `+tag` variants share one budget. A
  refusal, or a failed check, sends nothing and never throws, and every
  request, refused or sent, takes at least `MAGIC_LINK_RESPONSE_FLOOR_MS`, so
  the check-your-inbox page cannot be told apart by content or timing.
- Today `resolveHomeHref` picks a dead end's link and `/`'s redirect: `/tenants` for an
  admin, `/dashboard` for anyone else. `/dashboard` with no membership
  redirects to `/workspace-pending`.
- Decided: after sign-in, `resolveHomeHref` routes by role (operators to
  `/tenants`, members to `/dashboard`, no membership to `/onboarding`), and
  invited users with a membership never see the wizard.
- Decided: the Sanity project is created at Create site, never at signup.
- Today the admin builds Auth.js with `AUTH_APP.PLATFORM`: its cookies carry
  their own names, each session it creates is stamped `PLATFORM` in
  `sessions.app`, and a session stamped otherwise reads as signed out. Invite
  side effects run only here: the invite-consuming and terms-recording
  sign-in events and the invite email template.
- Today the admin's sign-in and invite emails render in the platform layout
  (the stacked logo mark and "Platform" in the top band). A site's sign-in
  email keeps its tenant's layout, or the neutral one on an unknown host.

## Dependencies

- `@blog/auth`, `@blog/db`, `@blog/email` (magic-link and invite mail).
- Features: [reader-auth](./reader-auth.md),
  [tenant-access](./tenant-access.md),
  [tenant-provisioning](./tenant-provisioning.md),
  [platform-shell](./platform-shell.md),
  [plans-and-entitlements](./plans-and-entitlements.md),
  [public-front-door](./public-front-door.md).
- Vercel BotID (`botid`: `withBotId` in `next.config.ts`, `initBotId` in
  `src/instrumentation-client.ts` protecting POSTs to `/signup`; `src/proxy.ts`
  skips its challenge path). No env var of its own; Deep Analysis is billed
  per check.
- Env: `AUTH_SECRET`, `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`,
  `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `RESEND_API_KEY`,
  `MAGIC_LINK_FROM_ADDRESS`, `KV_REST_API_URL`/`KV_REST_API_TOKEN` (the
  Create site gate's counts), `OPERATOR_ALERT_FROM_ADDRESS`.

## Entry points

- `apps/platform/src/server/auth/auth.ts` (the platform's `NextAuth()` call)
- `apps/platform/src/server/auth/require-session-user-id.ts`
- `apps/platform/src/server/auth/resolve-home-href.ts`
- `apps/platform/src/app/[locale]/sign-in/page.tsx`
- `apps/platform/src/app/[locale]/signup/page.tsx`
- `apps/platform/src/server/auth/accept-signup-terms-action.ts`
- `apps/platform/src/app/[locale]/workspace-pending/page.tsx`
- `apps/platform/src/app/[locale]/sign-in-error/page.tsx`
- `packages/auth/src/config.ts`
- `packages/auth/src/events/record-signup-terms-on-sign-in.ts`
- `apps/platform/src/server/create-site-gate/create-site-gate.ts`
- `packages/db/src/queries/tenants/create-self-serve-tenant/create-self-serve-tenant.ts`
- `packages/db/src/queries/tenants/owns-free-tenant/owns-free-tenant.ts`

## Tests and stories

- `apps/platform/src/server/auth/resolve-home-href.test.ts`,
  `sign-out-action.test.ts`, `send-sign-in-link-action.test.ts`,
  `sign-in-with-provider-action.test.ts`, `sign-in/page.test.tsx`,
  `sign-in-error/page.test.tsx`, `signup/page.test.tsx`,
  `accept-signup-terms-action.test.ts`, `legal-page-urls.test.ts`,
  `safe-callback-path.test.ts`, and the view tests beside `sign-up-view`,
  `sign-in-view`, `email-sign-in-form`,
  `workspace-pending-view` and `sign-out-button`.
- `create-site-gate.test.ts`, `alert-self-serve-limit.test.ts` and the
  `server/rate-limit/` store tests.
- No Storybook in `apps/platform`.

## Related

- #4840 epic: platform front door (Order 6b is the design of record).
- #4960 shared `/sign-in`, `/signup`, `/onboarding` and self-serve tenant
  creation.
- #4979 epic: web and platform stay separate; #4982 the admin keeps its own
  sign-in and refuses sessions it did not issue.
- #4958 magic-link send limits and terms acceptance on first sign-in.
- #4949 reserved subdomains and a slug availability check.
- #5648 the Create site gate: per-IP and total daily limits, `+tag` addresses.
- #5649 epic: the signup blocklist; #5651 the magic-link send refuses it.
