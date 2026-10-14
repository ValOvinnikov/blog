# Roadmap

The order the open epics ship in, from today to selling sites through the
marketing page. Status lives on the project board and in each epic's sub-issue
list; this page holds only the order, the decisions still open, and why. Written
2026-10-14 from a platform inspection (WCAG, typography, skins, module
flexibility, file structure, docs, tiers, board, release readiness and every
module × brand variant × preset × mode combination).

## Where things stand

- **No production environment for today's product.** `web-prod` still runs
  v0.3.0 (2026-08-12), `platform-prod` has no env vars, and production deploys
  are paused. Standing it up is console work for the owner, not a ticket.
- **Provisioning has been red since 2026-09-14.** The last four runs failed at
  the content check (#4945, #4947).
- **Contrast fails widely.** Across 21 modules × 3 brand variants × 2 presets ×
  light/dark, 15 of 126 Console cells pass; the SECONDARY band fails in light
  mode in every module. Causes and fixes: epic #4987.
- **Nothing protects the email-sending forms.** Newsletter sign-up and
  magic-link sign-in have no bot or rate limits, on a shared 100-a-day Resend
  quota.
- **No legal pages, footer links or backups.**

## Release 1 — start promoting

The marketing site is an ordinary `apps/web` tenant (the "platform tenant"):
its own tenants row, Sanity project and Look, on the apex and `www` through
`tenant_domains`. It needs no new app and no platform code on tenant requests.
Signup itself is Release 2.

Launch epic: **#5085**. It carries, or depends on:

1. **Production stand-up** (owner, console): Vercel projects, env, domains, the
   old prod project retired or adopted, crons re-enabled, and the
   Upstash Redis integration from the Vercel Marketplace (rate-limit counts).
2. **Provisioning green on dev**: #4945, then #4947.
3. **The platform tenant on dev, its pages authored**: #4948.
4. **Lead capture**: the contact form chain #3667–#3674 under #1292. #3674 now
   reuses the launch epic's shared rate limiter and BotID setup. A CTA to an
   external form is the stopgap if the chain lags.
5. **Abuse protection**: one rate limiter, its counts in Redis so limits hold
   across instances, and BotID for server actions (#5091, #5092), then newsletter limits (#5093). Magic-link limits are
   #4958.
6. **Legal**: footer links and a privacy link (#5086, #5087, #3726), the
   consent banner's policy link (#5088, #5089), final legal pages (#5090).
7. **Backups and restore**: #5094–#5096. **Observability**: #1645 (log drain
   and alerts).
8. **Module QA**: pricing grid #5098, Team carousel #5099/#5100, Lighthouse on
   the marketing pages #5097, #4858 card hover on Brand primary bands.
9. **Accessibility, Release-1 subset of #4987**: brand text on bands, primary
   button hues, `text-subtle`, banners and scrims, card focus, forced colours
   (#5129).

**Modules the marketing pages need.**

| Need   | Modules                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| Must   | heroStatement, featureList, featureHighlights, pricing, faq, cta, content, post modules, contactForm (or the stopgap) |
| Should | logoWall (real logos), testimonial (real quotes), embed (a demo video)                                                |
| Later  | stats, team, timeline, location, newsletter (unusable until sending exists, #4083)                                    |

Every module needs the accessibility fixes above, whatever its column.

## Release 2 — start selling

| Epic      | What it delivers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#4840** | Self-serve signup: one shared branded `/sign-in`, `/signup`, an `/onboarding` wizard (site type, name, slug, language, look) and **Create site**. The Sanity project is created at Create site. Provisioning moves to a new `apps/worker` on Vercel Workflow. Owner Studio access moves through INVITE_SENT → ACTIVATING → READY (or STALLED). Also reserved subdomains, wildcard `*.<domain>`, TRIAL / PAST_DUE, tenant deletion, and **Stripe** billing (Checkout, Customer Portal, webhooks, Stripe Tax; test mode and test clocks first). The Stripe tickets are not cut yet. |
| **#5047** | Plans and entitlements. Free = the 13 blog modules; Growth adds testimonial, team, logoWall, stats, pricing, featureList, featureHighlights and timeline. On a downgrade, gated modules stop rendering, their content is kept, the owner is warned, and nothing is deleted. #5066 writes each price once, read by Stripe and the pricing page.                                                                                                                                                                                                                                    |
| **#4979** | The two apps stay separate: the admin takes its language from the browser, the public site's language is remembered only by its switcher, each app issues and accepts its own sessions, platform invites are consumed only on platform sign-in, and deleting an account is refused while it owns a site (#4984).                                                                                                                                                                                                                                                                  |

Site types: v1 Blog, Portfolio, Personal, Docs and Blank; v2 Business and
Product.

## Growth — after the first sale

| Epic      | What it delivers                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#4987** | Accessible text and colour everywhere, guarded by a brand-matrix CI job (the rest of the epic).                                                                                                               |
| **#5028** | Text roles: one `TEXT_ROLE` registry, so the same role looks identical in every module.                                                                                                                       |
| **#5016** | Skins: a palette tier and a role tier on `[data-skin]`, generated from `SKIN_REGISTRY`. A new skin is one `defineSkin()` entry plus `pnpm typegen`, with no component walk and no new Studio definition.      |
| **#5067** | Per-tenant module styles: more Look settings, then per-module overrides (`site_config.module_styles`), then plan-gated named variants. Advanced custom CSS (#5084) is recorded for later only.                |
| **#5106** | Convention infrastructure: shared types (#5107), helpers, recipes, test fakes, and file-size and prop-ceiling gates.                                                                                          |
| **#5134** | Component structure: long prop lists and oversized files fixed at their source.                                                                                                                               |
| **#5150** | Docs: retire the design docs and SPEC.md §6/§9 sections that the feature catalogue now covers, and add a feature-docs check.                                                                                  |
| **#5197** | Retire `module_hero`. Also rewritten and ready to pull: comments #1040, ratings #1041, location #2792, price-period wording #4022, post-module image shape #3245, semantic search #1045, the Team page #5151. |

Tenants can tune only spacing, density, radius and two card variants until
#5067 lands; module designs stay fixed otherwise.

## Ideas

Filed as `prio:someday` idea epics under #5150's sweep of the old backlog:
visibility windows on modules, popular posts by bookmarks, series, a hero
search field, generated hero art, light/dark image pairs, living posts,
constellation home, reader lenses and a fine-tuned voice model. Also: continue
reading (#2799), live subscriber count (#2801), draft preview (#1036) and
module presets (#2803).

## Open decisions

- **Lead capture for Release 1**: wait for the #1292 chain, or ship the
  external-form stopgap.
- **Old production project** (`web-prod` v0.3.0, Sanity `7fuqzuyl`): retire it,
  or adopt it as tenant one. This blocks the apex cutover.
- **Admin host name**: `platform.<domain>` (#4840) or `admin.<domain>`
  (SPEC.md).
- **Prices**: Growth banded by subscriber count? Sell the newsletter before
  sending exists?
- **Vendor plans**: Vercel Pro (Hobby forbids commercial use) and Resend Pro
  timing.
- **Legal drafting**: who writes the terms, privacy policy, DPA and
  sub-processor list.
- **Support channel and status page** tooling.
- **Stripe webhook endpoint**: in `apps/platform` or `apps/worker`.

## Milestones

- **R1 — public launch**: #5085 and its children, provisioning #4945–#4948,
  the contact form #1292 and #3667–#3674, #4987's Release-1 fixes (#3076,
  #4989–#4991, #4994, #4995, #4997–#4999), forced colours #5129/#5130, and
  #1645.
- **Module catalogue** (formerly M9 "Portfolio"): the module epics and their
  sub-issues.
- **Tooling & DX** (formerly M2 "Hardening"): CI, agent tooling and DX
  decisions. #1036 has no milestone.
- **Cleanup**: #5197 (module_hero) and its chain, #3663, #3600, #1880, #2036,
  #1785, #2918.
- **M4, M5, M8**: unchanged, except that #1645 moved to R1.

## Deferred

- **A platform visual audit**: a styling and refactor sweep of
  `apps/platform`, owed after the Voice, Email and Look work.
- **Shipping constraint**: CLAUDE.md requires `TMaybeNull` and `TNullable`,
  which #5107 adds to `@blog/config`. The guidance branch merges after #5107.
