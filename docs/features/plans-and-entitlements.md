---
title: Plans and entitlements
status: partial
layers: [config, db, studio, web, platform]
code:
  - packages/db/src/constants/tenant.ts
  - packages/config/src/constants/capability.ts
  - packages/db/src/schema/settings-features.ts
  - packages/db/src/queries/settings-features/**
  - apps/platform/src/utils/plan-page-access/**
  - apps/platform/src/utils/settings-features-fields/**
  - apps/platform/src/server/settings-features/**
  - apps/platform/src/server/tenant-pages/**
  - apps/platform/src/components/features/capabilities/**
  - apps/web/src/server/settings-features/**
  - apps/web/src/utils/to-effective-settings-features/**
  - packages/studio/src/schema-types/inputs/capability-warning-input/**
epics: [4840, 2798, 4083, 3667]
---

# Plans and entitlements

## What it does

Every tenant is on one plan, `FREE` or `GROWTH`, which an operator sets. The plan is a ceiling: it decides which reader-facing capabilities the site may switch on, how many languages it serves, and which tenant pages the owner sees in the platform. Inside that ceiling the owner switches each capability on or off on the Features page, and the site shows a capability only when both the plan and the toggle allow it. There is no billing, trial or self-serve plan change; the plan is a column an operator edits.

## Surfaces and routes

- **Platform, operator** — the plan picker in the Add tenant form and the tenant details panel; the plan shows in the tenants table and on the owner's home card.
- **Platform, Features page** — `/dashboard/features` (owner) and `/tenants/{id}/features` (operator). Seven capability rows: a "Coming soon" row has no switch, and a row outside the plan is locked with a "Growth plan" badge.
- **Platform, plan-gated pages** — `/dashboard/languages` and `/dashboard/email` answer 404 when the plan does not open them. Subscribers, Comments and Team are sidebar entries with a "Coming soon" badge and no page.
- **Public site** — no route of its own. It gates `/account` and `/bookmarks` (404 with no reader-account capability), the header account menu, the bookmark button, the newsletter module and its server action, Vercel Analytics and Speed Insights, and the consent banner.
- **Studio** — a module type whose capability is off is relabelled "(off in Features)" in pickers, and its documents carry a warning; today only `module_newsletter` maps to a capability.

## Data

- `tenants.plan` — required, the `tenant_plan` pgEnum built from `TENANT_PLAN`.
- `PLAN_REGISTRY` (`@blog/db/constants`) — `FREE`: `RATINGS`, `CONSENT_BANNER`, `CONTACT_FORM`. `GROWTH`: all seven `CAPABILITY` keys (`COMMENTS`, `RATINGS`, `BOOKMARKS`, `NEWSLETTER`, `ANALYTICS`, `CONSENT_BANNER`, `CONTACT_FORM`).
- `PLAN_LOCALE_LIMIT` — languages per plan including the default: `FREE` 1, `GROWTH` 3.
- `settings_features` — one row per tenant (unique `tenant_id`, cascade delete), seven `NOT NULL` boolean toggles. Provisioning writes no row; an absent row resolves to the tenant's current preset's `featureDefaults` (both presets: comments, ratings, bookmarks and contact form on; newsletter, analytics and consent banner off).
- No price exists anywhere in the code.
- **Caching (web)** — `getTenantPlan` and `getEffectiveSettingsFeatures` are `unstable_cache` per tenant, tagged `tenant-plan:<id>` and `settings-features:<id>`, with `TENANT_CONFIG_REVALIDATE_SECONDS` (3600) as the fallback. `POST /api/revalidate-site-config` expires both tags with `site-config:<id>` and purges the whole layout. The platform and Studio read `tenants.plan` uncached on every request.

## Configuration

- **Operator** (any `admins` row) sets the plan through `createTenantAction` and `updateTenantDetailsAction`, both behind `requireAdmin`.
- **Owner or operator** saves Features through `updateFeaturesAction`, behind `requireTenantMembership` (any member; an operator gets a virtual owner membership).
- **Coming soon** — `COMMENTS`, `RATINGS` and `NEWSLETTER` carry `isComingSoon` in `CAPABILITY_TOGGLES`: shown with a "Coming soon" badge and no switch, and the save writes them off whatever the payload says. An owner can switch `BOOKMARKS`, `ANALYTICS`, `CONSENT_BANNER` and `CONTACT_FORM` on `GROWTH`, and only `CONSENT_BANNER` and `CONTACT_FORM` on `FREE`.
- **Plan page access** (`planPageAccess`) — Languages when `PLAN_LOCALE_LIMIT` > 1; Email when the plan holds bookmarks, comments or newsletter; Subscribers with newsletter; Comments with comments; Team on any plan but `FREE`. The owner's sidebar omits the rest and their pages 404; the operator's `/tenants/{id}` view shows every entry and page whatever the plan.
- **Not plan-gated** — Look, Voice, Domain, Studio, the Features page itself, modules and page types, team seats, AI takeaways.

## Constraints and invariants

- Most restrictive wins: `isCapabilityEnabled` is `PLAN_REGISTRY[plan].includes(capability) && toggle`. Every failure path returns `false`. A fetch error also logs (`settings_features.plan_fetch_failed` or `effective_fetch_failed`); a missing tenant or plan does not. A render site omits the capability silently, never with a placeholder.
- The server re-checks entitlement: `updateFeaturesAction` rejects the whole save, logging `settings_features.plan_entitlement_rejected`, when any toggle that is not coming soon is on outside the plan. A disabled switch is never the gate.
- A downgrade deletes nothing. Toggles are clamped on read: on the site, in Studio (`getEnabledCapabilities`) and in the Features page's initial values. Because that page loads the clamped values, the owner's next save writes out-of-plan toggles off, and after an upgrade they have to be switched on again.
- Languages: the live set is the default plus the first `limit − 1` stored additional languages. `setTenantAdditionalLocales` refuses to add a locale past the limit (`DB_LOCALE_LIMIT_EXCEEDED`) but lets a downgraded tenant keep or reorder its stored ones.
- A reader account exists only while bookmarks, comments or newsletter is enabled, so a `FREE` site has none.
- A plan change does not call the revalidation route. The site picks it up within 3600s, or at the tenant's next Look, Voice or Features save; the platform and Studio see it at once.
- `PLAN_REGISTRY` lives in `@blog/db` because it keys off `TENANT_PLAN`, which `db` owns and `config` cannot import.
- `TENANT_PLAN` backs a pgEnum: reordering it reorders the enum, and a new plan needs a migration plus entries in both `Record<TTenantPlan, …>` maps.
- A new capability means a `CAPABILITY` key, every `Record<TCapability, …>` map, a `settings_features` column with its migration, a `CAPABILITY_TOGGLES` row and the mapping in `to-effective-settings-features`.

## Dependencies

- Layers: `config` (`CAPABILITY`, preset `featureDefaults`), `db`, `studio`, `web`, `platform`.
- Features: [multi-tenancy](./multi-tenancy.md), [tenant-access](./tenant-access.md), [platform-shell](./platform-shell.md), [embedded-studio](./embedded-studio.md), [languages](./languages.md), [look](./look.md) (presets carry the feature defaults), [bookmarks](./bookmarks.md), [newsletter](./newsletter.md), [comments-and-ratings](./comments-and-ratings.md), [consent-and-analytics](./consent-and-analytics.md), [reader-account](./reader-account.md), [email](./email.md), [rendering-and-caching](./rendering-and-caching.md).
- Env: `SITE_CONFIG_REVALIDATE_SECRET` (both apps), `WEB_APP_URL` (platform), `WEB_ANALYTICS_ENABLED` (web, ANDed with `ANALYTICS`).

## Entry points

- `packages/db/src/constants/tenant.ts` — `TENANT_PLAN`, `PLAN_REGISTRY`, `PLAN_LOCALE_LIMIT`
- `apps/web/src/server/settings-features/is-capability-enabled/is-capability-enabled.ts`
- `apps/web/src/server/settings-features/is-reader-account-enabled/is-reader-account-enabled.ts`
- `apps/web/src/utils/to-effective-settings-features/to-effective-settings-features.ts`
- `apps/platform/src/utils/plan-page-access/plan-page-access.ts`
- `apps/platform/src/server/tenant-pages/render-tenant-scoped-page.ts`
- `apps/platform/src/utils/settings-features-fields/settings-features-fields.ts`
- `apps/platform/src/server/settings-features/update-features-action.ts`
- `apps/platform/src/server/settings-features/get-enabled-capabilities.ts`
- `apps/platform/src/utils/nav-sections/nav-sections.ts`
- `packages/db/src/queries/tenants/get-tenant-live-locales/get-tenant-live-locales.ts`
- `packages/studio/src/schema-types/inputs/capability-warning-input/get-missing-capability.ts`

## Tests and stories

- Platform: `plan-page-access.test.ts`, `settings-features-fields.test.ts`, `apps/platform/src/server/settings-features/*.test.ts`, `render-tenant-scoped-page.test.ts`, `nav-sections.test.ts`, and the Features page's `features-page-content.test.tsx` and `features-settings.test.tsx`.
- Web: `apps/web/src/server/settings-features/**/*.test.ts`, `to-effective-settings-features.test.ts`.
- db: `packages/db/src/queries/settings-features/**/*.test.ts`, `get-tenant-live-locales.test.ts`, `set-tenant-additional-locales.test.ts`.
- Studio: `get-missing-capability.test.ts`, `mark-capability-off-types.test.ts`.
- No Storybook stories; the platform has none.

## Related

- #4840 — epic: platform front door. Stripe webhooks drive `plan`, `TRIAL` and `PAST_DUE` statuses, pricing rendered from `PLAN_REGISTRY` plus a price source, `FREE`-only self-serve signup.
- #2798 — epic: site templates, plan-layered (a Growth layer adds sections on upgrade).
- #4083 — newsletter sending and per-plan email limits beside `PLAN_LOCALE_LIMIT`.
- #3667 — `CONTACT_FORM` capability on every plan.
