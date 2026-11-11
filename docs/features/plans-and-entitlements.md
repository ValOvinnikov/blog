---
title: Plans and entitlements
status: partial
layers: [config, db, studio, web, platform]
code:
  - packages/db/src/constants/tenant.ts
  - packages/db/src/constants/look.ts
  - packages/db/src/utils/effective-look/**
  - packages/config/src/constants/capability.ts
  - packages/db/src/schema/settings-features.ts
  - packages/db/src/queries/settings-features/**
  - packages/db/src/queries/membership-invites/create-membership-invite/**
  - packages/db/src/constants/billing.ts
  - packages/db/src/queries/tenants/get-tenant-billing/**
  - packages/db/src/queries/tenants/set-tenant-billing/**
  - packages/db/src/queries/stripe-webhook-events/**
  - apps/platform/src/utils/plan-page-access/**
  - apps/platform/src/utils/settings-features-fields/**
  - apps/platform/src/server/settings-features/**
  - apps/platform/src/server/tenant-pages/**
  - apps/platform/src/server/tenants/notify-owner-of-plan-change.ts
  - packages/email/src/templates/owner/owner-plan-change/**
  - apps/platform/src/components/features/capabilities/**
  - apps/web/src/server/settings-features/**
  - apps/web/src/utils/to-effective-settings-features/**
  - apps/web/src/modules/module-renderer.tsx
  - apps/web/src/modules/module-gate/**
  - packages/config/src/constants/module-pack.ts
  - packages/studio/src/schema-types/inputs/requirement-warning-input/**
  - packages/studio/src/schema-types/validation/validate-modules-entitled/**
  - packages/studio/src/schema-types/filters/entitled-module.ts
epics: [4840, 2798, 4083, 3667]
---

# Plans and entitlements

## What it does

Every tenant is on one plan, `FREE`, `STARTER` or `GROWTH`, which an operator sets. The plan is a ceiling: it decides which reader-facing capabilities the site may switch on, how many languages it serves, and which tenant pages the owner sees in the platform. Inside that ceiling the owner switches each capability on or off on the Features page, and the site shows a capability only when both the plan and the toggle allow it. There is no billing, trial or self-serve plan change; the plan is a column an operator edits.

## Surfaces and routes

- **Platform, operator** — the plan picker in the Add tenant form and the tenant details panel; the plan shows in the tenants table and on the owner's home card.
- **Owner email** — a saved plan change emails the owner once (see Configuration).
- **Platform, Features page** — `/dashboard/features` (owner) and `/tenants/{id}/features` (operator). Six capability rows: Reader accounts is the main switch, with Bookmarks indented under it and disabled while it is off. Comments and Ratings have no row on any plan, for the owner or the operator (`SHOWN_CAPABILITY_TOGGLES`): ratings are dropped and comments are hidden until built. A "Coming soon" row has no switch, and a row outside the plan is locked with a badge naming the cheapest plan that holds it (`lowestPlanWithCapability`): "Starter plan" for the contact form on Free, "Growth plan" for the rest. While Reader accounts is off, a note says nobody new can sign in.
- **Platform, plan-gated pages** — `/dashboard/languages` and `/dashboard/email` answer 404 when the plan does not open them. Subscribers and Team are sidebar entries with a "Coming soon" badge and no page; the sidebar has no Comments entry.
- **Platform, Sign-in page** — `/dashboard/sign-in` (owner) and `/tenants/{id}/sign-in` (operator, read-only), right after Domain in the Configuration menu on every plan. One card per provider (Google, then GitHub) with its status pill ("Shared app" or "Your own app") and the exact callback address, `https://<main address>/api/auth/callback/<provider>`, with Copy. A Growth owner adds, replaces and removes a client ID and secret per provider; a Free or Starter site's owner sees the Growth note above two locked rows, whose "See what's included" lists your own Google app and your own GitHub app as plain items; the operator view shows no note.
- **Public site** — no route of its own. It gates `/bookmarks` (404 unless Reader accounts and Bookmarks are both on) and `/account` (404 there only to a signed-out visitor on a site with Reader accounts off), the header account menu, the bookmark button, the newsletter module and its server action, Vercel Analytics and Speed Insights, and the consent banner. A page renders only the module types its tenant's plan entitles.
- **Studio** — a module type whose capability is off is relabelled "(off in Features)" in pickers, and its documents carry a warning; `module_newsletter` and `module_contactForm` map to a capability. Given module-pack entitlements, a module type outside them shows as unavailable in a page's module picker: every plan's "Add item…" menu is the same picker — search, the All and kind tabs, the same rows, icons and order, each row titled in bold with its module's own title — with the module disabled in its usual place and a badge naming its pack's plan ("Starter" for the contact form, "Growth" for the rest) at the right of its row, while the per-row "Add item before/after" menus (Sanity's own, which can't be replaced) list it last with a lock and a "— Starter plan" or "— Growth plan" title. It offers no existing document to pick there, and can't be created new from the desk, the global Create menu or a reference's "Create new"; its existing documents stay listed and editable, with a banner, and a page referencing one shows a warning on that item that never blocks publishing. When a type is both off-plan and off in Features, the plan message shows.

## Data

- `tenants.plan` — required, the `tenant_plan` pgEnum built from `TENANT_PLAN`.
- `PLAN_REGISTRY` (`@blog/db/constants`) — `FREE`: `CONSENT_BANNER`. `STARTER`: `CONSENT_BANNER` and `CONTACT_FORM`. `GROWTH`: all eight `CAPABILITY` keys (`READER_ACCOUNTS`, `COMMENTS`, `RATINGS`, `BOOKMARKS`, `NEWSLETTER`, `ANALYTICS`, `CONSENT_BANNER`, `CONTACT_FORM`). Ratings is Growth only because rating needs sign-in.
- `PLAN_LOCALE_LIMIT` — languages per plan including the default: `FREE` 1, `STARTER` 1, `GROWTH` 3.
- `PLAN_MONTHLY_SENDS_PER_SUBSCRIBER` and `SUBSCRIBER_BAND_CEILINGS` (1,000, 2,500, 5,000, 10,000, 25,000) — the monthly newsletter allowance: `FREE` 0, `STARTER` 0, `GROWTH` 6 × the ceiling of the band the active-subscriber count falls in, or 6 × the count above 25,000. `monthlySendAllowance(plan, activeSubscriberCount)` applies it.
- `PLAN_ENTITLEMENTS` (`@blog/db/constants`) — one record per plan. `lookFields` lists the `site_config` Look columns (`LOOK_FIELDS`) the plan may set: `FREE` and `STARTER` the preset, accent hue, logo, favicon and Cookie settings button; `GROWTH` every Look column. `modulePacks` lists the module packs the plan entitles: `FREE` `CORE`; `STARTER` `CORE` and `STARTER`; `GROWTH` all three. `hasPoweredByMark` says whether the site's footer carries the "Powered by" mark: `FREE` yes, `STARTER` and `GROWTH` no (see [footer-and-legal-pages](./footer-and-legal-pages.md)). `hasCustomDomain` says whether the owner may connect their own domain and make it the main address: `FREE` no, `STARTER` and `GROWTH` yes; the Domain page's card and the connect, verify and make-main actions read it, and none compares against a plan name. `hasOwnOAuthApps` says whether the site signs readers in through its own Google and GitHub apps when it has saved credentials for them: `FREE` and `STARTER` no, `GROWTH` yes (see [reader-auth](./reader-auth.md)). `seats` is how many people the site may have in its team, counting the owner, every membership and every pending invite: `FREE` 1, `STARTER` 1, `GROWTH` 3. The epic's later entitlements join this record as fields of their own.
- `tenant_oauth_credentials` — one row per tenant and provider: `client_id`, the secret encrypted under `TENANT_OAUTH_ENCRYPTION_KEY`, and nullable `callback_domain`, the main address the owner last registered (null reads as the current one). Saving a card, or "I've added it", sets it to the current main address.
- `settings_features` — one row per tenant (unique `tenant_id`, cascade delete), eight `NOT NULL` boolean toggles. Provisioning writes no row; an absent row resolves to the tenant's current preset's `featureDefaults` (both presets: bookmarks and contact form on; reader accounts, comments, ratings, newsletter, analytics and consent banner off). The column defaults match.
- `MODULE_PACK` (`CORE`, `STARTER`, `GROWTH`) and `MODULE_PACK_BY_TYPE` (`@blog/config/constants`) give every module `_type` exactly one pack; the map `satisfies Record<TModuleType, TModulePack>`, so a new module type fails type-check until it has one. Core: the three heroes, the five Posts modules, content, FAQ, embed, section pages, CTA, newsletter and cookie settings. Starter: contact form. Growth: testimonial, team, logo wall, stats, pricing, feature list, feature highlights and timeline. `isModuleTypeEntitled(type, packs)` is the one check; an unknown type is never entitled.
- `PLAN_PRICE_LOOKUP_KEYS` (`@blog/db/constants`) — each plan's Stripe Price lookup keys, never Price ids or amounts: `FREE` none; `STARTER` `STARTER_MONTHLY` and `STARTER_YEARLY`; `GROWTH` `GROWTH_MONTHLY`, `GROWTH_YEARLY` and one key per paid subscriber band above the included 1,000 (`GROWTH_BAND_2500`, `_5000`, `_10000`, `_25000`), keyed by the band's ceiling from `SUBSCRIBER_BAND_CEILINGS`. A key names the same Price in Stripe's test and live modes, and each Price carries dollars, euros and pounds as currency options; the amounts live only in Stripe, and a price change moves the key to a new Price with no deploy. The record is `Record<TTenantPlan, …>`, so a new plan fails type-check until it has its keys. Nothing reads it yet.
- Billing state on `tenants`, all nullable: `stripe_customer_id` and `stripe_subscription_id` (each unique), `stripe_promotion_code` (the code the subscription started with, for campaign attribution), `trial_ends_at`, `downgrade_grace_started_at`, and one sent-at stamp per grace email (`grace_started_email_sent_at`, `grace_halfway_email_sent_at`, `grace_ending_email_sent_at`). `getTenantBilling` and `setTenantBilling` read and write them; in a write, a field left out keeps its value and `null` clears it.
- `stripe_webhook_events` — one row per handled Stripe event id (`event_id` primary key, `handled_at`). `recordStripeEvent(eventId)` returns `RECORDED` the first time and `ALREADY_HANDLED` for a redelivered or replayed id, so of two concurrent deliveries exactly one is recorded.
- **Caching (web)** — `getTenantPlan` and `getEffectiveSettingsFeatures` are `unstable_cache` per tenant, tagged `tenant-plan:<id>` and `settings-features:<id>`, with `TENANT_CONFIG_REVALIDATE_SECONDS` (3600) as the fallback. `POST /api/revalidate-site-config` expires both tags with `site-config:<id>` and purges the whole layout. The platform and Studio read `tenants.plan` uncached on every request.

## Configuration

- **Operator** (any `admins` row) sets the plan through `createTenantAction` and `updateTenantDetailsAction`, both behind `requireAdmin`. The plan stays editable in the tenant details panel once provisioning has succeeded, and locks only while provisioning is running and on an archived tenant. A change applies on the site's next page load and deletes no stored data; a downgrade only hides what the new plan does not hold.
- **Plan change email** — when `updateTenantDetailsAction` saves a plan that differs from the stored one, `notifyOwnerOfPlanChange(tenantId, fromPlan, toPlan)` runs in `after()`, once the response has gone, and emails the owner through `@blog/email`'s `buildOwnerPlanChangeEmail`: the notice for the new plan, worded to read right whichever plan it came from, with an "Open your dashboard" button to the tenant's dashboard. The copy is fixed platform copy (never Voice), in the `ownerPlanChangeEmail` namespace of the platform's message catalogues, written in the site's default language (`tenants.locale`). It goes to `getTenantOwnerEmail`, which is the pending owner-invite address until the owner joins, from `OWNER_EMAIL_FROM_ADDRESS`. With no sender address or `PLATFORM_APP_BASE_URL` it is skipped and logged (`tenants.plan_change_email_unconfigured`); with no owner address too (`tenants.plan_change_email_owner_missing`). A failed send is logged (`tenants.plan_change_email_failed`) and never fails or undoes the save.
- **Owner or operator** saves Features through `updateFeaturesAction`, behind `requireTenantMembership` (any member; an operator gets a virtual owner membership).
- **Coming soon** — `COMMENTS`, `RATINGS` and `NEWSLETTER` carry `isComingSoon` in `CAPABILITY_TOGGLES`, and the save writes them off whatever the payload says. Only `NEWSLETTER` is shown, with a "Coming soon" badge and no switch; `COMMENTS` and `RATINGS` are left out of `SHOWN_CAPABILITY_TOGGLES`, and their stored toggles and columns stay. An owner can switch `READER_ACCOUNTS`, `BOOKMARKS`, `ANALYTICS`, `CONSENT_BANNER` and `CONTACT_FORM` on `GROWTH`, `CONSENT_BANNER` and `CONTACT_FORM` on `STARTER`, and only `CONSENT_BANNER` on `FREE`.
- **Reader accounts** — `BOOKMARKS`, `COMMENTS` and `RATINGS` carry `parentField: 'readerAccountsEnabled'` in `CAPABILITY_TOGGLES`. While the parent is off, a sub-item can be saved off but never on (`blockSwitchOnWhileParentOff`), so its stored value comes back when the parent is switched on again, and `getEnabledCapabilities` reports it off (`withParentOffApplied`). Look's account options and the public site's sign-in both follow `READER_ACCOUNTS`, and on the public site a sub-item applies only while it is on (`isReaderAccountFeatureEnabled`).
- **Plan page access** (`planPageAccess`) — Languages when `PLAN_LOCALE_LIMIT` > 1; Email when the plan holds bookmarks, comments, newsletter or contact form; Subscribers with newsletter; Team on `GROWTH` only, the one plan with more than one seat. The owner's sidebar omits the rest and their pages 404; the operator's `/tenants/{id}` view shows every entry and page whatever the plan.
- **Look** — fields outside `lookFields` show locked on the Look page with a Growth badge beside the label, at the preset's value, focusable and announced as unavailable (see [look](./look.md)). On a plan with locked fields (`FREE` and `STARTER`) the owner also sees the Growth note, and the reset-to-preset action is hidden; the note's "See what's included" lists what Growth adds on the page.
- **Module packs in Studio** — `StudioMount` takes an optional plain-data `entitlements` object whose `modulePacks` lists the entitled packs. Omitted, every pack is entitled: the site is the enforcement point, and the Sanity CLI Studio has no tenant. The platform's `StudioMountView` passes the tenant plan's `PLAN_ENTITLEMENTS` `modulePacks`, read on every load, so the owner's `/dashboard` Studio and the operator's `/tenants/{id}` Studio both follow the current plan.
- **Module packs on the site** — `renderModules` wraps each module in `ModuleGate`, and `renderHeroModule` runs the same check: `isModuleEntitled` reads `getRequestContext().tenantId` and the cached `getTenantPlan`, once per request, and renders a module only when `isModuleTypeEntitled` passes for the plan's `modulePacks`. A skipped module renders nothing, and its component never runs, so its data is never fetched. With no tenant (the local and dev platform fallback) every module renders. A downgrade deletes no content; an upgrade shows the modules again once the plan cache refreshes.
- **Powered-by mark** — `SiteFooter` draws `Footer.PoweredBy` when `getPoweredByMark` finds the plan's `hasPoweredByMark` set. It reads the plan through `getEffectivePlan`, the cached `getTenantPlan` with Free's rules when the plan cannot be read (`site_config.plan_fetch_failed`), the same reader `getSiteConfig` uses for the Look. No call site compares against `FREE`.
- **Own sign-in apps** — `saveSignInAppAction`, `removeSignInAppAction` and `confirmSignInCallbackAction` (`apps/platform/src/server/sign-in-apps/`) run behind `requireTenantOwner` and refuse an archived site; the save also refuses a plan without `hasOwnOAuthApps`. A save without a secret changes only the client ID of a saved app and keeps the stored secret. Save and remove revalidate the site and record `OAUTH_APP_SAVED`, `OAUTH_APP_REPLACED` or `OAUTH_APP_REMOVED` with the provider, never a credential. A saved secret never leaves the server: the page shows it as "Set". The full client ID reaches only the owner of an unarchived site, masked to its first six characters until Show; members and archived sites get the masked value, and the operator view none. After the main address changes, each own-app card warns until the owner saves it or confirms, and the Domain page's main-address confirmation names the providers with a saved app. A downgrade keeps the saved apps and shows "Your saved app is kept"; a kept app counts as the shared app everywhere, the operator view included, until an upgrade. Leaving the page with unsaved typing in either card asks first, counting the unsaved fields across both cards.
- **Not plan-gated** — Voice, Domain, Studio, the Features page itself, page types, AI takeaways.

## Constraints and invariants

- Most restrictive wins: `isCapabilityEnabled` is `PLAN_REGISTRY[plan].includes(capability) && toggle`. Every failure path returns `false`. A fetch error also logs (`settings_features.plan_fetch_failed` or `effective_fetch_failed`); a missing tenant or plan does not. A render site omits the capability silently, never with a placeholder.
- Modules on the site: when the plan can't be read, only `CORE` modules render and `module_renderer.plan_fetch_failed` is logged; a missing plan also falls back to `CORE` without a log. Nothing in the module path reads request headers, so ISR pages stay static.
- The server re-checks entitlement on every plan-gated save, and a disabled control is never the gate. Look (`updateLookAction`), Features (`updateFeaturesAction`) and Languages (`updateTenantLanguagesAction`) refuse a save only when it changes something the current plan does not include: a value different from both the stored one and the preset value the plan shows instead. An out-of-plan value still as stored never blocks a save, so a page opened before a downgrade can still save its allowed fields. A refused save writes nothing and returns one shape, `toNotInPlanRefusal` (`apps/platform/src/utils/plan-refusal/`): `REFUSED` with `SETTINGS_REFUSAL.NOT_IN_PLAN`, the tenant's current `plan` and the refused fields or languages. A later plan-gated action adopts it by returning that helper. Features logs the refusal as `settings_features.plan_entitlement_rejected`, Languages as its `UPDATE_LANGUAGES_REJECTED` event.
- The platform tells the owner at save time and nowhere else, with no polling or refresh on focus. `useSettingsForm` handles a `NOT_IN_PLAN` refusal for every settings page: it shows "Your site is on the {plan} plan, which doesn't include {items}, so nothing was saved." (`saveBar.notInPlan`), labelling each item from the page's draft fields, and puts the refused items back to their saved values while keeping every other edit. When the refusal's plan differs from the one `TenantPlanProvider` (`useTenantPlan`, mounted in the owner's and the operator's tenant layouts) rendered the page with, it calls `router.refresh()` once, so every lock on the page updates together.
- A downgrade deletes nothing. Toggles are clamped on read: on the site, in Studio (`getEnabledCapabilities`) and in the Features page's initial values. Saving that page never writes an out-of-plan toggle: `updateFeaturesAction` keeps its stored value, so an upgrade brings back what was on. Switching on one that is stored off is refused.
- Look: `toEffectiveLook` (`@blog/db/utils/effective-look/effective-look`, client-safe) gives each field outside the plan its preset's value, in the platform's form and preview and in `apps/web`'s `getSiteConfig`; `updateLookAction` refuses a change to a field outside the plan (`listRefusedLookFields`) and otherwise writes only the fields the plan includes (`pickEntitledLook`), so a downgrade keeps the stored choices and an upgrade shows them again.
- Languages: the live set is the default plus the first `limit − 1` stored additional languages. `setTenantAdditionalLocales` refuses to add a locale past the limit (`DB_LOCALE_LIMIT_EXCEEDED`) but lets a downgraded tenant keep or reorder its stored ones.
- Seats: `createMembershipInvite` refuses a new invite with the `MEMBERSHIP_INVITE_OUTCOME.SEAT_LIMIT` outcome, writing nothing, once the tenant's memberships plus pending invites reach the plan's `seats`. Two invites sent at once can both pass that check, so each re-counts the tenant's memberships plus pending invites in a fresh statement after inserting; while the count is over the plan's `seats`, the invite deletes itself and returns `SEAT_LIMIT`, whatever its rank. The tenant never ends over its limit: if two racing invites both see the overflow, both are refused and the owner retries. A caller sends the invite email only for a `CREATED` result. A re-invite of an address already invited reports that invite, even at the limit. Accepting an invite (`consumeMembershipInvite`) and seating the owner at tenant creation never check the limit, because the invite already holds its seat and the owner is always within it. A downgrade removes no membership or invite; it only refuses new ones until the tenant is under the limit.
- A reader account exists only while `READER_ACCOUNTS` is on, so a `FREE` or `STARTER` site has none.
- Saving a tenant's details (plan, default language, domain) or its additional languages calls the revalidation route, so the site serves the change on its next load. A failed call is logged and does not fail the save; the site then catches up within 3600s.
- `PLAN_REGISTRY` lives in `@blog/db` because it keys off `TENANT_PLAN`, which `db` owns and `config` cannot import.
- `TENANT_PLAN` backs a pgEnum: reordering it reorders the enum, and a new plan needs a migration plus entries in every `Record<TTenantPlan, …>` map.
- A new Growth-only Look column joins `LOOK_FIELDS` and the effective-Look fallback in the change that adds it.
- A new capability means a `CAPABILITY` key, every `Record<TCapability, …>` map, a `settings_features` column with its migration, a `CAPABILITY_TOGGLES` row and the mapping in `to-effective-settings-features`.

## Dependencies

- Layers: `config` (`CAPABILITY`, preset `featureDefaults`), `db`, `studio`, `web`, `platform`.
- Features: [multi-tenancy](./multi-tenancy.md), [tenant-access](./tenant-access.md), [platform-shell](./platform-shell.md), [embedded-studio](./embedded-studio.md), [languages](./languages.md), [look](./look.md) (presets carry the feature defaults), [bookmarks](./bookmarks.md), [newsletter](./newsletter.md), [comments-and-ratings](./comments-and-ratings.md), [consent-and-analytics](./consent-and-analytics.md), [reader-account](./reader-account.md), [email](./email.md), [rendering-and-caching](./rendering-and-caching.md).
- Env: `SITE_CONFIG_REVALIDATE_SECRET` (both apps), `WEB_APP_URL` (platform), `WEB_ANALYTICS_ENABLED` (web, ANDed with `ANALYTICS`), `PRODUCT_NAME` (web and platform) and `MARKETING_SITE_URL` (web), for the powered-by mark.

## Entry points

- `packages/db/src/constants/tenant.ts` — `TENANT_PLAN`, `PLAN_REGISTRY`, `PLAN_LOCALE_LIMIT`, `PLAN_MONTHLY_SENDS_PER_SUBSCRIBER`, `SUBSCRIBER_BAND_CEILINGS`, `PLAN_ENTITLEMENTS`
- `packages/db/src/utils/monthly-send-allowance/monthly-send-allowance.ts` — `monthlySendAllowance`
- `packages/db/src/constants/billing.ts` — `STRIPE_PRICE_LOOKUP_KEY`, `PLAN_PRICE_LOOKUP_KEYS`
- `packages/db/src/queries/tenants/get-tenant-billing/`, `set-tenant-billing/` — the tenant's billing state
- `packages/db/src/queries/stripe-webhook-events/record-stripe-event/` — `recordStripeEvent`
- `packages/db/src/utils/effective-look/effective-look.ts` — `toEffectiveLook`, `pickEntitledLook`, `isLookFieldEntitled`
- `apps/web/src/server/settings-features/is-capability-enabled/is-capability-enabled.ts`
- `apps/web/src/server/settings-features/is-reader-account-enabled/is-reader-account-enabled.ts`
- `apps/web/src/utils/to-effective-settings-features/to-effective-settings-features.ts`
- `apps/platform/src/utils/plan-page-access/plan-page-access.ts`
- `apps/platform/src/server/tenant-pages/render-tenant-scoped-page.ts`
- `apps/platform/src/utils/settings-features-fields/settings-features-fields.ts`
- `apps/platform/src/server/settings-features/update-features-action.ts`
- `apps/platform/src/server/tenants/notify-owner-of-plan-change.ts` — the owner's plan change email
- `apps/platform/src/utils/plan-refusal/plan-refusal.ts` — `toNotInPlanRefusal`, `isNotInPlanRefusal`
- `apps/platform/src/context/tenant-plan-provider/tenant-plan-provider.tsx` — `TenantPlanProvider`, `useTenantPlan`
- `apps/platform/src/components/shared/settings-form-shell/use-plan-refusal.ts`
- `apps/platform/src/server/settings-features/get-enabled-capabilities.ts`
- `apps/platform/src/components/features/studio/studio-mount-view/studio-mount-view.tsx` — passes the plan's `modulePacks` to `StudioMount`
- `apps/platform/src/utils/nav-sections/nav-sections.ts`
- `apps/platform/src/components/features/sign-in-apps/sign-in-apps-page-content/sign-in-apps-page-content.tsx` — the Sign-in page and its modes
- `apps/platform/src/server/sign-in-apps/load-sign-in-apps.ts` — what each viewer receives
- `packages/db/src/queries/tenant-oauth-credentials/` — `saveTenantOAuthCredentials`, `updateTenantOAuthClient`, `clearTenantOAuthCredentials`, `confirmTenantOAuthCallbackDomain`, `listTenantOAuthClients`
- `packages/db/src/queries/tenants/get-tenant-live-locales/get-tenant-live-locales.ts`
- `packages/db/src/queries/membership-invites/create-membership-invite/create-membership-invite.ts` — the seat limit
- `packages/config/src/constants/module-pack.ts` — `MODULE_PACK`, `MODULE_PACK_BY_TYPE`, `isModuleTypeEntitled`
- `apps/web/src/server/settings-features/is-module-entitled/is-module-entitled.ts`
- `apps/web/src/server/site-config/get-effective-plan/get-effective-plan.ts` — the plan a site renders under
- `apps/web/src/server/site-config/get-powered-by-mark/get-powered-by-mark.ts`
- `apps/web/src/modules/module-gate/module-gate.tsx`
- `packages/studio/src/schema-types/inputs/requirement-warning-input/missing-requirement/get-missing-requirement.ts`
- `packages/studio/src/schema-types/inputs/requirement-warning-input/entitlement-gates/entitlement-gates.ts`
- `packages/studio/src/schema-types/inputs/requirement-warning-input/module-picker/module-picker.tsx`
- `packages/studio/src/schema-types/validation/validate-modules-entitled/validate-modules-entitled.ts`
- `packages/studio/src/schema-types/filters/entitled-module.ts`

## Tests and stories

- Platform: `notify-owner-of-plan-change.test.ts`, `plan-page-access.test.ts`, `settings-features-fields.test.ts`, `apps/platform/src/server/settings-features/*.test.ts`, `render-tenant-scoped-page.test.ts`, `nav-sections.test.ts`, and the Features page's `features-page-content.test.tsx` and `features-settings.test.tsx`, and `studio-mount-view.test.tsx`; `apps/platform/src/server/sign-in-apps/*.test.ts`, `sign-in-app-card.test.tsx`, `sign-in-apps-page-content.test.tsx` and the Domain page's `domain-page-content.test.tsx`.
- Web: `apps/web/src/server/settings-features/**/*.test.ts`, `to-effective-settings-features.test.ts`, `module-renderer.test.tsx`, `get-effective-plan.test.ts`, `get-powered-by-mark.test.ts`.
- db: `packages/db/src/queries/settings-features/**/*.test.ts`, `packages/db/src/queries/tenant-oauth-credentials/**/*.test.ts`, `get-tenant-live-locales.test.ts`, `set-tenant-additional-locales.test.ts`, `get-tenant-billing.test.ts`, `set-tenant-billing.test.ts`, `record-stripe-event.test.ts`.
- Config: `module-pack.test.ts`.
- Email: `owner-plan-change.test.ts`.
- Studio: `get-missing-requirement.test.ts`, `mark-requirement-off-types.test.ts`, `entitlement-gates.test.ts`, `validate-modules-entitled.test.ts`, `entitled-module.test.ts`.
- No Storybook stories; the platform has none.

## Related

- #4840 — epic: platform front door. Stripe webhooks drive `plan`, `TRIAL` and `PAST_DUE` statuses, pricing rendered from `PLAN_REGISTRY` plus a price source, `FREE`-only self-serve signup.
- #2798 — epic: site templates, plan-layered (a Growth layer adds sections on upgrade).
- #4083 — newsletter sending and per-plan email limits beside `PLAN_LOCALE_LIMIT`.
- #3667 — `CONTACT_FORM` capability, `GROWTH` only.
