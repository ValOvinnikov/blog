---
title: Billing
status: partial
layers: [db, email, platform]
code:
  - apps/platform/src/app/api/stripe/webhook/**
  - apps/platform/src/app/[locale]/dashboard/(tenant)/upgrade/**
  - apps/platform/src/components/features/upgrade/**
  - apps/platform/src/utils/upgrade-search-params/**
  - apps/platform/src/utils/plan-change-timing/**
  - apps/platform/src/constants/plan-change.ts
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

A site with no live subscription (Free, a trial, a lapsed site) buys Starter or Growth on the Upgrade page, inside the platform, through Stripe's Embedded Checkout; a paying site changes its plan or billing period on the same page by updating its one subscription. Stripe is the source of truth for a paying site's plan and status. A Stripe webhook keeps each tenant's `plan`, `status`, Stripe ids, promotion code, subscriber band and downgrade grace in step with its subscription, and sends the owner our own receipt for each paid invoice. Stripe's own customer emails stay off. The owner sees the plan, the next payment and every invoice on a Billing page inside the platform, and changes the card or cancels through Stripe's hosted Customer Portal.

## Surfaces and routes

- `POST /api/stripe/webhook` (`apps/platform`) — public, outside the locale proxy. It verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET` with the Stripe SDK on the raw body, refusing a missing or wrong signature with 400 and changing nothing. Either secret unset answers 500 and logs `billing.webhook_secret_missing`. A handler failure answers 500 (`billing.webhook_handler_failed`) so Stripe retries; everything else answers 200.
- `/dashboard/billing` (`apps/platform`) — the Billing page, for the site's real owner and a super admin only (`isBillingManager`): the sidebar's Account section links it only for them (`resolveTenantPageAccess` → `billing`), and anyone else — an editor, a moderator or another admin role — gets a 404 (`resolveGatedDashboardTenant('billing')`, the same resolver Leads uses).

## Billing page

- The header renders at once; the Stripe reads stream in under a skeleton. `PageHeader` carries **Manage billing** whenever the site has a Stripe customer.
- **Plan card:** the plan name and the tenant's status badge, and the next payment as "{amount} on {date}" (the date in a `<time>`). The next payment needs a stored subscription id: the subscription is read first, and only a live one (`active`, `trialing`, `past_due`) not set to cancel at period end is previewed with `invoices.createPreview` (dated by `next_payment_attempt`, else the invoice's date). Otherwise, or when Stripe has no upcoming invoice (`invoice_upcoming_none`), it reads "None scheduled". A failed preview also reads "None scheduled", keeps the invoice list, and logs `billing.next_payment_failed`.
- **Invoices table:** every finalised invoice for the customer, newest first (`invoices.list` at Stripe's page size of 100, so one request lists eight years of monthly invoices): date, total in the invoice's currency (zero-decimal currencies formatted by their own minor units), status (Paid, Due, Unpaid, Cancelled) and a "View invoice" link to `invoice_pdf`, or the hosted invoice page when there is no PDF; its accessible name adds the date and amount, since a proration invoice can share a regular one's date. Drafts are left out.
- **No Stripe customer** (a trial, or Free that never paid): the plan card shows the plan and "Your site has no payments yet." and no table.
- The plan card's footer links to Upgrade: "Change plan" for a site with a live subscription (`hasStoredSubscription`), "Upgrade" (Checkout) for any other.
- **Stripe unreachable or unconfigured:** an error notice in place of the cards when the invoice list cannot be read, logged `billing.overview_failed` or `billing.stripe_unconfigured`.
- **Manage billing** (`openBillingPortalAction`) re-checks the caller with `requireTenantOwnerOrAdmin(tenantId, isSuperAdmin)` — the real owner or a super admin, any other caller 404s — creates a Customer Portal session for the stored customer with `return_url` `PLATFORM_APP_BASE_URL` + `/dashboard/billing`, and redirects to it. No customer, or an id that is not a site → refused (`NO_CUSTOMER`); no key or base URL, or a failed session → a toast, logged `billing.stripe_unconfigured` / `billing.portal_failed`. The Portal's features (payment method, cancellation) and branding are set in the Stripe dashboard.
- Cost: per Billing page view, one Stripe read for the invoices plus two (the subscription, then the preview) for a site with a live subscription; one per Manage billing click; free.

- `/dashboard/upgrade` (`apps/platform`, owner tree) — Upgrade. The Growth note's "Ask about Growth" on Look and Sign-in links here. `?promo=<code>` applies a promotion code; `?session_id=` marks the return from Checkout.

## Behaviour

### Upgrade

- What the page shows comes from the tenant row alone (`upgradeStateFor`), in this order, and never from a plan name: a live subscription (a stored subscription id on a plan in `SELLABLE_TENANT_PLANS`; the webhook keeps a cancelled subscription's id and moves the site to Free) → the plan change below for the real owner of a running site (`planChangeRefusalFor`), and "Your site is on {plan}" with a link back to Overview for any other member; a member who is not the real owner (an operator's virtual membership included) → only the owner can upgrade; an archived, suspended or deprovisioned site → unavailable until it runs again; anything else → Checkout. Trial → Starter, trial → Growth and Free → either are the same flow. A paying site never sees Checkout, and a trial or Free site never sees the plan change. The Growth note's "Ask about Growth" therefore reaches the plan change on a paying site.
- The platform loads a tenant once with its trial state: `requireTenantMembership`, `resolveDashboardTenant` and `requireTenantById` return `toPlatformTenant(tenant)`, which adds `trial` from `trialFor`, and consumers read `tenant.trial`. The webhook, the worker and `apps/web` keep raw rows.
- Checkout is Stripe's Embedded Checkout (`ui_mode: 'embedded_page'`) mounted in a card with a plan choice (`SELLABLE_TENANT_PLANS` from `@blog/config`: Starter, Growth; a trial's own plan, else Growth, is preselected) and a Monthly/Yearly choice; switching either, or Try again after a failure, starts a new Checkout Session. Each mount calls `createUpgradeCheckoutAction`, which re-checks the state on the server and refuses with that state's code, validates the plan against `SELLABLE_TENANT_PLANS` (anything else, Free included, is `INVALID`), then:
  - gives the site one Stripe customer (`ensureStripeCustomer`): the stored `stripeCustomerId`, or a new one created with the idempotency key `tenant-customer-<tenantId>` (so two tabs racing for the first checkout get the same customer), prefilled with the owner's sign-in email and stored with `setTenantBilling` before any session exists. A stored customer that Stripe has deleted or does not know is replaced by a new one, keyed `tenant-customer-<tenantId>-<old customer id>`, stored the same way and logged (`billing.checkout_customer_replaced`);
  - refuses with `PAYMENT_PENDING` when Stripe already has a live subscription for that customer (`active`, `trialing`, `past_due`), so a slow webhook never lets a second payment through, and expires the customer's other `open` Checkout Sessions so only the newest can be paid. Two tabs that load within the same few hundred milliseconds can each create a session after the other's expire step, so both stay payable; the window is narrow and accepted. `incomplete` is not counted as live, so a delayed payment method (SEPA, ACH) still pending is not refused — to be confirmed against a test-mode delayed payment;
  - creates a `subscription` session for the chosen plan's Price, the lookup key `PLAN_PRICE_LOOKUP_KEYS[plan]` names for the period, with Stripe Tax on (`automatic_tax`), the customer's address and name kept current for tax, and `client_reference_id` and the session's and subscription's `metadata.tenantId` set to the tenant.
- A `?promo=` code that names an active promotion code is applied as the discount; otherwise, or without one, Checkout offers its own promotion-code field. When the code lookup fails, or Stripe refuses the code at session create (first-time-only, another customer's, a minimum or a product scope), the session is created again with the code field instead and `billing.checkout_promo_refused` is logged with the code. A missing Price is logged (`billing.checkout_price_missing`, with the plan and period), a failed Stripe call or a session without a client secret `billing.checkout_failed`; each shows "Checkout couldn't start." with Try again. A refusal shows its reason in a status message and no retry.
- Stripe returns the owner to `/dashboard/upgrade?session_id=…`. The page never reads the session and never writes the plan: it shows "Confirming your payment" and polls `getUpgradeStateAction` every 2 s (at most 30 checks, paused while the tab is hidden; a check in flight when the tab hides is dropped but still counts) until the webhook below has stored the live subscription. One status region carries every state: it reads "Your payment is confirmed" the moment the poll sees it, then the page refreshes; when `usePolledValue` reports it is out of checks, or one fails, it reads "This is taking longer than usual" with Check again, which refreshes and restarts the checks. Reloading, going back or abandoning Checkout therefore changes nothing; only the webhook does.
- The platform CSP allows Stripe.js and its frames: `script-src` and `frame-src` `https://js.stripe.com https://*.js.stripe.com`, plus `frame-src https://checkout.stripe.com https://hooks.stripe.com` (3D Secure), `connect-src https://api.stripe.com https://checkout.stripe.com` and `img-src https://*.stripe.com`.

### Plan change

- A paying site's owner picks a plan and a billing period with the same choice Checkout uses (`PlanChoices`). `PlanChangeSection` first reads the subscription from Stripe (`readTenantSubscriptionPlan` → `loadSubscriptionPlan`, one read expanding `schedule.phases.items.price`): its plan and period from the plan item's lookup key, its band, its renewal date (the plan item's `current_period_end`) and any change already planned. A subscription that is not `active` or `trialing`, or is set to cancel at period end, gets a note pointing at Billing instead (`NOT_ACTIVE`). A failed read shows "Your plan couldn't be loaded" and logs `billing.stripe_unconfigured`, `billing.price_unknown` or `billing.plan_change_load_failed`.
- Which way a change goes comes from rank, never a plan's name (`planChangeTiming`): plans by their key order in `PLAN_ENTITLEMENTS`, periods by `BILLING_INTERVAL` order (monthly, then yearly). A move to a shorter period always waits for renewal, even when the plan moves up (owner decision on #7333: a paid year is never turned into Stripe credit). Otherwise a later plan, or the same plan on a longer period, is a move up and anything else a move down. The card says which before the owner confirms.
- `changePlanAction` re-checks the gate on the server (`NOT_SUBSCRIBED`, `NOT_OWNER`, `UNAVAILABLE`), validates the plan and period, re-reads the subscription, and then (`changeSubscriptionPlan`):
  - **move up** → `subscriptions.update` on the same subscription, swapping the plan item's Price (and a band item's Price for the new period), with `proration_behavior: 'always_invoice'` and `payment_behavior: 'error_if_incomplete'`: Stripe charges the prorated difference now, and a failed payment (a card error or any 402) leaves the subscription, and any planned change, as it was (`CARD_DECLINED`). A planned change is released only after the update succeeds. A monthly → yearly move restarts the billing period, as Stripe does for any period change;
  - **move down** → a subscription schedule on the same subscription (any planned change released right before `subscriptionSchedules.create` from it, then `update`): the current phase keeps today's items to the period end, and the next phase holds the new Price for one period, then the schedule releases. Discounts and automatic tax carry into both phases. A band item stays only when the new plan has that band, for the new period;
  - the same plan and period while a change is planned → the schedule is released, which cancels the planned change ("Keep {plan}"); with nothing planned → `UNCHANGED`. At most one change is ever pending. Releasing a schedule that is already released, cancelled or completed counts as done, and a create refused because another tab already planned a change releases that one and creates again, so a double submit ends in the same state. The button is disabled while a change is in flight or confirming.
- A missing target Price is logged (`billing.plan_change_price_missing`), any other Stripe failure `billing.plan_change_failed`; both show "Your plan couldn't be changed."
- Nothing in the flow writes the plan. A move up that changes the plan waits for the webhook the way the Checkout return does: it polls `getTenantPlanAction` every 2 s (at most 30 checks) until the tenant row carries the new plan, then refreshes; out of checks, or a failed check, it offers Check again. A period-only move up and a move down refresh at once, and the page then shows the period Stripe reports or the planned change ("Your site moves to {plan} … on {date}"). At renewal Stripe moves the subscription to the next phase and the webhook syncs the plan as for any other update.
- Cost: per Upgrade view of a paying site one Stripe read; per change one read plus one price lookup and one update (a move down: a create and an update on the schedule; a planned change adds a release), all free.

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
- Stripe Tax needs its registrations set in the Stripe dashboard, and the Starter and Growth Prices must exist with the lookup keys in `STRIPE_PRICE_LOOKUP_KEY` and carry no trial period, so a trial owner pays at checkout — console work, human-gated.
- Cost: one Stripe API read per handled event (two for `invoice.paid`), free; one Resend email per paid invoice; per Upgrade mount a customer read or create, a subscription and an open-session list (plus an expire per open session), one Price lookup, one promotion-code lookup when `?promo=` is set, and one Checkout Session (two when Stripe refuses the code), all free. Each payment carries Stripe's fees (card processing, Billing ~0.7%, Tax ~0.5%).

## Entry points

- `apps/platform/src/app/[locale]/dashboard/(tenant)/upgrade/page.tsx` — the Upgrade route
- `apps/platform/src/components/features/upgrade/upgrade-page-content/upgrade-page-content.tsx` — `UpgradePageContent`
- `apps/platform/src/server/billing/create-upgrade-checkout-action.ts` — `createUpgradeCheckoutAction`
- `apps/platform/src/server/billing/create-plan-checkout-session.ts` — `createPlanCheckoutSession`
- `apps/platform/src/utils/platform-tenant/platform-tenant.ts` — `toPlatformTenant`
- `apps/platform/src/server/billing/ensure-stripe-customer.ts` — `ensureStripeCustomer`
- `apps/platform/src/server/billing/prepare-customer-checkout.ts` — `hasLiveSubscription`, `expireOpenCheckouts`
- `apps/platform/src/server/billing/upgrade-state-for.ts` — `upgradeStateFor`, `planChangeRefusalFor`
- `apps/platform/src/server/billing/change-plan-action.ts` — `changePlanAction`
- `apps/platform/src/server/billing/change-subscription-plan.ts` — `changeSubscriptionPlan`
- `apps/platform/src/server/billing/load-subscription-plan.ts` — `loadSubscriptionPlan`
- `apps/platform/src/components/features/upgrade/plan-change/plan-change.tsx` — `PlanChange`

- `apps/platform/src/app/api/stripe/webhook/route.ts` — the route
- `apps/platform/src/server/billing/handle-stripe-event.ts` — `handleStripeEvent`
- `apps/platform/src/server/billing/sync-stripe-subscription.ts` — `syncStripeSubscription`
- `apps/platform/src/server/billing/send-payment-receipt.ts` — `sendPaymentReceipt`
- `apps/platform/src/server/tenants/on-tenant-plan-change.ts` — `onTenantPlanChange`
- `apps/platform/src/server/billing/load-billing-overview.ts` — `loadBillingOverview`, the Billing page's Stripe reads
- `apps/platform/src/server/billing/open-billing-portal-action.ts` — `openBillingPortalAction`

## Tests

- Platform, Upgrade: `upgrade-state-for.test.ts`, `ensure-stripe-customer.test.ts`, `prepare-customer-checkout.test.ts`, `create-plan-checkout-session.test.ts` (each plan and period), `create-upgrade-checkout-action.test.ts` (a Free and a trial owner each buying Starter and Growth, monthly and yearly), `platform-tenant.test.ts`, `upgrade-page-content.test.tsx`, `upgrade-checkout.test.tsx` (Stripe.js and React Stripe.js faked), `upgrade-confirming.test.tsx`, `upgrade-search-params.test.ts`, the route's `page.test.tsx`, and the Growth note's link in `growth-note.test.tsx`.
- Platform, plan change: `plan-change-timing.test.ts`, `load-subscription-plan.test.ts`, `change-subscription-plan.test.ts` (Starter → Growth now and Growth → Starter at renewal on one subscription, monthly ↔ yearly, bands, a planned change kept or replaced), `change-plan-action.test.ts`, `read-tenant-subscription-plan.test.ts`, `plan-change.test.tsx`, `plan-change-section.test.tsx`.
- Platform, webhook and Billing page: `route.test.ts` (signed with the Stripe SDK's test header), `handle-stripe-event.test.ts`, `sync-stripe-subscription.test.ts`, `resolve-stripe-tenant.test.ts`, `send-payment-receipt.test.ts`, `plan-from-price-keys.test.ts`, `tenant-state-from-subscription.test.ts`, `grace-billing-fields.test.ts`, `subscription-id-from-event.test.ts`, `fetch-stripe-billing.test.ts`, `load-billing-overview.test.ts`, `open-billing-portal-action.test.ts`, `resolve-gated-dashboard-tenant.test.ts`, `resolve-tenant-page-access.test.ts`, and the `plan-card`, `invoices-table` and `manage-billing-button` component tests.
- db: `set-tenant-plan.test.ts`, `get-tenant-id-by-stripe-ids.test.ts`, `record-stripe-event.test.ts`.
- Not covered by tests: an owner of a paying test-mode tenant opening every invoice PDF, and Manage billing opening the Portal and returning to the page (#6883); a test-mode plan change (Starter → Growth paying the proration, Growth → Starter at a test clock's renewal, a 3-D Secure test card on a move up reaching `CARD_DECLINED`, and the Customer Portal's cancel on a subscription with a schedule attached); a real test-mode purchase through Embedded Checkout (test card, a `?promo=` code, tax) ending on the chosen plan once the webhook arrives, and test-mode events from the Stripe CLI moving a tenant through Growth, `PAST_DUE`, `ACTIVE` and Free — a manual check against the dev deployment.

## Related

- #6876 — this webhook. #6877 — Upgrade through Embedded Checkout, plan and period chosen, which sets `metadata.tenantId`. #6878 — the Billing page. #7333 — a paying site changes plan. #5066 — where a price lives. #5714 — the Growth template layer. #6875 — the downgrade grace sweep. #7162, #7164 — readers of the band.
