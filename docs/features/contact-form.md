---
title: Contact form
status: planned
layers: [config, db, email, ui, platform, studio, service, web]
code:
  - packages/db/src/schema/leads.ts
  - packages/db/src/queries/leads/**
  - packages/db/src/queries/email-config/get-contact-recipient/**
  - packages/db/src/schema/email-config.ts
  - packages/email/src/templates/tenant/contact-notification/**
  - apps/platform/src/app/[locale]/dashboard/(tenant)/leads/**
  - apps/platform/src/components/features/leads/**
  - apps/platform/src/server/leads/**
epics: [1292, 3661, 3667, 3668, 3669, 3670, 3671, 3672, 3673, 3674]
---

# Contact form

## What it does

A visitor will be able to send the site's owner a message from a contact form placed on a page, without the owner publishing an email address. Each message is stored as a lead and emailed to the owner with Reply-To set to the visitor; the owner reads and deletes leads in the platform. It is the module catalogue's one module with a write path. The capability, the data layer, the owner notification template, the `Textarea` atom and the platform's Leads page and recipient field are built; the form and module are not.

## Surfaces and routes

- **Public site** — a planned `module_contactForm` placed on Home and Landing pages. After a successful send the success message replaces the form; errors show inline and keep what the visitor typed. The visitor gets no email.
- **Platform** — the **Leads** page at `/dashboard/leads`, listed in the sidebar after Features, for owners only (never editors). It shows when the plan has `CONTACT_FORM`, or when a downgraded tenant still has stored leads — then with a notice that the contact form is a Growth feature and existing messages are kept, and List and Delete still work. Otherwise there is no nav entry and the page 404s. Operators always see it at `/tenants/{id}/leads`. Leads are newest first, 25 per page through `?page=`; a page past the last redirects to the last one. Each row shows the received date and time (UTC), the name, the email as a `mailto:` link, the message clamped to two lines with Show more/less, and the page it came from. The page says each message was also emailed, and a tenant with none sees a one-sentence empty state. A per-row **Delete** asks for confirmation; there is no bulk delete and no editing. The action validates both ids, requires an owner or operator of the tenant, and deletes only within it, on any plan; it records no audit event.
- **Platform, Email page** — "Send contact messages to" on the Sender & footer card, validated as an email and saved with the sender fields (not per language). Saving it empty clears the override, so the owner's sign-in email is used. Test sends ignore it. The field shows only to an owner or operator on a plan with `CONTACT_FORM`; otherwise the stored address is kept, and the save action ignores any value sent, so an editor can never redirect messages. The Email page is also open to a plan that has only the contact form.
- **Studio** — planned `module_contactForm` under Modules → Conversion, allowed on `page_home` and `page_landing` (heading block, brand variant, alignment and layout; no CTA buttons, no field toggles), and a `settings_contact` singleton, "Contact Settings".

## Data

- Neon `leads` table, a tenant-scoped sibling to `subscribers`: `name`, `email`, `message`, `sourcePath` (the page the form sat on) and `createdAt`, indexed on `(tenantId, createdAt desc)` and cascade-deleted with its tenant. `createLead`, `listLeads` (newest first, paged, with the total) and `deleteLead` (never across tenants) are its queries.
- `email_config.contactRecipient` — a nullable override, read and written through `getEmailConfig`/`upsertEmailConfig`.
- Recipient: `getContactRecipient` returns the override when set, otherwise the owner's sign-in email from `getTenantOwnerEmail`. The address is never stored in Sanity, whose content is publicly readable.
- `settings_contact` holds only `successMessage` (required, max 160) and an optional `privacyNote` (`paragraphText`, for the policy link). Field labels, the button and error messages are fixed product copy.
- Fields are fixed: name, email and message, all required. No toggles, no consent checkbox; a privacy note links the policy.
- Automatic expiry of old leads is a separate, planned retention job.

## Configuration

- **Capability** — a new `CAPABILITY.CONTACT_FORM`, `GROWTH` only — every submission sends the owner a notification through Resend, as the newsletter does — and on by default. An owner can switch it off on the Features page; the module is then omitted, as it is for a suspended tenant.
- **Owner or operator** — sets the recipient override on the Email page, reads and deletes leads.
- **Editor** — places the module and writes the success message and privacy note in Studio.
- **Voice** — the success message and privacy note are editor content in Sanity, not Voice fields; everything else is fixed.

## Constraints and invariants

These are decided and must hold when it ships:

- Spam protection is Vercel BotID (invisible, first-party, needs no consent banner), plus a honeypot and a soft per-IP rate limit of 5 sends per 10 minutes. A bot, a filled honeypot or a burst stores nothing and sends nothing.
- The server action checks, in order: BotID, honeypot, rate limit, tenant active, field validation (name 1–100 characters, a valid email, message 10–5,000), then stores the lead and sends the email.
- A new capability key breaks every `Record<TCapability, …>` until each has it, so the capability lands in config, db, web and platform together.
- Delivery uses `@blog/email`'s `sendEmail` with `buildContactNotificationEmail` on the tenant shell: subject "New message from {visitor}", the sender, a link to the page, the message quoted with its line breaks, a line that replying answers the visitor, and a link to the Leads list. Every visitor string is escaped. The caller sets `replyTo` to the visitor; `@blog/email` never logs, so the web server action logs a failed send.
- A stored lead whose email fails still answers `sent`; the action logs the email failure once, since the lead is safe in the list.
- A `Textarea` atom joins `TextInput` in `@blog/ui`; the form itself is composed in `apps/web`, not a `@blog/ui` organism.

## Dependencies

- Layers: `config` (capability), `db` (leads, recipient), `email` (template), `ui` (Textarea), `platform` (Leads, recipient), `studio` and `service` (module and settings), `web` (form, server action, BotID).
- Features: ./module-system.md, ./plans-and-entitlements.md, ./email.md, ./newsletter.md (the existing public write path it mirrors), ./tenant-access.md, ./footer-and-legal-pages.md (the privacy policy the note links to).
- Unbuilt prerequisites: BotID setup (`withBotId`, `initBotId`) and a shared rate limiter at `apps/web/src/server/rate-limit/`; the action itself only calls `checkBotId()`.
- Env vars: none of its own; Resend's existing `sendEmail` configuration.

## Entry points

- `packages/db/src/schema/leads.ts` and `packages/db/src/queries/leads/` — lead storage
- `packages/db/src/queries/email-config/get-contact-recipient/get-contact-recipient.ts` — recipient resolution
- `packages/email/src/templates/tenant/contact-notification/contact-notification.ts` — the owner notification
- `apps/platform/src/app/[locale]/dashboard/(tenant)/leads/page.tsx` — the Leads page
- `apps/platform/src/server/leads/delete-lead-action.ts` — the per-row delete
- `apps/platform/src/server/auth/resolve-tenant-page-access.ts` — who reaches Leads, by role, plan and stored leads

The pieces it builds on:

- `packages/db/src/queries/memberships/get-tenant-owner-email/get-tenant-owner-email.ts`
- `packages/ui/src/components/atoms/text-input/text-input.tsx`
- `apps/web/src/server/newsletter/newsletter-actions/newsletter-actions.ts` (`subscribeToNewsletterAction`, the public server action the contact action is modelled on)

## Tests and stories

PGlite query tests beside each `leads` query and `get-contact-recipient.test.ts`; `get-tenant-owner-email.test.ts` covers the owner lookup the recipient falls back to. `contact-notification.test.ts` covers the subject, escaping and line breaks. In `apps/platform`, the Leads page test and `resolve-tenant-page-access.test.ts` cover the role, plan and downgrade gates, `require-tenant-owner.test.ts` the owner check, `leads-table`, `leads-pagination` and `delete-lead-control` tests cover ordering, paging and the confirmed delete, `delete-lead-action.test.ts` the tenant scoping, and the email-settings and `update-email-config-action` tests the recipient's save and clear.

## Related

- #1292 — contact form epic (design of record).
- #3667 — `CONTACT_FORM` capability; #3668 — `leads` table and recipient override; #3669 — owner notification template; #3670 — `Textarea` atom; #3671 — Leads page and recipient field; #3672 — `module_contactForm` and `settings_contact`; #3673 — loaders; #3674 — web form, BotID and server action.
- #3661 — expire leads after a retention period.
