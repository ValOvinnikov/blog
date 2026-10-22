---
title: Newsletter
status: partial
layers: [studio, service, ui, web, db, email, platform]
code:
  - packages/studio/src/schema-types/modules/newsletter/**
  - packages/studio/src/schema-types/objects/newsletter-trust-cue/**
  - packages/service/src/features/modules/newsletter/**
  - packages/ui/src/components/organisms/newsletter-signup/**
  - apps/web/src/modules/newsletter/**
  - apps/web/src/components/shared/newsletter-*/**
  - apps/web/src/server/newsletter/**
  - apps/web/src/server/rate-limit/client-key/**
  - apps/web/src/server/rate-limit/public-write-guard/**
  - apps/web/src/app/api/newsletter/**
  - apps/web/src/utils/*newsletter-subscribed-cookie*/**
  - packages/db/src/schema/subscribers.ts
  - packages/db/src/queries/subscribers/**
  - packages/email/src/templates/tenant/newsletter-confirmation/**
epics: [4083, 2801]
---

# Newsletter

## What it does

An editor places a Newsletter Signup module on a page; a reader enters an email address, gets a confirmation email and becomes an active subscriber by clicking its link (double opt-in). The confirmation email carries a one-click unsubscribe link, and a signed-in reader can unsubscribe or resend the confirmation from `/account`. Nothing sends issues to subscribers yet. The platform shows the Newsletter capability as "Coming soon" and locked off, and every Features save writes it off, so the module renders only on a `GROWTH` site whose stored toggle is already on.

## Surfaces and routes

- **Studio** — `module_newsletter` ("Newsletter Signup"): title, brand variant, variant (Full or Compact), heading block, copy, up to two trust cues, alignment, layout. Pickers relabel it "(off in Features)" and its documents warn while the capability is off.
- **Public site** — the module on any page with a module list. Full shows copy and trust cues in a panel; Compact drops the supporting text, copy and trust cues.
- `GET /api/newsletter/confirm?token=&lang=` — confirms, then redirects (303) to the result page.
- `GET /api/newsletter/unsubscribe?token=&lang=` keeps the token in a cookie and redirects (303) to the confirmation page, or to the invalid-link result page when the token is missing; `POST` to the same path deletes the subscription, taking the token from the query string (the `List-Unsubscribe-Post` one-click target) or else from that cookie, then clears the cookie and redirects (303) to the result page.
- `/[locale]/newsletter/unsubscribe` — the confirm button, in the site's layout, theme and the link's language; it `POST`s to the unsubscribe path with no token in either URL, so the token never reaches analytics, history or a `Referer`. ISR like the result pages, `noindex`.
- `/[locale]/newsletter/[result]` — the confirm or unsubscribe outcome (`NEWSLETTER_RESULT`: confirmed, unsubscribed, or an invalid, failed or unavailable link) in the site's layout, theme and the link's language, with a link home; `noindex`.
- `/[locale]/account` — the Newsletter section (see [reader-account](./reader-account.md)).
- **Platform** — the Features toggle, the Email page's `NEWSLETTER_CONFIRMATION` template, and a "Coming soon" Subscribers sidebar entry with no page.

## Data

- Sanity: `module_newsletter` documents; trust cues are `newsletterTrustCue` objects (localized `text`, max 40 characters). Loaded through `service.modules.newsletter.v1.getNewsletter`, ISR-tagged `modules:newsletter` and `module:<id>`.
- Neon `subscribers`: `id`, `tenant_id` (cascade), `email` (normalized), `status` `pending` | `active`, `confirmation_token_hash` (unique SHA-256 hex of the emailed confirm token; the raw token is never stored), `unsubscribe_token_hash` (unique SHA-256 hex of the random unsubscribe token emailed before links were signed; nothing writes it now, it only lets those earlier links keep working), `subscribed_at`, `confirmed_at`, `confirmation_sent_at` (the last confirmation send, claimed atomically). Unique (`tenant_id`, `email`). `email` also has an encrypted form (`email_encrypted`, `PERSONAL_DATA_ENCRYPTION_KEY`) and a keyed index (`email_index`, the HMAC of the address under `PERSONAL_DATA_INDEX_KEY`, ignoring case and any `+tag`); every write fills both beside the plain column. Every read uses only those: a signup dedupes on the index and emails the decrypted address, and the account section and `/account` actions find a reader's row through the index of their decrypted account email, then keep only the row whose decrypted address equals it ignoring case, so an account never reaches a `+tag` sibling's subscription; a resent confirmation goes to that row's address. No user FK: a signed-out reader can subscribe.
- Unsubscribing deletes the row. Deprovisioning a tenant purges its subscribers.
- Cookie `newsletter_unsubscribe_token` (one hour, `SameSite=Strict`, httpOnly, `Path=/api/newsletter/unsubscribe`) carries the token from the unsubscribe link to the confirm `POST`; without it the confirm lands on the invalid-link page.
- Cookie `newsletter_subscribed` (one year, `SameSite=Lax`, not httpOnly) set on subscribe and cleared on account unsubscribe; `NewsletterSubscribedGate` hides every newsletter module while it is present, before hydration via an inline script.

## Configuration

- **Editor (Studio)** — the module's content, variant, trust cues, alignment and layout, and where it is placed.
- **Owner or operator (platform)** — the `NEWSLETTER` toggle, `GROWTH` only and locked off as Coming soon; the confirmation email's subject, body, logo, sender name, reply-to and postal footer on the Email page (see [email](./email.md)).
- **Voice** — the confirm and unsubscribe result-page and confirmation-page copy is fixed (`newsletterConfirm.*`, `newsletterUnsubscribe.*`), as is the form copy, including the rate-limit message (`newsletterForm.errorRateLimited`).

## Constraints and invariants

- A malformed email answers `INVALID` with `fieldErrors` for `email` before any tenant lookup, write or send.
- Most restrictive wins: the module renders only when the plan includes `NEWSLETTER` and the toggle is on, and `subscribeToNewsletterAction` re-checks the capability and refuses with `UNAVAILABLE`.
- Subscribe and confirm write only through `resolveWritableTenant`; an inactive tenant gets the no-retry "unavailable" copy. Unsubscribe by link resolves the tenant without the active check, so it works for any tenant on any plan.
- At most one row per tenant and mailbox at a time (`Reader+news@` finds the row stored for `reader@`; unsubscribing deletes it, so a later subscribe creates a new one); a repeat subscribe for a pending address resends the confirmation only when the last send is over 15 minutes old, and otherwise answers `SUCCESS` without email. An active address answers `ALREADY_SUBSCRIBED` without email. A failed send gives the cooldown back. Every confirmation email that is sent, from a signup or from `/account`, mints a fresh random confirm token and stores its hash only once the send succeeds, so a failed send leaves the previous confirm link working and a successful one retires it; incoming confirm tokens are hashed before the lookup. The unsubscribe link never changes: its token is `<subscriberId>~<HMAC-SHA256 of the id under NEWSLETTER_UNSUBSCRIBE_KEY>`, verified rather than stored, so the link in every email a subscriber was sent keeps working until they unsubscribe. A token that is not signed is looked up by its hash in `unsubscribe_token_hash`, for links emailed before signing.
- Abuse guards run before anything is stored: Vercel BotID (`checkBotId()`; a bot is refused and logged as `newsletter.subscribe_blocked`), then a per-IP limit of 5 attempts per 10 minutes per tenant, counted in the shared rate-limit store. Both refuse with `RATE_LIMITED` and store and send nothing. When BotID itself errors, or the store errors, times out (2 seconds) or is unconfigured, sign-up fails closed with the same outcome and one `newsletter.subscribe_blocked` warn.
- Confirmation flips `pending` to `active` in place; a second click shows the same confirmed page.
- Opening the unsubscribe link or the confirmation page never deletes; only the POST does.
- Link language comes from the subscribing page's locale, re-validated against the tenant's locales by `resolveNewsletterLinkLocale`.
- The from address is `NEWSLETTER_FROM_ADDRESS`, else Resend's testing sender; a tenant sender name replaces only the display name, sanitized for header injection.

## Dependencies

- Layers: `studio`, `service`, `ui` (`NewsletterSignup`), `web`, `db`, `email`, `platform`, `config` (`NEWSLETTER_VARIANT`, `CAPABILITY`, `NEWSLETTER_RESULT`).
- Features: [module-system](./module-system.md), [plans-and-entitlements](./plans-and-entitlements.md), [email](./email.md), [reader-account](./reader-account.md), [languages](./languages.md), [rendering-and-caching](./rendering-and-caching.md).
- Env: `NEWSLETTER_FROM_ADDRESS`, `NEWSLETTER_UNSUBSCRIBE_KEY` (signs unsubscribe links; no confirmation email can be sent without it, and changing it breaks every link already sent), `RESEND_API_KEY`, `DATABASE_URL`, `KV_REST_API_URL` and `KV_REST_API_TOKEN` (shared rate-limit store).

## Entry points

- `packages/studio/src/schema-types/modules/newsletter/newsletter.ts`
- `packages/service/src/features/modules/newsletter/adaptor/loader.ts`
- `apps/web/src/modules/newsletter/newsletter-module.tsx`
- `apps/web/src/components/shared/newsletter-form/newsletter-form.tsx`
- `apps/web/src/server/newsletter/newsletter-actions/newsletter-actions.ts`
- `apps/web/src/server/newsletter/subscribe-guard/subscribe-guard.ts` (built on `apps/web/src/server/rate-limit/public-write-guard/public-write-guard.ts`), `apps/web/src/server/newsletter/newsletter-confirmation-send/newsletter-confirmation-send.ts`, `apps/web/src/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token.ts`
- `apps/web/src/server/newsletter/newsletter-subscription-actions/newsletter-subscription-actions.ts`
- `apps/web/src/app/api/newsletter/confirm/route.ts`, `apps/web/src/app/api/newsletter/unsubscribe/route.ts`, `apps/web/src/server/newsletter/newsletter-result-redirect/newsletter-result-redirect.ts`
- `apps/web/src/app/[tenant]/[locale]/newsletter/[result]/page.tsx`, `apps/web/src/components/pages/newsletter-result-page/newsletter-result-page.tsx`
- `apps/web/src/app/[tenant]/[locale]/newsletter/unsubscribe/page.tsx`, `apps/web/src/components/pages/newsletter-unsubscribe-page/newsletter-unsubscribe-page.tsx`, both pages built on `apps/web/src/components/page-templates/message-page/message-page.tsx`
- `packages/db/src/queries/subscribers/`
- `packages/email/src/templates/tenant/newsletter-confirmation/newsletter-confirmation.ts`

## Tests and stories

- `packages/service/src/features/modules/newsletter/adaptor/*.test.ts`, `packages/db/src/queries/subscribers/**/*.test.ts`, `newsletter-confirmation.test.ts`.
- `apps/web/src/modules/newsletter/*.test.tsx`, `apps/web/src/server/newsletter/**/*.test.ts`, `apps/web/src/app/api/newsletter/**/route.test.ts`, `newsletter-result-page.test.tsx` and its story, `newsletter-unsubscribe-page.test.tsx`, the `MessagePage` story, the form, gate and control tests.
- Stories: `newsletter-module-view.stories.tsx`, `newsletter-form.stories.tsx` (web); `newsletter-signup*.stories.tsx` (ui).

## Related

- #4083 — epic: newsletter sending (subscriber list, issue authoring, per-tenant limits and reputation gate); ends the "Coming soon".
- #2801 — live subscriber count in newsletter and hero copy.
- #5033 — newsletter eyebrow, intro and footnote share one style with Hero, CTA and article header.
