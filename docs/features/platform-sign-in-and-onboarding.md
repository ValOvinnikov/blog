---
title: Platform sign-in and onboarding
status: partial
layers: [platform, auth, db, email, config, worker]
code:
  - apps/platform/src/app/api/auth/**
  - apps/platform/src/app/*/workspace-pending/**
  - apps/platform/src/app/*/sign-in-error/**
  - apps/platform/src/components/features/layout/workspace-pending-view/**
  - apps/platform/src/components/features/layout/sign-out-button/**
  - apps/platform/src/server/auth/auth.ts
  - apps/platform/src/server/auth/require-session-user-id.ts
  - apps/platform/src/server/auth/resolve-home-href*
  - apps/platform/src/server/auth/sign-out-action*
epics: [4840, 4960, 4979, 4982, 4958, 4949]
---

# Platform sign-in and onboarding

## What it does

How a person gets into `apps/platform` and, once signed in, into a workspace.
Today the platform has no sign-in page of its own and no way to create a site
without an operator. The decided shape is one branded `/sign-in` for every
platform user, a `/signup` gate for prospects, and an `/onboarding` wizard
that creates a Free site.

## Surfaces and routes

Today:

- `adminRoutes.signIn()` is `/api/auth/signin`, Auth.js's default, unbranded
  page. Every gate without a session redirects there with no `callbackUrl`,
  so a fresh sign-in returns to `/`. `/` sits in the `requireAdmin`-gated
  `(operator)` group: an admin is redirected to `/tenants`, a non-admin gets a
  404 there, whose link sends them to `/dashboard`.
- Providers come from `@blog/auth`: GitHub and Google when their credentials
  are set, and the email magic link always.
- `/sign-in-error`: Auth.js's `pages.error`, public and in the panel's own
  styling. A `Verification` error (a magic link already used or expired) says
  so and links to sign-in for a new link; any other error gets a plain message
  and a link back to sign-in.
- `/workspace-pending`: a session-gated dead end for a signed-in user with no
  membership, with "Try again" (to `/dashboard`) and "Sign out".
- Sign-out (account menu, or the button on pre-shell pages) runs
  `signOutAction` and returns to the sign-in page.

Decided:

- `/sign-in`: one page for operators, owners and invited editors, handling
  Auth.js errors such as `OAuthAccountNotLinked` with its own message.
- `/signup`: a gate in front of the same providers (Vercel BotID, terms and
  privacy acceptance), not a second login.
- `/onboarding`: site type, name, slug with a live availability check,
  language, preset and accent with the site preview, then **Create site**.

## Data

- Today: the Auth.js tables in Neon (`users`, `accounts`, `sessions`,
  `verification_tokens`) with the `database` session strategy. On sign-in,
  pending `membership_invites` for the email become `memberships`.
- Decided: Create site runs one transaction (tenant `PENDING` with
  `site_type`, OWNER membership, `tenant_domains` row for `<slug>.<domain>`,
  `site_config`, `settings_features`, audit event) and enqueues the worker.
  `termsAcceptedAt` and `termsVersion` are stored on acceptance.

## Configuration

- Operator access is decided by an `admins` row after sign-in, never by a
  separate sign-in. The first admin is granted by hand with
  `pnpm --filter @blog/db db:seed-admin`.
- Decided: v1 offers the FREE plan only, one Free tenant per user. Wizard,
  card and email copy is fixed platform copy, not [Voice](./voice.md).

## Constraints and invariants

- Today `resolveHomeHref` only picks a dead end's link: `/tenants` for an
  admin, `/dashboard` for anyone else. `/dashboard` with no membership
  redirects to `/workspace-pending`.
- Decided: after sign-in, `resolveHomeHref` routes by role (operators to
  `/tenants`, members to `/dashboard`, no membership to `/onboarding`), and
  invited users with a membership never see the wizard.
- Decided: the Sanity project is created at Create site, never at signup.
- Today the admin builds Auth.js with `AUTH_APP.PLATFORM`: its cookies carry
  their own names, each session it creates is stamped `PLATFORM` in
  `sessions.app`, and a session stamped otherwise reads as signed out. Invite
  side effects run only here: the invite-consuming sign-in event and the
  invite email template.

## Dependencies

- `@blog/auth`, `@blog/db`, `@blog/email` (magic-link and invite mail).
- Features: [reader-auth](./reader-auth.md),
  [tenant-access](./tenant-access.md),
  [tenant-provisioning](./tenant-provisioning.md),
  [platform-shell](./platform-shell.md),
  [plans-and-entitlements](./plans-and-entitlements.md),
  [public-front-door](./public-front-door.md).
- Env: `AUTH_SECRET`, `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`,
  `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `RESEND_API_KEY`,
  `MAGIC_LINK_FROM_ADDRESS`.

## Entry points

- `apps/platform/src/server/auth/auth.ts` (the platform's `NextAuth()` call)
- `apps/platform/src/server/auth/require-session-user-id.ts`
- `apps/platform/src/server/auth/resolve-home-href.ts`
- `apps/platform/src/app/[locale]/workspace-pending/page.tsx`
- `apps/platform/src/app/[locale]/sign-in-error/page.tsx`
- `packages/auth/src/config.ts`

## Tests and stories

- `apps/platform/src/server/auth/resolve-home-href.test.ts`,
  `sign-out-action.test.ts`, `sign-in-error/page.test.tsx`, and the view
  tests beside
  `workspace-pending-view` and `sign-out-button`.
- No Storybook in `apps/platform`.

## Related

- #4840 epic: platform front door (Order 6b is the design of record).
- #4960 shared `/sign-in`, `/signup`, `/onboarding` and self-serve tenant
  creation.
- #4979 epic: web and platform stay separate; #4982 the admin keeps its own
  sign-in and refuses sessions it did not issue.
- #4958 magic-link send limits and terms acceptance on first sign-in.
- #4949 reserved subdomains and a slug availability check.
