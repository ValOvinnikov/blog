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
  - apps/platform/src/utils/plan-page-access/**
  - apps/platform/src/utils/settings-features-fields/**
  - apps/platform/src/server/settings-features/**
  - apps/platform/src/server/tenant-pages/**
  - apps/platform/src/components/features/capabilities/**
  - apps/web/src/server/settings-features/**
  - apps/web/src/utils/to-effective-settings-features/**
  - packages/config/src/constants/module-pack.ts
  - packages/studio/src/schema-types/inputs/requirement-warning-input/**
  - packages/studio/src/schema-types/validation/validate-modules-entitled/**
  - packages/studio/src/schema-types/filters/entitled-module.ts
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
- **Studio** — a module type whose capability is off is relabelled "(off in Features)" in pickers, and its documents carry a warning; `module_newsletter` and `module_contactForm` map to a capability. Given module-pack entitlements, a module type outside them is relabelled "(Growth plan)" in a page's module picker, offers no existing document to pick there, and can't be created new from the desk, the global Create menu or a reference's "Create new"; its existing documents stay listed and editable, with a banner, and a page referencing one shows a warning on that item that never blocks publishing. When a type is both off-plan and off in Features, the plan message shows.

## Data

- `tenants.plan` — required, the `tenant_plan` pgEnum built from `TENANT_PLAN`.
- `PLAN_REGISTRY` (`@blog/db/constants`) — `FREE`: `RATINGS`, `CONSENT_BANNER`. `GROWTH`: all seven `CAPABILITY` keys (`COMMENTS`, `RATINGS`, `BOOKMARKS`, `NEWSLETTER`, `ANALYTICS`, `CONSENT_BANNER`, `CONTACT_FORM`).
- `PLAN_LOCALE_LIMIT` — languages per plan including the default: `FREE` 1, `GROWTH` 3.
- `PLAN_ENTITLEMENTS` (`@blog/db/constants`) — one record per plan. `lookFields` lists the `site_config` Look columns (`LOOK_FIELDS`) the plan may set: `FREE` the preset, accent hue, logo and favicon; `GROWTH` every Look column. The epic's later entitlements join this record as fields of their own.
- `settings_features` — one row per tenant (unique `tenant_id`, cascade delete), seven `NOT NULL` boolean toggles. Provisioning writes no row; an absent row resolves to the tenant's current preset's `featureDefaults` (both presets: comments, ratings, bookmarks and contact form on; newsletter, analytics and consent banner off).
- `MODULE_PACK` (`CORE`, `GROWTH`) and `MODULE_PACK_BY_TYPE` (`@blog/config/constants`) give every module `_type` exactly one pack; the map `satisfies Record<TModuleType, TModulePack>`, so a new module type fails type-check until it has one. Core: the four heroes (the deprecated `module_hero` included), the five Posts modules, content, FAQ, section pages, CTA and newsletter. Growth: testimonial, team, logo wall, stats, pricing, feature list, feature highlights, timeline and contact form. `isModuleTypeEntitled(type, packs)` is the one check; an unknown type is never entitled.
- No price exists anywhere in the code.
- **Caching (web)** — `getTenantPlan` and `getEffectiveSettingsFeatures` are `unstable_cache` per tenant, tagged `tenant-plan:<id>` and `settings-features:<id>`, with `TENANT_CONFIG_REVALIDATE_SECONDS` (3600) as the fallback. `POST /api/revalidate-site-config` expires both tags with `site-config:<id>` and purges the whole layout. The platform and Studio read `tenants.plan` uncached on every request.

## Configuration

- **Operator** (any `admins` row) sets the plan through `createTenantAction` and `updateTenantDetailsAction`, both behind `requireAdmin`.
- **Owner or operator** saves Features through `updateFeaturesAction`, behind `requireTenantMembership` (any member; an operator gets a virtual owner membership).
- **Coming soon** — `COMMENTS`, `RATINGS` and `NEWSLETTER` carry `isComingSoon` in `CAPABILITY_TOGGLES`: shown with a "Coming soon" badge and no switch, and the save writes them off whatever the payload says. An owner can switch `BOOKMARKS`, `ANALYTICS`, `CONSENT_BANNER` and `CONTACT_FORM` on `GROWTH`, and only `CONSENT_BANNER` on `FREE`.
- **Plan page access** (`planPageAccess`) — Languages when `PLAN_LOCALE_LIMIT` > 1; Email when the plan holds bookmarks, comments or newsletter; Subscribers with newsletter; Comments with comments; Team on any plan but `FREE`. The owner's sidebar omits the rest and their pages 404; the operator's `/tenants/{id}` view shows every entry and page whatever the plan.
- **Look** — fields outside `lookFields` show locked on the Look page with the "Growth plan" badge, at the preset's value (see [look](./look.md)).
- **Module packs in Studio** — `StudioMount` takes an optional plain-data `entitlements` object whose `modulePacks` lists the entitled packs. Omitted, every pack is entitled and the Studio behaves as before: the site is the enforcement point, and the Sanity CLI Studio has no tenant. The platform does not pass it yet, and the site does not gate modules yet.
- **Not plan-gated** — Voice, Domain, Studio, the Features page itself, page types, team seats, AI takeaways; on the site, modules.

## Constraints and invariants

- Most restrictive wins: `isCapabilityEnabled` is `PLAN_REGISTRY[plan].includes(capability) && toggle`. Every failure path returns `false`. A fetch error also logs (`settings_features.plan_fetch_failed` or `effective_fetch_failed`); a missing tenant or plan does not. A render site omits the capability silently, never with a placeholder.
- The server re-checks entitlement: `updateFeaturesAction` rejects the whole save, logging `settings_features.plan_entitlement_rejected`, when any toggle that is not coming soon is on outside the plan. A disabled switch is never the gate.
- A downgrade deletes nothing. Toggles are clamped on read: on the site, in Studio (`getEnabledCapabilities`) and in the Features page's initial values. Saving that page never writes an out-of-plan toggle: `updateFeaturesAction` keeps its stored value, so an upgrade brings back what was on. Switching one on is still refused.
- Look: `toEffectiveLook` (`@blog/db/utils/effective-look/effective-look`, client-safe) gives each field outside the plan its preset's value; `updateLookAction` writes only the fields the plan includes (`pickEntitledLook`), so a downgrade keeps the stored choices and an upgrade shows them again.
- Languages: the live set is the default plus the first `limit − 1` stored additional languages. `setTenantAdditionalLocales` refuses to add a locale past the limit (`DB_LOCALE_LIMIT_EXCEEDED`) but lets a downgraded tenant keep or reorder its stored ones.
- A reader account exists only while bookmarks, comments or newsletter is enabled, so a `FREE` site has none.
- Saving a tenant's details (plan, default language, domain) or its additional languages calls the revalidation route, so the site serves the change on its next load. A failed call is logged and does not fail the save; the site then catches up within 3600s.
- `PLAN_REGISTRY` lives in `@blog/db` because it keys off `TENANT_PLAN`, which `db` owns and `config` cannot import.
- `TENANT_PLAN` backs a pgEnum: reordering it reorders the enum, and a new plan needs a migration plus entries in every `Record<TTenantPlan, …>` map.
- A new Growth-only Look column joins `LOOK_FIELDS` and the effective-Look fallback in the change that adds it.
- A new capability means a `CAPABILITY` key, every `Record<TCapability, …>` map, a `settings_features` column with its migration, a `CAPABILITY_TOGGLES` row and the mapping in `to-effective-settings-features`.

## Dependencies

- Layers: `config` (`CAPABILITY`, preset `featureDefaults`), `db`, `studio`, `web`, `platform`.
- Features: [multi-tenancy](./multi-tenancy.md), [tenant-access](./tenant-access.md), [platform-shell](./platform-shell.md), [embedded-studio](./embedded-studio.md), [languages](./languages.md), [look](./look.md) (presets carry the feature defaults), [bookmarks](./bookmarks.md), [newsletter](./newsletter.md), [comments-and-ratings](./comments-and-ratings.md), [consent-and-analytics](./consent-and-analytics.md), [reader-account](./reader-account.md), [email](./email.md), [rendering-and-caching](./rendering-and-caching.md).
- Env: `SITE_CONFIG_REVALIDATE_SECRET` (both apps), `WEB_APP_URL` (platform), `WEB_ANALYTICS_ENABLED` (web, ANDed with `ANALYTICS`).

## Entry points

- `packages/db/src/constants/tenant.ts` — `TENANT_PLAN`, `PLAN_REGISTRY`, `PLAN_LOCALE_LIMIT`, `PLAN_ENTITLEMENTS`
- `packages/db/src/utils/effective-look/effective-look.ts` — `toEffectiveLook`, `pickEntitledLook`, `isLookFieldEntitled`
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
- `packages/config/src/constants/module-pack.ts` — `MODULE_PACK`, `MODULE_PACK_BY_TYPE`, `isModuleTypeEntitled`
- `packages/studio/src/schema-types/inputs/requirement-warning-input/get-missing-requirement.ts`
- `packages/studio/src/schema-types/inputs/requirement-warning-input/entitlement-gates.ts`
- `packages/studio/src/schema-types/validation/validate-modules-entitled/validate-modules-entitled.ts`
- `packages/studio/src/schema-types/filters/entitled-module.ts`

## Tests and stories

- Platform: `plan-page-access.test.ts`, `settings-features-fields.test.ts`, `apps/platform/src/server/settings-features/*.test.ts`, `render-tenant-scoped-page.test.ts`, `nav-sections.test.ts`, and the Features page's `features-page-content.test.tsx` and `features-settings.test.tsx`.
- Web: `apps/web/src/server/settings-features/**/*.test.ts`, `to-effective-settings-features.test.ts`.
- db: `packages/db/src/queries/settings-features/**/*.test.ts`, `get-tenant-live-locales.test.ts`, `set-tenant-additional-locales.test.ts`.
- Config: `module-pack.test.ts`.
- Studio: `get-missing-requirement.test.ts`, `mark-requirement-off-types.test.ts`, `entitlement-gates.test.ts`, `validate-modules-entitled.test.ts`, `entitled-module.test.ts`.
- No Storybook stories; the platform has none.

## Related

- #4840 — epic: platform front door. Stripe webhooks drive `plan`, `TRIAL` and `PAST_DUE` statuses, pricing rendered from `PLAN_REGISTRY` plus a price source, `FREE`-only self-serve signup.
- #2798 — epic: site templates, plan-layered (a Growth layer adds sections on upgrade).
- #4083 — newsletter sending and per-plan email limits beside `PLAN_LOCALE_LIMIT`.
- #3667 — `CONTACT_FORM` capability, `GROWTH` only.
