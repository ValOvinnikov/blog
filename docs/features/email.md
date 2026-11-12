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
  - packages/db/src/queries/email-usage/**
  - packages/db/src/schema/email-usage.ts
  - packages/db/src/constants/email-usage.ts
  - packages/db/src/constants/email-config.ts
  - packages/config/src/constants/email-type.ts
  - packages/db/src/constants/email-template-defaults.ts
  - packages/config/src/constants/email-template.ts
  - packages/auth/src/providers/magic-link/**
  - apps/web/src/app/api/email-delivery-events/**
  - apps/web/src/server/email-usage/**
  - apps/web/src/constants/email-usage.ts
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

Every email the product sends is built and sent by `@blog/email`. Tenant-facing mail (sign-in link, team invite, newsletter confirmation) arrives in the tenant's own colours, name and logo, with subject and body copy the owner can rewrite per language. Operator alerts arrive in the platform's fixed look with fixed English copy. Owner onboarding mail — a heads-up that Sanity has emailed a Studio invite, a nudge when it is still unaccepted, and a "your site is ready" message — arrives in the platform's fixed look under the platform's name, with fixed transactional copy the sender passes in. Inactivity mail warns an owner that their site will be paused, and later that it will be deleted, each with a sign-in link to keep it, in the same look and with copy the sender passes in; the super admin gets a separate operator copy of the pause warning, in fixed English, naming the tenant and its owner. When a tenant is deprovisioned, the super admins get a fixed-English operator email naming its archived Sanity project, with a link to delete it in Sanity Manage. The contact-form notification to a site's owner uses the tenant's look with fixed English copy, and is not an editable template. A post sent to subscribers arrives in the tenant's look with the post's title, its cover image and takeaways when it has them, its excerpt and a **Read the post** button; the action label and the "You are receiving this because you subscribed to …" footer line are fixed English email copy, not Voice. Owners edit their sender details and templates on the platform's Email page, preview them at desktop and mobile width, and send a test to themselves.

## Surfaces and routes

- Platform: **Email** page at `/dashboard/email` (owner) and `/tenants/<id>/email` (operator); the owner page is plan-gated, the operator page is reachable on every plan.
- Senders: the Auth.js magic-link provider in `@blog/auth` (sign-in and invite), `apps/web` newsletter actions (confirmation), `apps/platform` `POST /api/internal/operator-alert` (operator alerts), `apps/worker`'s deprovisioning run (the archived Sanity project email) and the Email page's **Send test to me**.
- Webhook: `POST /api/email-delivery-events` on `apps/web` receives Resend's delivered, bounced and complained events.
- No Studio surface.

## Data

- `email_config` (one row per tenant): `logo_asset_url`, `sender_name`, `reply_to_address`, `footer_postal_address`, `email_new_posts` (on by default; a tenant with no row reads it as on through `getEmailNewPosts`).
- `email_send_counts` (tenant × UTC day × `EMAIL_TYPE`): `count`, one upsert per email sent through `queries.emailUsage.recordEmailSend`. The reader sign-in (`@blog/auth`, a site's own host only) and the newsletter confirmation (`apps/web`) each record one after the send succeeds. `EMAIL_TYPE` (`@blog/config`): `SIGN_IN`, `NEWSLETTER_CONFIRMATION`, `NEWSLETTER_ISSUE`. `countEmailSendsThisMonth` sums one type since the first of the UTC month.
- `email_delivery_outcome_counts` (tenant × UTC day × `EMAIL_DELIVERY_OUTCOME`): `count`, one upsert per new delivery event through `recordEmailDeliveryOutcome(eventId, tenantId, outcome)`.
- `email_delivery_events` (one row per Resend event id): `tenant_id`, `received_at`. `recordEmailDeliveryOutcome` stores the id and adds to the count in one statement, and does neither when the id is already stored, so a retried event is counted once; it returns whether it counted, or `DB_NOT_FOUND` for a tenant that does not exist. `EMAIL_DELIVERY_OUTCOME` (`@blog/db`): `DELIVERED`, `BOUNCED`, `COMPLAINED`. `getEmailReputation` reads the last 7 UTC days (`EMAIL_REPUTATION_WINDOW_DAYS`, today included): `resolvedCount` is delivered plus bounced, and the bounce and complaint rates are taken against it (0 when it is 0). Neither count table holds platform-bucket mail (operator and tenant-admin sign-ins, invites, alerts).
- `email_templates` (tenant × template type × language): `subject`, `body` (Portable Text in `jsonb`), both nullable.
- `email_template_logos` (tenant × template type): per-template logo override, the same in every language.
- `EMAIL_TEMPLATE_TYPE`: `MAGIC_LINK`, `TENANT_INVITE`, `NEWSLETTER_CONFIRMATION`. Product default copy per language is `EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE` in `@blog/db`.
- Logos are uploaded to Vercel Blob (PNG, JPEG or GIF, at most 100 KB), each upload under a unique name; a replaced or cleared logo's old blob is deleted best-effort.
- The tenant palette is derived from the tenant's Look (`site_config`) at send time.

## Configuration

- Owners and operators edit, per tenant: sender name, reply-to, postal footer, a tenant logo and per-template logos (all language-independent), and each template's subject and body per language, picking the language from the same language radio group as Voice (shown only with more than one live language). One draft is saved through the settings save bar; a blank field shows and sends its fallback.
- **Sender name** replaces only the display name of the configured From address (`applyTenantSenderName` in `@blog/auth`); the address itself always stays the platform's verified sender. The name is written as a quoted string (`"` and `\` escaped; line breaks and angle brackets stripped), so a comma, quote or `@` in it cannot alter the address. With no sender name set, or one of only spaces, a tenant site's sign-in emails show the site's name instead; the platform's own emails (admin sign-in, operator alerts) and the Email page's test send keep the display name in the From env var, e.g. "Valstack".
- Plan gating: applies to the owner's `/dashboard/email` only, which exists only when the plan carries an email-sending capability (see [plans-and-entitlements](./plans-and-entitlements.md)); operators reach `/tenants/<id>/email` on every plan.
- Look reach: brand colours and logo marks follow the tenant's Look ([look](./look.md)). Email copy is not Voice.
- Operator alert copy is fixed and never tenant-editable.
- Owner onboarding copy (subject, preview text, paragraphs, action label and URL) is fixed transactional copy passed by the sender; it is not Voice and not an editable template. Every value is escaped, the action URL sanitised.
- The owner payment receipt (`buildOwnerReceiptEmail`) is owner mail on the platform shell: the sender passes the copy, the amount, date and plan as pre-formatted `details` rows (rendered as a label-and-value table and as `label: value` lines in the plain text, a line break inside a label or value becoming a space; an empty list renders nothing), and the invoice PDF link as its action. Any owner email may carry `details`; none is Voice or an editable template.
- The owner pause warning and deletion notice take their copy from the sender, like owner onboarding mail. The super admin's copy of the pause warning is fixed English held in `@blog/email`; the sender passes the tenant name and id, owner email, a pre-formatted pause date and the sign-in URL. Neither is Voice or an editable template.

## Constraints and invariants

- **Separation is structural** — `buildOperatorShell` takes no brand and always uses `PLATFORM_EMAIL_BRAND`; `buildTenantShell` requires a resolved `TTenantEmailBrand`. Operator templates live in `templates/operator/`, tenant templates in `templates/tenant/`, owner onboarding templates in `templates/owner/`. Sign-in and invite mail picks its shell by sender: the tenant shell when a tenant identity resolves, the platform shell (the stacked logo mark beside the fixed name "Platform", `PLATFORM_EMAIL_BRAND_NAME`) when the builder is told `isSentByPlatform`, and the neutral shell otherwise — a sign-in on an unknown host.
- **Platform shell** — `buildPlatformShell` renders mail the platform sends in its own name in `PLATFORM_EMAIL_BRAND`, taking the brand name but no palette. `buildOperatorShell` is it with the fixed name "Tenant Alerts"; the owner onboarding templates pass the platform's name.
- **Locked action** — the sign-in, accept-invite and confirm links render as an action element outside the authored body, so authored copy cannot remove or replace them. The whole button, padding included, is the link.
- Authored bodies serialise only paragraphs, headings and bullet/number lists, with `strong`, `em` and links; every value goes through the canonical `escapeHtml` and `sanitizeHref`.
- Field resolution per send: recipient's language, then the tenant's default language, then the product default in the recipient's language. Logo: template override, then the tenant logo.
- The newsletter confirmation and the post email carry `List-Unsubscribe` and one-click `List-Unsubscribe-Post` headers (`buildListUnsubscribeHeaders`; an unsubscribe URL that is not `https`, which RFC 8058 one-click requires, sends neither header) and the same Unsubscribe link (`buildUnsubscribeAction`); the confirmation's links carry the subscriber's language.
- The post email's title, excerpt and takeaways are escaped and shown as text; a cover image URL that is not `http(s)` is dropped. Its subject and URLs come resolved from the caller.
- Owner, inactivity and post templates return a plain-text alternative beside the HTML — the same paragraphs, then the action as `label: url` — which `sendEmail` forwards as `text`.
- **Counting never costs a send** — a send count is written after the send, and a failed count never fails the sign-in or the confirmation. `@blog/auth`, which never logs, hands a failed sign-in count to the app's `onSendCountFailed` handler (beside `onSendRefused` in the handlers `buildAuthConfig` takes); `apps/web` logs it, and its own failed confirmation count, as `email_usage.send_count_failed`.
- **Delivery webhook** — the route verifies Resend's signature (`svix-id`, `svix-timestamp`, `svix-signature`, checked with `standardwebhooks` against `RESEND_WEBHOOK_SECRET`) before reading anything; an invalid one is refused with 401 and logged, and writes nothing. A verified delivered, bounced or complained event is counted against the site in its `site` tag, keyed by the `svix-id` event id. An event with no site tag (platform mail) is acknowledged with 200, unrecorded and unlogged; a site tag that is not a site id is acknowledged with 200 and warned once as `email_usage.webhook_site_tag_invalid`; an event of an expected type in an unexpected shape is acknowledged and warned once (`email_usage.webhook_event_malformed`); an event naming a site this database does not hold (a deleted one) is acknowledged and warned once (`email_usage.webhook_site_unknown`) — `recordEmailDeliveryOutcome` returns `DB_NOT_FOUND` on the foreign-key violation; any other event type is acknowledged and ignored; any other failed write answers 500 so Resend retries. Without the secret the route answers 500.
- `sendEmail` forwards `tags` so a delivery event can be traced to the site that sent it; `buildSiteEmailTag(siteId)` builds the site tag under `SITE_EMAIL_TAG_NAME`. Callers must pass names and values of ASCII letters, digits, `_` and `-`, at most 256 characters; Resend rejects anything else, so `sendEmail` throws. It strips line breaks from the subject, throws on a malformed reply-to and on any Resend error; a missing key throws at send time, not import time.
- **Two Resend accounts** — every `sendEmail` call names its account. `EMAIL_ACCOUNT.PLATFORM` (`RESEND_PLATFORM_API_KEY`) carries owner and operator sign-in and invites, operator alerts, owner emails and the Email page's test send; `EMAIL_ACCOUNT.TENANT` (`RESEND_TENANT_API_KEY`) carries reader sign-in, newsletter confirmations, contact-form lead emails and the post email. `@blog/auth`'s magic-link send picks the account from the app it runs in. A missing key fails only its own account's sends. `isEmailAccountConfigured(account)` reports whether an account's key is set; the platform's tenants list uses it for the "email alerts not configured" banner. On dev both keys point at one account; in production at two, so a pause caused by one site's list never stops owners signing in.
- Settings lookups for a send degrade to defaults one by one; a failed brand lookup sends with the product default palette rather than not at all.
- `@blog/email` never logs, never resolves tenants and never fetches content; callers pass resolved copy, brand and URLs. It depends only on `@blog/utils`.
- **Send test to me** goes to the signed-in user from the platform's operator sender address, at most five sends per user per ten minutes per server instance.

## Dependencies

- Layers: `email`, `db`, `auth`, `web`, `platform`, `config`.
- Features: [reader-auth](./reader-auth.md), [platform-sign-in-and-onboarding](./platform-sign-in-and-onboarding.md), [tenant-access](./tenant-access.md), [newsletter](./newsletter.md), [operator-alerts](./operator-alerts.md), [look](./look.md), [languages](./languages.md), [plans-and-entitlements](./plans-and-entitlements.md).
- Env vars: `RESEND_WEBHOOK_SECRET` (web; the signing secret of the Resend webhook pointed at `/api/email-delivery-events`), `RESEND_PLATFORM_API_KEY` (platform, worker), `RESEND_TENANT_API_KEY` (web), `MAGIC_LINK_FROM_ADDRESS`, `NEWSLETTER_FROM_ADDRESS`, `OPERATOR_ALERT_FROM_ADDRESS` (each From falls back to a `resend.dev` address, which Resend delivers only to the account owner, so every one must be set to a verified domain on each project that sends it — `docs/DEPLOY.md`), `OPERATOR_ALERT_SECRET`, `BLOB_READ_WRITE_TOKEN` (platform, logo uploads).

## Entry points

- `packages/email/src/transport/send-email.ts`
- `packages/email/src/html/tenant-shell/tenant-shell.ts`, `platform-shell/platform-shell.ts`, `operator-shell/operator-shell.ts`, `neutral-shell/neutral-shell.ts`, `email-layout/email-layout.ts`, `email-action/email-action.ts`
- `packages/email/src/templates/tenant/**`, `packages/email/src/templates/operator/**`, `packages/email/src/templates/owner/**`
- `packages/email/src/portable-text/serialize-portable-text.ts`
- `packages/auth/src/providers/magic-link/magic-link-provider/magic-link-provider.ts`, `resolve-magic-link-email-settings/resolve-magic-link-email-settings.ts`
- `apps/web/src/app/api/email-delivery-events/route.ts`
- `apps/web/src/server/newsletter/newsletter-actions/newsletter-actions.ts`, `apps/web/src/utils/resolve-tenant-email-identity/resolve-tenant-email-identity.ts`
- `apps/platform/src/components/features/email/email-settings/email-settings.tsx`, `apps/platform/src/server/email/send-test-email-action.ts`

## Tests and stories

- Email: a `*.test.ts` beside every shell, template, serializer, validator and the transport; `client-safe-entrypoints.test.ts` guards that the `html`, `templates/tenant` and `validation` entrypoints stay importable in client code.
- Auth: tests under `packages/auth/src/providers/magic-link/**`.
- Web: `app/api/email-delivery-events/route.test.ts` signs real webhook requests; the newsletter confirmation's tag and count are covered in `newsletter-confirmation-send.test.ts`.
- Platform: tests beside each `features/email/**` component and `server/email*/**` action.
- No stories.

## Related

- #4083 — newsletter sending and per-tenant email limits (epic).
- #5642 — inactivity warning and deletion notice emails (epic #4840).
- #4957 — owner onboarding emails: invite heads-up, nudge and site ready.
- #3669 — contact form owner notification template.
- #4958 — magic-link send limits and terms acceptance on first sign-in.
- #4999 — the tenant email brand reads the theme ramps.
