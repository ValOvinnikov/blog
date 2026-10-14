---
title: Contact form
status: planned
layers: [config, db, email, ui, platform, studio, service, web]
code:
  - packages/db/src/queries/memberships/get-tenant-owner-email/**
  - packages/db/src/schema/email-config.ts
epics: [1292, 3661, 3667, 3668, 3669, 3670, 3671, 3672, 3673, 3674]
---

# Contact form

## What it does

A visitor will be able to send the site's owner a message from a contact form placed on a page, without the owner publishing an email address. Each message is stored as a lead and emailed to the owner with Reply-To set to the visitor; the owner reads and deletes leads in the platform. It is the module catalogue's one module with a write path. None of it is built yet; the pieces it will reuse exist.

## Surfaces and routes

- **Public site** — a planned `module_contactForm` placed on Home and Landing pages. After a successful send the success message replaces the form; errors show inline and keep what the visitor typed. The visitor gets no email.
- **Platform** — a planned **Leads** page (newest first, read-only apart from a per-row Delete for GDPR erasure) and a contact-recipient field on the existing Email page.
- **Studio** — planned `module_contactForm` under Modules → Conversion, allowed on `page_home` and `page_landing` (heading block, brand variant, alignment and layout; no CTA buttons, no field toggles), and a `settings_contact` singleton, "Contact Settings".

## Data

- Planned Neon `leads` table, a tenant-scoped sibling to `subscribers`, plus `email_config.contactRecipient` (nullable override). Both arrive by migration.
- Recipient: the owner's sign-in email from `getTenantOwnerEmail` by default; the Email-page override when set. The address is never stored in Sanity, whose content is publicly readable.
- `settings_contact` holds only `successMessage` (required, max 160) and an optional `privacyNote` (`paragraphText`, for the policy link). Field labels, the button and error messages are fixed product copy.
- Fields are fixed: name, email and message, all required. No toggles, no consent checkbox; a privacy note links the policy.
- Automatic expiry of old leads is a separate, planned retention job.

## Configuration

- **Capability** — a new `CAPABILITY.CONTACT_FORM`, on every plan including `FREE` and on by default. An owner can switch it off on the Features page; the module is then omitted, as it is for a suspended tenant.
- **Owner or operator** — sets the recipient override on the Email page, reads and deletes leads.
- **Editor** — places the module and writes the success message and privacy note in Studio.
- **Voice** — the success message and privacy note are editor content in Sanity, not Voice fields; everything else is fixed.

## Constraints and invariants

These are decided and must hold when it ships:

- Spam protection is Vercel BotID (invisible, first-party, needs no consent banner), plus a honeypot and a soft per-IP rate limit of 5 sends per 10 minutes. A bot, a filled honeypot or a burst stores nothing and sends nothing.
- The server action checks, in order: BotID, honeypot, rate limit, tenant active, field validation (name 1–100 characters, a valid email, message 10–5,000), then stores the lead and sends the email.
- A new capability key breaks every `Record<TCapability, …>` until each has it, so the capability lands in config, db, web and platform together.
- Delivery uses `@blog/email`'s `sendEmail` and branded shell with a new owner-notification template; `@blog/email` never logs, so the web server action logs a failed send.
- A stored lead whose email fails still answers `sent`; the action logs the email failure once, since the lead is safe in the list.
- A `Textarea` atom joins `TextInput` in `@blog/ui`; the form itself is composed in `apps/web`, not a `@blog/ui` organism.

## Dependencies

- Layers: `config` (capability), `db` (leads, recipient), `email` (template), `ui` (Textarea), `platform` (Leads, recipient), `studio` and `service` (module and settings), `web` (form, server action, BotID).
- Features: ./module-system.md, ./plans-and-entitlements.md, ./email.md, ./newsletter.md (the existing public write path it mirrors), ./tenant-access.md, ./footer-and-legal-pages.md (the privacy policy the note links to).
- Unbuilt prerequisites: BotID setup (`withBotId`, `initBotId`) and a shared rate limiter at `apps/web/src/server/rate-limit/`; the action itself only calls `checkBotId()`.
- Env vars: none of its own; Resend's existing `sendEmail` configuration.

## Entry points

Nothing of the feature exists. The pieces it builds on:

- `packages/db/src/queries/memberships/get-tenant-owner-email/get-tenant-owner-email.ts`
- `packages/db/src/schema/email-config.ts`
- `packages/ui/src/components/atoms/text-input/text-input.tsx`
- `apps/web/src/server/newsletter/newsletter-actions/newsletter-actions.ts` (`subscribeToNewsletterAction`, the public server action the contact action is modelled on)

## Tests and stories

None for the feature. `get-tenant-owner-email.test.ts` covers the default recipient lookup.

## Related

- #1292 — contact form epic (design of record).
- #3667 — `CONTACT_FORM` capability; #3668 — `leads` table and recipient override; #3669 — owner notification template; #3670 — `Textarea` atom; #3671 — Leads page and recipient field; #3672 — `module_contactForm` and `settings_contact`; #3673 — loaders; #3674 — web form, BotID and server action.
- #3661 — expire leads after a retention period.
