---
title: Contact form
status: built
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
  - packages/studio/src/schema-types/modules/contact-form/**
  - packages/service/src/features/modules/contact-form/**
  - apps/web/src/modules/contact-form/**
  - apps/web/src/server/contact-form/**
  - apps/web/src/server/rate-limit/public-write-guard/**
  - apps/web/src/utils/validate-contact-message/**
epics: [1292, 3661, 3667, 3668, 3669, 3670, 3671, 3672, 3673, 3674]
---

# Contact form

## What it does

A visitor sends the site's owner a message from a contact form placed on a page, without the owner publishing an email address. Each message is stored as a lead and emailed to the owner with Reply-To set to the visitor; the owner reads and deletes leads in the platform. It is the module catalogue's one module with a write path.

## Surfaces and routes

- **Public site** — `module_contactForm` on Home and Landing pages: the module heading above a 560px column, left or centred by `contentAlignment`, holding Name and Email side by side from `sm`, Message below, a hidden honeypot, a **Send message** button and the privacy note under it. While sending, the button reads "Sending…" and is disabled. A sent message replaces the whole form with "Message sent" and the module's success message. A field the visitor got wrong shows its own error under it; a refused or failed send shows one error above the button. Either way everything typed stays. The module is omitted when `CONTACT_FORM` is off or the tenant is not active. The visitor gets no email.
- **Platform** — the **Leads** page at `/dashboard/leads`, listed in the sidebar after Features, for owners only (never editors). It shows when the plan has `CONTACT_FORM`, or when a downgraded tenant still has stored leads — then with a notice that the contact form is a Growth feature and existing messages are kept, and List and Delete still work. Otherwise there is no nav entry and the page 404s. Operators always see it at `/tenants/{id}/leads`. Leads are newest first, 25 per page through `?page=`; a page past the last redirects to the last one. Each row shows the received date and time (UTC), the name, the email as a `mailto:` link, the message clamped to two lines with Show more/less, and the page it came from. The page says each message was also emailed, and a tenant with none sees a one-sentence empty state. A per-row **Delete** asks for confirmation; there is no bulk delete and no editing. The action validates both ids, requires an owner or operator of the tenant, and deletes only within it, on any plan; it records no audit event.
- **Platform, Email page** — "Send contact messages to" on the Sender & footer card, validated as an email and saved with the sender fields (not per language). Saving it empty clears the override, so the owner's sign-in email is used. Test sends ignore it. The field shows only to an owner or operator on a plan with `CONTACT_FORM`; otherwise the stored address is kept, and the save action ignores any value sent, so an editor can never redirect messages. The Email page is also open to a plan that has only the contact form.
- **Studio** — `module_contactForm`, "Contact Form", under Modules → Conversion, allowed on `page_home` and `page_landing`: heading block, brand variant, success message, privacy note, alignment and layout. No CTA buttons (the send button is the action) and no field toggles. Like the Newsletter, it shows a warning when Contact form is off in Features.

## Data

- Neon `leads` table, a tenant-scoped sibling to `subscribers`: `name`, `email`, `message`, `sourcePath` (the page the form sat on) and `createdAt`, indexed on `(tenantId, createdAt desc)` and cascade-deleted with its tenant. `createLead`, `listLeads` (newest first, paged, with the total) and `deleteLead` (never across tenants) are its queries.
- `email_config.contactRecipient` — a nullable override, read and written through `getEmailConfig`/`upsertEmailConfig`.
- Recipient: `getContactRecipient` returns the override when set, otherwise the owner's sign-in email from `getTenantOwnerEmail`. The address is never stored in Sanity, whose content is publicly readable.
- `module_contactForm` holds its own `successMessage` (localised, required in the default language, max 160 per language) and an optional `privacyNote` (localised `paragraphText`, for the policy link), so two forms can say different things; there is no settings singleton. Field labels, the button and error messages are fixed product copy.
- Fields are fixed: name, email and message, all required. No toggles, no consent checkbox; a privacy note links the policy.
- Automatic expiry of old leads is a separate, planned retention job.

## Configuration

- **Capability** — a new `CAPABILITY.CONTACT_FORM`, `GROWTH` only — every submission sends the owner a notification through Resend, as the newsletter does — and on by default. An owner can switch it off on the Features page; the module is then omitted, as it is for a suspended tenant.
- **Owner or operator** — sets the recipient override on the Email page, reads and deletes leads.
- **Editor** — places the module and writes the success message and privacy note in Studio.
- **Voice** — the success message and privacy note are editor content in Sanity, not Voice fields; everything else is fixed `contactForm.*` copy on `VOICE_FIXED_KEYS`.
- **Env** — `PLATFORM_APP_URL` (`apps/web`, optional) is the admin panel's origin for the notification's "View all leads" link. Unset, the email still sends with an inert link and the send logs `contact_form.platform_url_missing`.

## Constraints and invariants

- Spam protection is Vercel BotID (invisible, first-party, needs no consent banner), plus a honeypot and a soft per-IP rate limit of 5 sends per 10 minutes. A bot, a filled honeypot or a burst stores nothing and sends nothing.
- The `submitContactMessage` server action checks, in order: BotID, honeypot, rate limit, tenant active and capability on, field validation (name 1–100 characters with line breaks folded to spaces, a valid email, message 10–5,000), then stores the lead and sends the email. It answers a `TActionResult` (`SPEC.md` § Server-action results): `SUCCESS`, `INVALID` (with the invalid fields), `BLOCKED` or `SERVER_ERROR`. A bot, a filled honeypot, a burst, an inactive tenant or a switched-off capability answer `BLOCKED`, which the form shows as the rate-limit message. BotID and the rate limiter come from the shared `createPublicWriteGuard`, the newsletter's own guard, and fail closed: a BotID error or an unreachable or slow (2 seconds) store refuses the send and logs one `contact_form.submit_blocked` warn.
- The source path is the page's pathname as the browser sent it, kept only when it is a local path of up to 2,048 characters, otherwise `/`. Fields that arrive as anything other than text count as empty.
- A new capability key breaks every `Record<TCapability, …>` until each has it, so the capability lands in config, db, web and platform together.
- Delivery uses `@blog/email`'s `sendEmail` with `buildContactNotificationEmail` on the tenant shell: subject "New message from {visitor}", the sender, a link to the page, the message quoted with its line breaks, a line that replying answers the visitor, and a link to the Leads list. Every visitor string is escaped. The caller sets `replyTo` to the visitor; `@blog/email` never logs, so the web server action logs a failed send.
- A stored lead whose email fails still answers `SUCCESS`; the action logs the email failure once, since the lead is safe in the list.
- A `Textarea` atom joins `TextInput` in `@blog/ui`; the form itself is composed in `apps/web`, not a `@blog/ui` organism.

## Dependencies

- Layers: `config` (capability), `db` (leads, recipient), `email` (template), `ui` (Textarea), `platform` (Leads, recipient), `studio` and `service` (module), `web` (form, server action, BotID).
- Features: ./module-system.md, ./plans-and-entitlements.md, ./email.md, ./newsletter.md (the existing public write path it mirrors), ./tenant-access.md, ./footer-and-legal-pages.md (the privacy policy the note links to).
- BotID setup (`withBotId` in `next.config.ts`, `initBotId` in `instrumentation-client.ts`) and the shared rate limiter at `apps/web/src/server/rate-limit/`; the action itself only calls `checkBotId()`.
- Env vars: `PLATFORM_APP_URL` for the leads link; otherwise the newsletter's `NEWSLETTER_FROM_ADDRESS` sender and Resend's existing `sendEmail` configuration.

## Entry points

- `packages/db/src/schema/leads.ts` and `packages/db/src/queries/leads/` — lead storage
- `packages/db/src/queries/email-config/get-contact-recipient/get-contact-recipient.ts` — recipient resolution
- `packages/email/src/templates/tenant/contact-notification/contact-notification.ts` — the owner notification
- `apps/platform/src/app/[locale]/dashboard/(tenant)/leads/page.tsx` — the Leads page
- `apps/platform/src/server/leads/delete-lead-action.ts` — the per-row delete
- `apps/platform/src/server/auth/resolve-tenant-page-access.ts` — who reaches Leads, by role, plan and stored leads
- `packages/service/src/features/modules/contact-form/adaptor/loader.ts` — `service.modules.contactForm.v1.getContactForm`: heading block, success message, privacy note (`undefined` when unset), brand variant, alignment and layout
- `apps/web/src/modules/contact-form/contact-form-module.tsx` — the module, in `HOME_MAP` and `LANDING_MAP`
- `apps/web/src/modules/contact-form/components/contact-form/contact-form.tsx` — the `'use client'` form, with its state in `hooks/use-contact-form/`
- `apps/web/src/server/contact-form/contact-form-actions/contact-form-actions.ts` — `submitContactMessage`
- `apps/web/src/server/contact-form/contact-notification-send/contact-notification-send.ts` — the owner notification send
- `apps/web/src/utils/validate-contact-message/validate-contact-message.ts` — the field rules, shared by the form and the action

The pieces it builds on:

- `packages/db/src/queries/memberships/get-tenant-owner-email/get-tenant-owner-email.ts`
- `packages/ui/src/components/atoms/text-input/text-input.tsx`
- `apps/web/src/server/newsletter/newsletter-actions/newsletter-actions.ts` (`subscribeToNewsletterAction`, the public server action the contact action is modelled on)

## Tests and stories

PGlite query tests beside each `leads` query and `get-contact-recipient.test.ts`; `get-tenant-owner-email.test.ts` covers the owner lookup the recipient falls back to. `contact-notification.test.ts` covers the subject, escaping and line breaks. The module loader's `transformer.test.ts` and `loader.test.ts` cover a full document, an unset privacy note and the cache tags. In `apps/platform`, the Leads page test and `resolve-tenant-page-access.test.ts` cover the role, plan and downgrade gates, `require-tenant-owner.test.ts` the owner check, `leads-table`, `leads-pagination` and `delete-lead-control` tests cover ordering, paging and the confirmed delete, `delete-lead-action.test.ts` the tenant scoping, and the email-settings and `update-email-config-action` tests the recipient's save and clear. In `apps/web`, `contact-form-actions.test.ts` covers each outcome (bot, honeypot, rate limit, inactive tenant, capability off, invalid fields, a failed email still `SUCCESS`), `contact-notification-send.test.ts` the recipient, Reply-To and links, `validate-contact-message.test.ts` the field rules, `contact-form.test.tsx` the success swap and kept input, and `contact-form-module.test.tsx` the omission gates. `contact-form-module-view.stories.tsx` shows the module; a message containing "fail" shows the error state there.

## Related

- #1292 — contact form epic (design of record).
- #3667 — `CONTACT_FORM` capability; #3668 — `leads` table and recipient override; #3669 — owner notification template; #3670 — `Textarea` atom; #3671 — Leads page and recipient field; #3672 — `module_contactForm`; #3673 — loaders; #3674 — web form, BotID and server action.
- #3661 — expire leads after a retention period.
