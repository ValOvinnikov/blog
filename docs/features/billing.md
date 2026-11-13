---
title: Billing
status: partial
layers: [db, email, platform]
code:
  - apps/platform/src/app/api/stripe/webhook/**
  - apps/platform/src/app/[locale]/dashboard/(tenant)/billing/**
  - apps/platform/src/components/features/billing/**
  - apps/platform/src/server/billing/**
  - apps/platform/src/server/tenants/on-tenant-plan-change.ts
  - apps/platform/src/constants/billing.ts
  - apps/platform/src/utils/stripe-env/**
  - apps/platform/src/utils/format-stripe-amount/**
  - apps/platform/src/utils/invoice-status-tone/**
  - apps/platform/src/server/auth/resolve-gated-dashboard-tenant.ts
  - packages/db/src/queries/tenants/set-tenant-plan/**
  - packages/db/src/queries/tenants/get-tenant-id-by-stripe-ids/**
  - packages/db/src/queries/stripe-webhook-events/**
  - packages/email/src/templates/owner/owner-receipt/**
epics: [4840]
---

# Billing

## What it does

Stripe is the source of truth for a paying site's plan and status. A Stripe webhook keeps each tenant's `plan`, `status`, Stripe ids, promotion code, subscriber band and downgrade grace in step with its subscription, and sends the owner our own receipt for each paid invoice. Stripe's own customer emails stay off. The owner sees the plan, the next payment and every invoice on a Billing page inside the platform, and changes the card or cancels through Stripe's hosted Customer Portal.

## Surfaces and routes

- `POST /api/stripe/webhook` (`apps/platform`) — public, outside the locale proxy. It verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET` with the Stripe SDK on the raw body, refusing a missing or wrong signature with 400 and changing nothing. Either secret unset answers 500 and logs `billing.webhook_secret_missing`. A handler failure answers 500 (`billing.webhook_handler_failed`) so Stripe retries; everything else answers 200.
- `/dashboard/billing` (`apps/platform`) — the Billing page, for the site's real owner and a super admin only (`isBillingManager`): the sidebar's Account section links it only for them (`resolveTenantPageAccess` → `billing`), and anyone else — an editor, a moderator or another admin role — gets a 404 (`resolveGatedDashboardTenant('billing')`, the same resolver Leads uses).

## Billing page

- The header renders at once; the Stripe reads stream in under a skeleton. `PageHeader` carries **Manage billing** whenever the site has a Stripe customer.
- **Plan card:** the plan name and the tenant's status badge, and the next payment as "{amount} on {date}" (the date in a `<time>`). The next payment needs a stored subscription id: the subscription is read first, and only a live one (`active`, `trialing`, `past_due`) not set to cancel at period end is previewed with `invoices.createPreview` (dated by `next_payment_attempt`, else the invoice's date). Otherwise, or when Stripe has no upcoming invoice (`invoice_upcoming_none`), it reads "None scheduled". A failed preview also reads "None scheduled", keeps the invoice list, and logs `billing.next_payment_failed`.
- **Invoices table:** every finalised invoice for the customer, newest first (`invoices.list` at Stripe's page size of 100, so one request lists eight years of monthly invoices): date, total in the invoice's currency (zero-decimal currencies formatted by their own minor units), status (Paid, Due, Unpaid, Cancelled) and a "View invoice" link to `invoice_pdf`, or the hosted invoice page when there is no PDF; its accessible name adds the date and amount, since a proration invoice can share a regular one's date. Drafts are left out.
- **No Stripe customer** (a trial, or Free that never paid): the plan card shows the plan and "Your site has no payments yet." and no table. The Upgrade action is not on the page yet: Embedded Checkout (#6877) adds it.
- **Stripe unreachable or unconfigured:** an error notice in place of the cards when the invoice list cannot be read, logged `billing.overview_failed` or `billing.stripe_unconfigured`.
- **Manage billing** (`openBillingPortalAction`) re-checks the caller with `requireTenantOwnerOrAdmin(tenantId, isSuperAdmin)` — the real owner or a super admin, any other caller 404s — creates a Customer Portal session for the stored customer with `return_url` `PLATFORM_APP_BASE_URL` + `/dashboard/billing`, and redirects to it. No customer, or an id that is not a site → refused (`NO_CUSTOMER`); no key or base URL, or a failed session → a toast, logged `billing.stripe_unconfigured` / `billing.portal_failed`. The Portal's features (payment method, cancellation) and branding are set in the Stripe dashboard.
- Cost: per Billing page view, one Stripe read for the invoices plus two (the subscription, then the preview) for a site with a live subscription; one per Manage billing click; free.

## Behaviour

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

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (platform, `src/utils/stripe-env/stripe-env.ts`; required in production). The SDK (`stripe` 23.1.0) calls the API at version `2026-10-28.endive`, and the webhook endpoint must be created at that version too: the handler reads an invoice's subscription from `invoice.parent.subscription_details`, which older versions do not send, so an older endpoint would silently write nothing and send no receipts on invoice events. The Stripe dashboard's webhook endpoint points at `https://<platform host>/api/stripe/webhook` and sends the five events above; Stripe's customer emails (receipts, failed-payment notices) are turned off there. Setting both is console work, human-gated.
- `OWNER_EMAIL_FROM_ADDRESS` and `RESEND_PLATFORM_API_KEY` for the receipt.
- Cost: one Stripe API read per handled event (two for `invoice.paid`), free; one Resend email per paid invoice.

## Entry points

- `apps/platform/src/app/api/stripe/webhook/route.ts` — the route
- `apps/platform/src/server/billing/handle-stripe-event.ts` — `handleStripeEvent`
- `apps/platform/src/server/billing/sync-stripe-subscription.ts` — `syncStripeSubscription`
- `apps/platform/src/server/billing/send-payment-receipt.ts` — `sendPaymentReceipt`
- `apps/platform/src/server/tenants/on-tenant-plan-change.ts` — `onTenantPlanChange`
- `apps/platform/src/server/billing/load-billing-overview.ts` — `loadBillingOverview`, the Billing page's Stripe reads
- `apps/platform/src/server/billing/open-billing-portal-action.ts` — `openBillingPortalAction`

## Tests

- Platform: `route.test.ts` (signed with the Stripe SDK's test header), `handle-stripe-event.test.ts`, `sync-stripe-subscription.test.ts`, `resolve-stripe-tenant.test.ts`, `send-payment-receipt.test.ts`, `plan-from-price-keys.test.ts`, `tenant-state-from-subscription.test.ts`, `grace-billing-fields.test.ts`, `subscription-id-from-event.test.ts`, `fetch-stripe-billing.test.ts`, `load-billing-overview.test.ts`, `open-billing-portal-action.test.ts`, `resolve-gated-dashboard-tenant.test.ts`, `resolve-tenant-page-access.test.ts`, and the `plan-card`, `invoices-table` and `manage-billing-button` component tests.
- db: `set-tenant-plan.test.ts`, `get-tenant-id-by-stripe-ids.test.ts`, `record-stripe-event.test.ts`.
- Not covered by tests: an owner of a paying test-mode tenant opening every invoice PDF, and Manage billing opening the Portal and returning to the page — manual checks against the dev deployment (#6883). Test-mode events from the Stripe CLI moving a tenant through Growth, `PAST_DUE`, `ACTIVE` and Free — a manual check against the dev deployment.

## Related

- #6876 — this webhook. #6878 — the Billing page. #5066 — Checkout, which sets `metadata.tenantId`. #5714 — the Growth template layer. #6875 — the downgrade grace sweep. #7162, #7164 — readers of the band.
