# Tenant Email — Separation, Branding & Authored Copy — Design

**Status:** Design pass, approved in brainstorming 2026-09-03. Supersedes the
per-consumer migration scope of epic #2605's sub-issues #2607–#2611, which were
written against the assumption that `@blog/email`'s shell was correct as
scaffolded. It is not — see §1. Builds on
[`2026-08-13-tenant-config-postgres-admin-design.md`](./2026-08-13-tenant-config-postgres-admin-design.md)
for where tenant configuration lives.

**Date:** 2026-09-03

**Scope:** Make every email this product sends carry the right identity — the
tenant's for tenant-facing mail, the platform's for operator mail — and let a
tenant author the subject and body of their own transactional email. Also
removes email-sending from `@blog/db` entirely.

Out of scope: tenant-authored operator alerts (deliberately impossible, §1),
localisation of email copy beyond what the existing voice ladder provides,
marketing/campaign email, and any change to `sendEmail`'s Resend transport.

## Why this exists

PR #2619 created `@blog/email` as the single home for email and migrated
nothing. Reviewing what it built against the multi-tenant product surfaced two
problems that the scaffold cannot grow into, and one boundary that was drawn in
the wrong place.

**The shell has exactly one identity, baked in at module load.**
`packages/email/src/html/brand-tokens.ts` exports `emailBrandTokens` as a
module-level `as const`, and `src/html/email-shell.ts:1` imports it directly.
Every colour — surface, border, text, `brandPrimary`, the three logo stops — is
computed once from `configs/tailwind/theme.css`'s light-mode `:root` values with
hue `250` hardcoded. `buildEmailShell` accepts `brandName` as a string but has
no way to accept a palette. So a tenant's newsletter confirmation, the platform's
operator alerts, and every tenant's sign-in mail all render in the same colours.

That is not a missing feature; it is the wrong shape. Migrating #2607–#2609's
callers onto that signature would encode it three more times.

**No tenant email copy exists, anywhere.** All copy is hardcoded in the
builders (`buildNewsletterConfirmationEmail`, `buildMagicLinkEmail`,
`buildInviteMagicLinkEmail`) and inline in `@blog/db`'s scripts. The
`voiceOverrides` `jsonb` column on `site_config` is present but unused, and is
not a fit for this: it is a voice ladder for site copy, not a per-template
subject and body.

**`@blog/db` sends email.** `packages/db/package.json:37` depends on `resend`,
and `scripts/validate-tenant-documents/lib/notify-operators.ts:41-84` plus
`scripts/recheck-tenant-owners/lib/notify-operators.ts:63-100` each construct a
`Resend` client and carry their own private `escapeHtml`. A relational
data-access layer should not own an outbound email transport, and #2619 was
about to formalise that by adding `@blog/email` to `db`'s dependencies rather
than removing the capability.

## §1 — Separation is a type error, not a folder convention

The requirement is that platform/operator mail and tenant-facing mail never mix
identities. A directory split documents that intent; it does not enforce it.
Two distinct shell builders do:

```ts
buildOperatorShell({ previewText, bodyHtml }): string;
buildTenantShell({ brand, brandName, previewText, bodyHtml }): string;
```

`buildOperatorShell` takes **no** brand parameter — platform tokens are internal
to it. `buildTenantShell` **requires** a resolved `brand`. An operator alert
therefore cannot render in a tenant's colours (there is no argument to pass),
and a tenant email cannot silently fall back to the platform look (omitting the
brand fails to compile).

Templates split accordingly:

```
packages/email/src/templates/operator/   ← fixed copy, fixed palette, English
packages/email/src/templates/tenant/     ← authored copy, resolved palette
```

`.claude/agents/email.md` already states that operator copy must never become
tenant-editable and asks for that to be enforced structurally rather than by
comment. This extends the same rule to styling and makes both mechanical.

`emailBrandTokens` is replaced by:

- `PLATFORM_EMAIL_BRAND` — today's values, frozen, consumed only by
  `buildOperatorShell`.
- `resolveTenantEmailBrand({ preset, accentHue, logoHue })` — see §2.

## §2 — Tenant brand resolution is arithmetic, not a new system

Theming in this repo is **hue-based**, which makes this far cheaper than it
would otherwise be. `packages/db/src/schema/site-config.ts:50-74` stores
`accentHue` and `logoHue` as integers (0–360); `PRESET_REGISTRY` in
`packages/config/src/constants/preset.ts:10-103` holds recipes whose lightness
and chroma are fixed, with hue substituted per tenant —
`oklch(0.53 0.17 <hue>)` for `brand-primary` in light mode. `apps/web` applies
this at render time by injecting a `<style>` block
(`apps/web/src/utils/build-theme-style-block/build-theme-style-block.ts:64-79`,
injected at `apps/web/src/app/layout.tsx:59-63`).

Email cannot use CSS custom properties, so `resolveTenantEmailBrand` runs the
same recipes through `oklchToHex` (already a `@blog/utils` export, already used
by the current `brand-tokens.ts`) and returns literal hex. Email always renders
the **light** palette — inbox dark-mode handling is out of scope and is not
reliably controllable across clients.

**The one structural change this forces.** The WCAG AA contrast guard lives at
`apps/web/src/utils/to-theme-tokens/to-theme-tokens.ts:29-67`, inside the web
app. A tenant hue that fails contrast on the site fails it in an inbox too, and
duplicating the guard would let the two drift. It moves down to `@blog/config`
alongside `PRESET_REGISTRY`, and `apps/web` imports it from there.

This is the only part of this design that touches an existing rendering path,
and it must land before anything consumes it — it is a `config`-layer change
with an `apps/web` follow-through, and it is the reason the dispatch order in
§9 starts where it does.

## §3 — Tenant email settings

Four things email needs that `site_config` has nowhere to store:

| Field                 | Why it cannot be inherited                                             |
| --------------------- | ---------------------------------------------------------------------- |
| Email logo URL        | `logoAssetUrl` is the site logo, commonly tuned for a dark site header |
| Sender name           | The display name on the From address; unrelated to site title          |
| Reply-to address      | Support routing; no site equivalent                                    |
| Footer postal address | A legal requirement for bulk mail, with no site analogue               |

These are configuration, not content, so they live in Postgres beside the
existing Look settings and are edited in the platform panel next to
`LookForm` (`apps/platform/src/components/features/look/look-form/look-form.tsx`),
following `update-look-action.ts:54-81`'s shape: validate, upsert, record an
audit event, revalidate.

Whether these become columns on `site_config` or a separate `email_config`
table is an implementation call for the `db` layer, made when the migration is
written. Either needs a generated Drizzle migration and the human-gated apply.

### §3.1 — Logos resolve per template, not per tenant

Each template additionally carries **its own optional logo**, uploaded against
that template. The resolution ladder mirrors the voice ladder already used for
copy:

```
product default  ←  tenant email logo (above)  ←  per-template logo
```

A template with no logo of its own falls back rather than rendering nothing, so
introducing a template type later cannot produce a logoless email.

**The upload transport is reused; the validation is not.** `apps/platform`
already has a complete brand-asset pipeline —
`src/server/site-config/upload-brand-asset-action.ts:29-120` takes `FormData`
with a `File`, validates it, `put()`s it to Vercel Blob at
`tenants/{tenant.id}/{kind}.{extension}` with `access: 'public'`, and persists
the returned URL; `src/components/features/look/brand-asset-field/brand-asset-field.tsx:153-161`
is the file input, uploading immediately on selection rather than staging behind
a save. That transport is exactly right here, and `access: 'public'` already
satisfies email's hardest constraint (below).

What cannot be reused is
`src/server/site-config/validate-brand-asset.ts:98-163` and its limits in
`src/utils/brand-asset-limits/brand-asset-limits.ts:6-37`. Those are correct for
a website logo and wrong for email on every axis:

| Check      | Site logo today          | Email logo needs | Why                                                                                          |
| ---------- | ------------------------ | ---------------- | -------------------------------------------------------------------------------------------- |
| Formats    | PNG, JPEG, WebP, **SVG** | PNG, JPEG, GIF   | **SVG does not render in email** — Gmail, Outlook and Yahoo strip it. WebP support is patchy |
| Max bytes  | 4 MB                     | tens of KB       | Recipients pay for the bytes on mobile; Gmail clips long messages                            |
| Dimensions | 32–4000 px               | ~400 px ceiling  | Email logos display at 120–200 px; 2× covers retina, beyond that is waste                    |

The SVG exclusion is the one that will look wrong to whoever implements it. SVG
is the obvious logo format on the web, the existing validator already accepts and
sanitises it (`src/utils/sanitize-svg-markup/`), and rejecting it feels like a
regression. It is not: an SVG logo renders as nothing in the major clients, and a
tenant testing in a client that happens to support it would ship broken mail to
everyone else. Reject at upload with a message that says why.

**The hard constraint on wherever these land:** the URL must be public, stable
and unauthenticated. Email clients fetch images from the recipient's machine
with no session, and Gmail proxies every image through its own cache. Any
session-guarded asset route yields broken images for every recipient. Vercel
Blob's `access: 'public'` already meets this; nothing here may be moved behind
the platform's auth.

Two mechanical consequences for the implementing layers: the blob path must not
collide with the site logo's `tenants/{id}/{kind}.{ext}`, and the per-template
logo URL is persisted on the template row (§4), not on the tenant settings the
existing action writes — so this is a sibling Server Action, not a new `kind`
passed to the existing one.

## §4 — Copy: Portable Text bodies in `jsonb`, with a locked action

Per tenant, per template type: a `subject` string, a `body` in Portable Text
stored as `jsonb`, and the optional logo URL from §3.1.

**Portable Text is the content model; Sanity is not the store.** The tenant
edits in the platform admin panel, not in Studio — `@portabletext/editor` runs
standalone. This was a deliberate choice: it keeps every tenant email setting on
one screen, at the cost of the drafts, revision history and validation that
Studio documents would have provided for free. Revisit only if authoring
volume makes that loss painful.

**The actionable element is not in the body.** The sign-in button, the invite
accept button, and the newsletter unsubscribe link are rendered _structurally_
by the template — between body and footer — and never appear in the editable
field. A tenant may relabel them; a tenant cannot delete them, because they were
never inside the thing being edited.

This is what makes free-form rich text safe on transactional mail. The
alternative considered and rejected was a `{{token}}` the tenant must remember
to keep: a tenant who deletes the token from their sign-in email locks every one
of their users out, and discovers it only via support.

**`@blog/email` gains a Portable-Text-to-email-HTML serializer.** It cannot
reuse `@blog/ui`'s renderer, which is React and emits web CSS. The email
serializer is pure, framework-free, emits inlined styles and table layout, and
routes every text node through the canonical `escapeHtml`. Its supported block
set is deliberately small — paragraph, heading, emphasis, link, list — and
anything unsupported is dropped rather than passed through, so an editor
capability added later cannot silently emit unstyled or unsafe markup.

Read path merges the tenant's authored copy over product defaults per field, so
a template type added after a tenant was provisioned renders defaults rather
than blank. See §5.

## §5 — Defaults are seeded at provision

`packages/db/scripts/provision-tenant/` inserts default copy for every template
type as part of provisioning, so a new tenant's mail is complete and on-brand
before anyone edits anything.

Two cases seeding does not cover, both of which need the merge-with-defaults
read path from §4:

- **Tenants provisioned before this ships** — a backfill, run once. It writes
  the same defaults the provisioning step writes.
- **Template types added later** — a tenant provisioned today has no row for a
  template type introduced next quarter.

Seeding is the primary path; the merge is the safety net. Neither alone is
sufficient.

## §6 — `@blog/db` stops sending email

`@blog/db` loses `resend`, both private `escapeHtml` copies, and its
`@blog/email` dependency. Its scripts instead POST to a new endpoint on
`apps/platform`, which owns the send.

**The security design is precedent-matched, not invented.**
`apps/web/src/app/api/revalidate-site-config/route.ts:67-105` is already a
machine-to-machine endpoint authenticated by a Bearer token compared with
`timingSafeEqual` (`apps/web/src/utils/is-secret-match/is-secret-match.ts:4-15`),
and `apps/platform` already calls it. The new endpoint is that same shape in the
opposite direction. Note that `apps/platform` has no inbound service-token
pattern today — both its existing routes (`/api/auth/[...nextauth]`,
`/api/dashboard/select-tenant`) assume an Auth.js session cookie — so this is
the first, and its guard should be written to be reused.

The calling scripts (`recheck-tenant-owners`, `validate-tenant-documents`, and
`provision-tenant` via `lib/notify-owner-elevation-outcome.ts:27-48`) gain a
platform base URL and a shared secret. They currently read only `DATABASE_URL`,
`SANITY_MANAGEMENT_TOKEN` / `TENANT_TOKEN_ENCRYPTION_KEY`, and an optional
`RESEND_API_KEY`; the workflows that invoke them
(`.github/workflows/recheck-tenant-owners.yml:90`,
`.github/workflows/validate-tenant-documents.yml:114-127`) need the new values
added. `RESEND_API_KEY` drops out of both.

**Accepted tradeoff, recorded deliberately.** These are the alerts that fire
when provisioning breaks. Routing them through the platform app means a platform
outage silences the alarm about things being broken, where today's direct Resend
call has no such coupling. This was raised in brainstorming and accepted: the
alerts already require the database to be reachable, and the boundary win is
judged worth the added hop. If operator alerting later needs to survive a
platform outage, the answer is a fallback transport in the script, not a return
to `db` owning email.

## §7 — Magic-link mail resolves its own tenant

The magic-link senders were believed to have no tenant context. They do.
`packages/auth/src/providers/magic-link/magic-link-provider.ts:29-36` already
extracts `const { host } = new URL(url)` and already performs a database lookup
inside `sendVerificationRequest` — `findPendingInviteTenantNames(identifier)` —
because `packages/auth/package.json:21` depends on `@blog/db`.

So tenant resolution is `getTenantByDomain(host)`, the same lookup
`apps/web/src/server/tenant/resolve-tenant.ts:31-32` performs against the
`tenant_domains` table for ordinary rendering. Resolved tenant yields both brand
(§2) and copy (§4).

A host matching no tenant falls back to platform-neutral styling and default
copy. This must not throw: failing to resolve a tenant is not a reason to fail
to deliver a sign-in email.

Getting this wrong is more costly than it looks — a sign-in email wearing the
wrong tenant's brand reads as a phishing attempt to the recipient.

## §8 — What this does to epic #2605

#2607–#2609 were scoped as straight migrations of each existing sender onto
`buildEmailShell`. That signature is changing, so those tickets are rewritten
rather than merely re-ordered. #2610 and #2611 are re-assessed against this
design before any work starts.

The scaffold merged in #2619 is not reverted. `escapeHtml`, `sendEmail`, the
package's layer position and its ESLint preset all stand; what changes is the
shell's shape and the addition of everything above.

One consequence worth recording: with `db` no longer a consumer (§6),
`@blog/email`'s "upstream is `utils` only" constraint is no longer forced by
`db`. It remains correct — `@blog/auth` still consumes the package and sits
above `db` — but the justification written into `SPEC.md` §4 and
`.claude/agents/email.md` names `db` and must be updated to match reality.

## §9 — Layer order

In dependency order:

1. `config` — contrast guard relocation (§2) with its `apps/web` follow-through,
   plus the template-type vocabulary. This runs first and alone: both `email`
   and `platform-app` consume the guard, and nothing else can start until it
   has a settled home.

   The template-type const belongs in `@blog/config` rather than `@blog/db`
   despite `db` persisting it as the copy map's key. `CLAUDE.md`'s test is
   reach, not storage: `email` names the templates, `platform-app` renders a
   form per type, and `db` keys rows by them. Three layers is the same shape as
   `AUDIT_ACTION`, which stays in `config` for exactly this reason.

2. `db` — settings + copy schema (including the per-template logo URL),
   migration, seeding, dropping `resend`
3. `email` — split shells, brand resolver, PT serializer, templates
4. `platform-app` — settings form, PT editor, per-template logo upload
   (§3.1) and its email-specific validator, operator-alert endpoint
5. `auth`, `web` — resolution at the two remaining send sites

`auth` and `web` are siblings at the end and may run in parallel. `email`
cannot start before `config` lands the guard, and `platform-app`'s form cannot
start before `db` lands the schema.

Per-layer PRs, with the caveat from `CLAUDE.md`: split only where each merges
green alone. The `config` guard move and its `apps/web` import update must ship
together — relocating an export reds `type-check` until the consumer follows.

## Testing

- `resolveTenantEmailBrand` — hue in, hex out; verified against the same
  recipes `build-theme-style-block` uses, so web and email cannot drift.
- Contrast guard — the existing `to-theme-tokens` tests move with it and must
  still pass from their new home unchanged.
- PT serializer — escaping (every interpolated value), unsupported-block
  dropping, and table/inline-style output shape.
- Locked action — a template renders its action element even when the
  authored body is empty, and there is no authored input that removes it.
- Merge-with-defaults — a tenant row missing a template type renders defaults,
  not blanks.
- Logo validation — SVG and WebP are rejected with a reason, oversized
  dimensions and byte counts are rejected, and PNG/JPEG/GIF within bounds pass.
  The SVG case gets an explicit test: the site-logo validator accepts SVG, so a
  future refactor that "unifies" the two validators must fail loudly here.
- Logo fallback — a template with no logo renders the tenant email logo, and a
  tenant with neither renders the product default.
- Operator endpoint — rejects a missing, wrong, and wrong-length token;
  comparison is constant-time.
- Type-level separation — a compile-time assertion that a tenant brand cannot
  be passed to `buildOperatorShell`.

## Risks

- **The contrast guard move touches live site rendering.** It is a relocation,
  not a rewrite, and its tests move with it — but it is the one change here
  that can regress the public site.
- **A Portable Text editor in `apps/platform` is a new dependency** on a
  surface that has so far been Base UI plus hand-rolled primitives. This design
  assumes `@portabletext/editor` is usable standalone, outside a Studio
  workspace; confirm that against live docs before the `platform-app` ticket is
  written, because the whole §4 storage decision rests on it. If it turns out to
  require Studio context, the choice reopens between a simpler editor and moving
  copy into Sanity documents after all.
- **Backfill correctness** — the one-time default seeding for existing tenants
  must be idempotent, since it will be run against a shared database under the
  human-gated migration process.
- **Operator alert availability** — accepted, §6.
