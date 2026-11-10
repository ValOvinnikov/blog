# Roadmap

The order the open epics ship in, from today to selling sites through the
marketing page. Status lives on the project board and in each epic's sub-issue
list; this page holds only the order, the decisions still open, and why. Written
2026-10-14 from a platform inspection; restructured 2026-10-31 around a single
launch; refreshed 2026-11-10.

## One launch

There are no numbered releases (owner, 2026-10-31). The platform launches
publicly once, when a tenant can buy the Growth plan: Stripe billing in #4840
is the gate. Everything on the marketing site, the legal pages, the restore drills and
the production stand-up ships before that launch, in the order below.

At launch production is replaced, not upgraded (2026-10-27,
`docs/superpowers/specs/2026-10-27-deploy-first-migrations-design.md`): both
Neon databases are recreated from one baseline migration, every dev test
tenant is wiped and recreated through the worker (owner, 2026-10-31), and the
old production project (`web-prod` v0.3.0, Sanity `7fuqzuyl`) is retired.

## Where things stand

- **No production environment.** `web-prod` still runs v0.3.0, `platform-prod`
  has no env vars, and production deploys are paused. The stand-up is owner
  console work, deferred until there is less left to deliver.
- **Automatic dev deploys are off** (cost freeze, #2648). Dev lags `main`
  until the owner dispatches a deploy, so manual tests wait on it. A dispatched
  deploy stages every app, checks each staged URL through its Vercel
  protection bypass, and promotes them together only when all pass.
- **Provisioning is on the worker**, and it survives a rotation of the Sanity
  organisation token (#6273): each tenant has its own `developer` token.
- **Done since 2026-10-18:** the form-status vocabulary (#5385), magic-link
  send limits (#4958), the contact form (#1292), production logging to
  Grafana Loki (#1645), and the wildcard subdomain on dev.
- **Done since 2026-10-31:** the Look page redesign (#6317) with the Growth
  note on Look and Sign-in (#6844), the "Powered by" mark on Free footers
  (#6794, its manual test left), reader self-service on a downgraded site
  (#5062, #6437), and choosing the surviving language after a downgrade
  (#5064).

## Before the launch

| Epic      | What it delivers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#4840** | Self-serve signup on the worker: `/sign-in`, `/signup`, the `/onboarding` wizard and **Create site**; reserved subdomains and `*.<domain>`; TRIAL / PAST_DUE, tenant deletion and the abandoned-tenant sweep; site templates (#2798), the signup blocklist (#5649) and per-tenant revalidate secrets (#5719). Then **Stripe** billing (Order 5), test mode first: a 14-day trial with no card, the webhook in `apps/platform`, Upgrade through Embedded Checkout, a Billing page with our own receipt emails, a 14-day downgrade grace with emails on days 0, 7 and 13, and live prices by country on the marketing pricing page. Tickets #6872–#6884; the Growth note's "Ask about Growth" lands with #6877. |
| **#5047** | Plans and entitlements. Free = the 13 blog modules; Growth adds testimonial, team, logoWall, stats, pricing, featureList, featureHighlights and timeline. On a downgrade gated modules stop rendering and nothing is deleted. Seats (#5055) and the Free AI quota (#5056) wait on owner decisions; a super admin granting one tenant a feature outside its plan is #6779.                                                                                                                                                                                                                                                                                                                                     |
| **#5085** | Launch readiness: legal pages and links (#5086 → #5087 → #3726 → #5088 → #5089, then #5090's final text), newsletter guards, rehearsed restores of the Neon point-in-time window and of the encrypted tenant exports each release takes before migrating (#5096; daily backups, #5095, are deferred), production error shipping and uptime checks (#5349), and Lighthouse on the marketing pages (#5097, after the apex cutover).                                                                                                                                                                                                                                                                             |
| **#4979** | The two apps stay separate: language, sign-in and sessions per app. Left: its manual test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **#4987** | Accessible text and colour on the public site, guarded by a brand-matrix CI job.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Production's first content is copied from the `marketing.dev` and `demo.dev`
tenants: launch needs a dev→prod Sanity dataset copy and a way to carry their
site config, Voice, feature and email settings across (launch-reset spec). No
ticket is cut for either yet.

Legal text is generated by the owner from context the orchestrator prepares;
that blocks only #5090's final wording, never the pages and links.

The marketing pages need heroStatement, featureList, featureHighlights,
pricing, faq, cta, content, the post modules and contactForm; logoWall,
testimonial and embed should carry real logos, quotes and a demo video.

Site types: v1 Blog, Portfolio, Personal, Docs and Blank; v2 Business and
Product.

## The admin redesign

Specs merged in #6427; run in its own session, alongside the launch work.
Umbrella #6313. The building is done but for the Voice save bar on phones
(#6868). Left: each area's manual test (#6380 shell, #6353 colours, #6368 and
#6369 dashboard, #6423 Voice, #6334 onboarding), then each area epic's final
docs PR, which syncs its feature page and deletes its spec: #6287, #6315,
#6316, #6319, #6320 and #6717. The Look epic (#6317) is closed out. The last
of them also deletes `2026-10-30-admin-redesign-resolutions.md`.

## Alongside

| Epic      | What it delivers                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **#5251** | Tiered CI. Left: Lighthouse after a production deploy (#5264) and taking the repo private (#5269).                              |
| **#5271** | Releases from the platform. Left: the commit-pinned Release button (#5502), the Deploy to dev action (#5282), and manual tests. |
| **#5459** | Header controls are one round family, with a per-site style on the Look page. Left: its manual tests.                           |
| **#6152** | Deploy first, then migrate: content migrations return after the launch in the expand/contract form.                             |

## After the launch

| Epic      | What it delivers                                                                                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#5028** | Text roles: one `TEXT_ROLE` registry, so the same role looks identical in every module.                                                                                                         |
| **#5016** | Skins: a palette tier and a role tier on `[data-skin]`, generated from `SKIN_REGISTRY`.                                                                                                         |
| **#5067** | Per-tenant module styles: more Look settings, then per-module overrides, then plan-gated named variants.                                                                                        |
| **#5106** | Convention infrastructure: shared types, helpers, recipes, test fakes, and file-size and prop-ceiling gates.                                                                                    |
| **#5134** | Component structure: long prop lists and oversized files fixed at their source.                                                                                                                 |
| **#5150** | Docs: retire the design docs and SPEC.md sections the feature catalogue now covers, and add a feature-docs check.                                                                               |
| **#5197** | Retire `module_hero`. Also ready to pull: comments #1040, ratings #1041, location #2792, price-period wording #4022, post-module image shape #3245, semantic search #1045, the Team page #5151. |
| **#4083** | Newsletter sending and per-tenant email limits.                                                                                                                                                 |

## Ideas

Filed as `prio:someday` idea epics under #5150's sweep of the old backlog:
visibility windows on modules, popular posts by bookmarks, series, a hero
search field, generated hero art, light/dark image pairs, living posts,
constellation home, reader lenses and a fine-tuned voice model. Also: continue
reading (#2799), live subscriber count (#2801), draft preview (#1036) and
module presets (#2803).

## Open decisions

- **Plans (#5047):** Growth's seat count, the Free AI-takeaway quota, and
  whether the Subscribers page stays on Free.
- **Domain:** the admin is `platform.<domain>`, but the domain itself is not
  chosen. It doesn't block development.
- **Prices**: Growth's amount and currencies (set in Stripe, no code
  change), banded by subscriber count or not, and whether to sell the
  newsletter before sending exists.
- **Vendor plans**: Resend Pro timing. Vercel is on paid Pro.
- **Support channel and status page** tooling.

## Deferred

- **Production stand-up** (owner, 2026-10-31): Vercel projects, env,
  domains, crons and the Upstash Redis integration.
- **Production deploy testing** (owner, 2026-10-18): #5502 and #5264.
- **A platform visual audit**, owed after the admin redesign.
- **Stripe's custom billing domain** (owner, 2026-11-08): a paid add-on,
  about $10 a month, that serves the Customer Portal and Stripe's hosted pages
  from `billing.<domain>` instead of a stripe.com address. One DNS record and
  a Stripe setting, no code; it can be switched on any time after launch.
- **Daily backups** (owner, 2026-11-10, #5095): a daily schedule may not
  be needed, and the tenant-token key should not be copied into another
  GitHub Environment. Until then the database relies on Neon's point-in-time
  restore, and tenant content on each release's pre-migration exports. A
  second Sanity dataset as a snapshot was dropped: copying one server-side is
  Enterprise-only.
- **After the launch, for billing** (owner, 2026-11-08): a platform page for
  creating Stripe campaigns (coupons and promotion codes, never prices), and
  tenants selling their own plans through Stripe Connect.
