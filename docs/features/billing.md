---
title: Billing
status: partial
layers: [db, email, platform]
code:
  - apps/platform/src/app/api/stripe/webhook/**
  - apps/platform/src/app/[locale]/dashboard/(tenant)/upgrade/**
  - apps/platform/src/components/features/upgrade/**
  - apps/platform/src/utils/upgrade-search-params/**
  - apps/platform/src/server/billing/**
  - apps/platform/src/server/tenants/on-tenant-plan-change.ts
  - apps/platform/src/constants/billing.ts
  - apps/platform/src/utils/stripe-env/**
  - packages/db/src/queries/tenants/set-tenant-plan/**
  - packages/db/src/queries/tenants/get-tenant-id-by-stripe-ids/**
  - packages/db/src/queries/stripe-webhook-events/**
  - packages/email/src/templates/owner/owner-receipt/**
epics: [4840]
---

# Billing

## What it does

An owner on Free or a trial buys Growth on the Upgrade page, inside the platform, through Stripe's Embedded Checkout. Stripe is the source of truth for a paying site's plan and status. A Stripe webhook keeps each tenant's `plan`, `status`, Stripe ids, promotion code, subscriber band and downgrade grace in step with its subscription, and sends the owner our own receipt for each paid invoice. Stripe's own customer emails stay off.

## Surfaces and routes

- `POST /api/stripe/webhook` (`apps/platform`) — public, outside the locale proxy. It verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET` with the Stripe SDK on the raw body, refusing a missing or wrong signature with 400 and changing nothing. Either secret unset answers 500 and logs `billing.webhook_secret_missing`. A handler failure answers 500 (`billing.webhook_handler_failed`) so Stripe retries; everything else answers 200.

- `/dashboard/upgrade` (`apps/platform`, owner tree) — Upgrade. The Growth note's "Ask about Growth" on Look and Sign-in links here, as the trial notice (#6874) and the grace notice (#6879) will. `?promo=<code>` applies a promotion code; `?session_id=` marks the return from Checkout.

## Behaviour

### Upgrade

- What the page shows comes from the tenant row alone (`upgradeStateFor`), in this order: Growth and not a trial → "Your site is on Growth" with a link back to Overview, for any member; a member who is not the real owner (an operator's virtual membership included) → only the owner can upgrade; an archived, suspended or deprovisioned site → unavailable until it runs again; Free or a trial → Checkout; anything else (Starter) → already on a paid plan, so nothing to upgrade here.
- Checkout is Stripe's Embedded Checkout (`ui_mode: 'embedded_page'`) mounted in a card with a Monthly/Yearly choice; switching starts a new Checkout Session. Each mount calls `createUpgradeCheckoutAction`, which re-checks the state on the server and refuses with that state's code, then creates a `subscription` session for the Growth Price its lookup key names (`PLAN_PRICE_LOOKUP_KEYS`), with Stripe Tax on (`automatic_tax`), `client_reference_id` and the session's and subscription's `metadata.tenantId` set to the tenant, and the stored customer reused (address and name kept current for tax) or the owner's sign-in email prefilled. A `?promo=` code that names an active promotion code is applied as the discount; otherwise, or without one, Checkout offers its own promotion-code field. A missing Growth Price is logged (`billing.checkout_price_missing`) and a failed Stripe call `billing.checkout_failed`; either shows "Checkout couldn't start".
- Stripe returns the owner to `/dashboard/upgrade?session_id=…`. The page never reads the session and never writes the plan: it shows "Confirming your payment" and polls `getUpgradeStateAction` every 2 s (at most 30 times, paused while the tab is hidden) until the webhook below has moved the site to Growth, then refreshes. Reloading, going back or abandoning Checkout therefore changes nothing; only the webhook does.
- The platform CSP allows Stripe.js and its frames: `script-src` and `frame-src` `https://js.stripe.com https://*.js.stripe.com`, plus `frame-src https://checkout.stripe.com https://hooks.stripe.com` (3D Secure), `connect-src https://api.stripe.com https://checkout.stripe.com` and `img-src https://*.stripe.com`.

### Webhook

- Handled events: `customer.subscription.created`, `.updated`, `.deleted`, `invoice.paid` and `invoice.payment_failed`. Each names a subscription (an invoice through `parent.subscription_details`); any other event, or an invoice outside a subscription, is answered 200 and ignored.
- The handler never trusts the event body for state: it re-reads the subscription from Stripe and derives the tenant's state from its current `status`, so a late or replayed event writes the subscription's present state, not a past one.
  - `active`, `trialing` → the subscribed plan, `ACTIVE`, and any downgrade grace ended (its start and the three grace-email stamps cleared).
  - `past_due` → the subscribed plan kept, `PAST_DUE`, following Stripe's retry schedule.
  - `canceled`, `unpaid` → `FREE`, `ACTIVE` and the band cleared; the downgrade grace starts only when the site was on a paid plan (an already-running grace keeps its start), and the daily sweep ([tenant provisioning](./tenant-provisioning.md)) runs it from there. Cancelling at period end therefore drops the site to Free when Stripe ends the subscription.
  - `incomplete`, `incomplete_expired` (a first checkout that never paid), `paused` and anything else → nothing is written, so a trial keeps its trial.
- The plan comes from the subscription items' Price lookup keys through `PLAN_PRICE_LOOKUP_KEYS` ([plans and entitlements](./plans-and-entitlements.md)): exactly one Starter or Growth plan Price, and at most one band Price, whose ceiling is stored in `subscriber_band_ceiling` (none → null, the included 1,000). The webhook never chooses a band; it records the one Stripe reports. An unknown or ambiguous set of Prices writes nothing and logs `billing.price_unknown`.
- The tenant is the one carrying the subscription's customer or subscription id (`getTenantIdByStripeIds`); with neither stored yet, the subscription's `metadata.tenantId`, which Checkout sets. Two tenants matching the two ids is logged (`billing.tenant_conflict`) and writes nothing; no tenant is logged (`billing.tenant_not_found`).
- A tenant that already stores a different subscription id ignores an event for a subscription that is no longer live (not `active`, `trialing` or `past_due`), logged `billing.subscription_superseded`: a late or retried event for a cancelled earlier subscription never undoes the current one. A new live subscription replaces the stored id.
- An archived or suspended site writes nothing (logged `billing.tenant_not_writable`). Writes, in order: `setTenantBilling` with the customer and subscription ids, the band, the grace fields, and the promotion code the subscription started with (a stored code is never replaced); then `setTenantPlan`, which re-checks the status, clears the Free-or-trial key on a move to a paid, running site, and returns the plan it replaced from the same `UPDATE`. Billing goes first so a failed billing write leaves the plan change for Stripe's retry to make.
- `recordStripeEvent` runs only after those writes succeed, so a failed write leaves the event unrecorded and Stripe's retry is processed. An event already recorded is synced again (the subscription's current state, so the tenant does not change) but triggers no follow-up.
- Follow-ups run after the response. When the plan write changed the plan — decided by that write, so the burst of events Stripe sends at checkout triggers it once — `onTenantPlanChange`, the one step every plan change runs, operator or Stripe, which today emails the owner the plan-change notice. On an `invoice.paid` event recorded for the first time, the receipt.
- The receipt (`buildOwnerReceiptEmail`, platform mail from `OWNER_EMAIL_FROM_ADDRESS` to the owner) re-reads the invoice and gives the amount paid in the invoice's currency, the payment date and the plan in the site's default language, with a "View your invoice" link to the invoice PDF (the hosted invoice page when Stripe has no PDF). An invoice that charged nothing sends no receipt. With no sender address or owner it is skipped and logged (`billing.receipt_unconfigured`, `billing.receipt_owner_missing`); a failed send is logged (`billing.receipt_failed`) and never makes Stripe retry.
- No worker step yet: a move to Growth starts the template-layer run once #5714 adds the enqueue to `onTenantPlanChange`; until then a Stripe upgrade, like an operator's, adds no template sections. Stripe secrets never go to the worker.

## Configuration

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (platform, `src/utils/stripe-env/stripe-env.ts`; required in production). `STRIPE_PUBLISHABLE_KEY` (same file, required in production) is the matching publishable key, passed from the server to the Upgrade page's Stripe.js; unset, Upgrade says it is unavailable and logs `billing.checkout_unconfigured`, as does a missing secret key or `PLATFORM_APP_BASE_URL` (Checkout's return URL). The SDK (`stripe` 23.1.0) calls the API at version `2026-10-28.endive`, and the webhook endpoint must be created at that version too: the handler reads an invoice's subscription from `invoice.parent.subscription_details`, which older versions do not send, so an older endpoint would silently write nothing and send no receipts on invoice events. The Stripe dashboard's webhook endpoint points at `https://<platform host>/api/stripe/webhook` and sends the five events above; Stripe's customer emails (receipts, failed-payment notices) are turned off there. Setting both is console work, human-gated.
- `OWNER_EMAIL_FROM_ADDRESS` and `RESEND_PLATFORM_API_KEY` for the receipt.
- Stripe Tax needs its registrations set in the Stripe dashboard, and the Growth Prices must exist with the lookup keys in `STRIPE_PRICE_LOOKUP_KEY` — console work, human-gated.
- Cost: one Stripe API read per handled event (two for `invoice.paid`), free; one Resend email per paid invoice; per Upgrade mount one Price lookup, one promotion-code lookup when `?promo=` is set, and one Checkout Session, all free. Each payment carries Stripe's fees (card processing, Billing ~0.7%, Tax ~0.5%).

## Entry points

- `apps/platform/src/app/[locale]/dashboard/(tenant)/upgrade/page.tsx` — the Upgrade route
- `apps/platform/src/components/features/upgrade/upgrade-page-content/upgrade-page-content.tsx` — `UpgradePageContent`
- `apps/platform/src/server/billing/create-upgrade-checkout-action.ts` — `createUpgradeCheckoutAction`
- `apps/platform/src/server/billing/create-growth-checkout-session.ts` — `createGrowthCheckoutSession`
- `apps/platform/src/server/billing/upgrade-state-for.ts` — `upgradeStateFor`

- `apps/platform/src/app/api/stripe/webhook/route.ts` — the route
- `apps/platform/src/server/billing/handle-stripe-event.ts` — `handleStripeEvent`
- `apps/platform/src/server/billing/sync-stripe-subscription.ts` — `syncStripeSubscription`
- `apps/platform/src/server/billing/send-payment-receipt.ts` — `sendPaymentReceipt`
- `apps/platform/src/server/tenants/on-tenant-plan-change.ts` — `onTenantPlanChange`

## Tests

- Platform, Upgrade: `upgrade-state-for.test.ts`, `create-growth-checkout-session.test.ts`, `create-upgrade-checkout-action.test.ts`, `upgrade-page-content.test.tsx`, `upgrade-checkout.test.tsx` (Stripe.js and React Stripe.js faked), `upgrade-confirming.test.tsx`, `upgrade-search-params.test.ts`, the route's `page.test.tsx`, and the Growth note's link in `growth-note.test.tsx`.
- Platform, webhook: `route.test.ts` (signed with the Stripe SDK's test header), `handle-stripe-event.test.ts`, `sync-stripe-subscription.test.ts`, `resolve-stripe-tenant.test.ts`, `send-payment-receipt.test.ts`, `plan-from-price-keys.test.ts`, `tenant-state-from-subscription.test.ts`, `grace-billing-fields.test.ts`, `subscription-id-from-event.test.ts`.
- db: `set-tenant-plan.test.ts`, `get-tenant-id-by-stripe-ids.test.ts`, `record-stripe-event.test.ts`.
- Not covered by tests: a real test-mode purchase through Embedded Checkout (test card, a `?promo=` code, tax) ending on Growth once the webhook arrives, and test-mode events from the Stripe CLI moving a tenant through Growth, `PAST_DUE`, `ACTIVE` and Free — a manual check against the dev deployment.

## Related

- #6876 — this webhook. #6877 — Upgrade through Embedded Checkout, which sets `metadata.tenantId`. #6878 — the Billing page. #5066 — where a price lives. #5714 — the Growth template layer. #6875 — the downgrade grace sweep. #7162, #7164 — readers of the band.
