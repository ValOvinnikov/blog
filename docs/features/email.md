---
title: Email
status: partial
layers: [email, db, auth, web, platform, config]
code:
  - packages/email/src/**
  - packages/db/src/schema/email-config.ts
  - packages/db/src/schema/email-templates.ts
  - packages/db/src/queries/email-config/**
  - packages/db/src/queries/email-templates/**
  - packages/db/src/constants/email-template-defaults.ts
  - packages/config/src/constants/email-template.ts
  - packages/auth/src/providers/magic-link/**
  - apps/web/src/utils/resolve-tenant-email-identity/**
  - apps/web/src/utils/to-tenant-email-brand/**
  - apps/platform/src/components/features/email/**
  - apps/platform/src/server/email/**
  - apps/platform/src/server/email-config/**
  - apps/platform/src/server/email-templates/**
  - apps/platform/src/app/[locale]/dashboard/(tenant)/email/**
  - apps/platform/src/app/[locale]/tenants/[tenantId]/(detail)/email/**
epics: [4083]
---

# Email

## What it does

Every email the product sends is built and sent by `@blog/email`. Tenant-facing mail (sign-in link, team invite, newsletter confirmation) arrives in the tenant's own colours, name and logo, with subject and body copy the owner can rewrite per language. Operator alerts arrive in the platform's fixed look with fixed English copy. Owner onboarding mail — a heads-up that Sanity has emailed a Studio invite, a nudge when it is still unaccepted, and a "your site is ready" message — arrives in the platform's fixed look under the platform's name, with fixed transactional copy the sender passes in. Inactivity mail warns an owner that their site will be paused, and later that it will be deleted, each with a sign-in link to keep it, in the same look and with copy the sender passes in; the super admin gets a separate operator copy of the pause warning, in fixed English, naming the tenant and its owner. When a tenant is deprovisioned, the super admins get a fixed-English operator email naming its archived Sanity project, with a link to delete it in Sanity Manage. The contact-form notification to a site's owner uses the tenant's look with fixed English copy, and is not an editable template. Owners edit their sender details and templates on the platform's Email page, preview them at desktop and mobile width, and send a test to themselves.

## Surfaces and routes

- Platform: **Email** page at `/dashboard/email` (owner) and `/tenants/<id>/email` (operator); the owner page is plan-gated, the operator page is reachable on every plan.
- Senders: the Auth.js magic-link provider in `@blog/auth` (sign-in and invite), `apps/web` newsletter actions (confirmation), `apps/platform` `POST /api/internal/operator-alert` (operator alerts), `apps/worker`'s deprovisioning run (the archived Sanity project email) and the Email page's **Send test to me**.
- No Studio surface.

## Data

- `email_config` (one row per tenant): `logo_asset_url`, `sender_name`, `reply_to_address`, `footer_postal_address`.
- `email_templates` (tenant × template type × language): `subject`, `body` (Portable Text in `jsonb`), both nullable.
- `email_template_logos` (tenant × template type): per-template logo override, the same in every language.
- `EMAIL_TEMPLATE_TYPE`: `MAGIC_LINK`, `TENANT_INVITE`, `NEWSLETTER_CONFIRMATION`. Product default copy per language is `EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE` in `@blog/db`.
- Logos are uploaded to Vercel Blob (PNG, JPEG or GIF, at most 100 KB), each upload under a unique name; a replaced or cleared logo's old blob is deleted best-effort.
- The tenant palette is derived from the tenant's Look (`site_config`) at send time.

## Configuration

- Owners and operators edit, per tenant: sender name, reply-to, postal footer, a tenant logo and per-template logos (all language-independent), and each template's subject and body per language. One draft is saved through the settings save bar; a blank field shows and sends its fallback.
- **Sender name** replaces only the display name of the configured From address (`applyTenantSenderName` in `@blog/auth`); the address itself always stays the platform's verified sender. With no sender name set, a tenant site's sign-in emails show the site's name instead; the platform's own emails (admin sign-in, operator alerts) and the Email page's test send keep the display name in the From env var, e.g. "Valstack".
- Plan gating: applies to the owner's `/dashboard/email` only, which exists only when the plan carries an email-sending capability (see [plans-and-entitlements](./plans-and-entitlements.md)); operators reach `/tenants/<id>/email` on every plan.
- Look reach: brand colours and logo marks follow the tenant's Look ([look](./look.md)). Email copy is not Voice.
- Operator alert copy is fixed and never tenant-editable.
- Owner onboarding copy (subject, preview text, paragraphs, action label and URL) is fixed transactional copy passed by the sender; it is not Voice and not an editable template. Every value is escaped, the action URL sanitised.
- The owner pause warning and deletion notice take their copy from the sender, like owner onboarding mail. The super admin's copy of the pause warning is fixed English held in `@blog/email`; the sender passes the tenant name and id, owner email, a pre-formatted pause date and the sign-in URL. Neither is Voice or an editable template.

## Constraints and invariants

- **Separation is structural** — `buildOperatorShell` takes no brand and always uses `PLATFORM_EMAIL_BRAND`; `buildTenantShell` requires a resolved `TTenantEmailBrand`. Operator templates live in `templates/operator/`, tenant templates in `templates/tenant/`, owner onboarding templates in `templates/owner/`. Sign-in and invite mail picks its shell by sender: the tenant shell when a tenant identity resolves, the platform shell (the stacked logo mark beside the fixed name "Platform", `PLATFORM_EMAIL_BRAND_NAME`) when the builder is told `isSentByPlatform`, and the neutral shell otherwise — a sign-in on an unknown host.
- **Platform shell** — `buildPlatformShell` renders mail the platform sends in its own name in `PLATFORM_EMAIL_BRAND`, taking the brand name but no palette. `buildOperatorShell` is it with the fixed name "Tenant Alerts"; the owner onboarding templates pass the platform's name.
- **Locked action** — the sign-in, accept-invite and confirm links render as an action element outside the authored body, so authored copy cannot remove or replace them. The whole button, padding included, is the link.
- Authored bodies serialise only paragraphs, headings and bullet/number lists, with `strong`, `em` and links; every value goes through the canonical `escapeHtml` and `sanitizeHref`.
- Field resolution per send: recipient's language, then the tenant's default language, then the product default in the recipient's language. Logo: template override, then the tenant logo.
- The newsletter confirmation carries `List-Unsubscribe` and one-click `List-Unsubscribe-Post` headers, and its links carry the subscriber's language.
- Owner and inactivity templates return a plain-text alternative beside the HTML — the same paragraphs, then the action as `label: url` — which `sendEmail` forwards as `text`.
- `sendEmail` strips line breaks from the subject, throws on a malformed reply-to and on any Resend error; a missing `RESEND_API_KEY` throws at send time, not import time.
- Settings lookups for a send degrade to defaults one by one; a failed brand lookup sends with the product default palette rather than not at all.
- `@blog/email` never logs, never resolves tenants and never fetches content; callers pass resolved copy, brand and URLs. It depends only on `@blog/utils`.
- **Send test to me** goes to the signed-in user from the platform's operator sender address, at most five sends per user per ten minutes per server instance.

## Dependencies

- Layers: `email`, `db`, `auth`, `web`, `platform`, `config`.
- Features: [reader-auth](./reader-auth.md), [platform-sign-in-and-onboarding](./platform-sign-in-and-onboarding.md), [tenant-access](./tenant-access.md), [newsletter](./newsletter.md), [operator-alerts](./operator-alerts.md), [look](./look.md), [languages](./languages.md), [plans-and-entitlements](./plans-and-entitlements.md).
- Env vars: `RESEND_API_KEY`, `MAGIC_LINK_FROM_ADDRESS`, `NEWSLETTER_FROM_ADDRESS`, `OPERATOR_ALERT_FROM_ADDRESS` (each From falls back to a `resend.dev` address, which Resend delivers only to the account owner, so every one must be set to a verified domain on each project that sends it — `docs/DEPLOY.md`), `OPERATOR_ALERT_SECRET`, `BLOB_READ_WRITE_TOKEN` (platform, logo uploads).

## Entry points

- `packages/email/src/transport/send-email.ts`
- `packages/email/src/html/tenant-shell/tenant-shell.ts`, `platform-shell/platform-shell.ts`, `operator-shell/operator-shell.ts`, `neutral-shell/neutral-shell.ts`, `email-layout/email-layout.ts`, `email-action/email-action.ts`
- `packages/email/src/templates/tenant/**`, `packages/email/src/templates/operator/**`, `packages/email/src/templates/owner/**`
- `packages/email/src/portable-text/serialize-portable-text.ts`
- `packages/auth/src/providers/magic-link/magic-link-provider/magic-link-provider.ts`, `resolve-magic-link-email-settings/resolve-magic-link-email-settings.ts`
- `apps/web/src/server/newsletter/newsletter-actions/newsletter-actions.ts`, `apps/web/src/utils/resolve-tenant-email-identity/resolve-tenant-email-identity.ts`
- `apps/platform/src/components/features/email/email-settings/email-settings.tsx`, `apps/platform/src/server/email/send-test-email-action.ts`

## Tests and stories

- Email: a `*.test.ts` beside every shell, template, serializer, validator and the transport; `client-safe-entrypoints.test.ts` guards that the `html`, `templates/tenant` and `validation` entrypoints stay importable in client code.
- Auth: tests under `packages/auth/src/providers/magic-link/**`.
- Platform: tests beside each `features/email/**` component and `server/email*/**` action.
- No stories.

## Related

- #4083 — newsletter sending and per-tenant email limits (epic).
- #5642 — inactivity warning and deletion notice emails (epic #4840).
- #4957 — owner onboarding emails: invite heads-up, nudge and site ready.
- #3669 — contact form owner notification template.
- #4958 — magic-link send limits and terms acceptance on first sign-in.
- #4999 — the tenant email brand reads the theme ramps.
