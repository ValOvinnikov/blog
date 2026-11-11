# Roadmap

The order the open epics ship in, from today to selling sites through the
marketing page. Status lives on the project board and in each epic's sub-issue
list; this page holds only the order, the decisions still open, and why. Written
2026-10-14 from a platform inspection; restructured 2026-10-31 around a single
launch; refreshed 2026-11-10; launch scope, plans and prices settled
2026-11-11 after a competitor review.

## One launch

There are no numbered releases (owner, 2026-10-31). The platform launches
publicly once, when a tenant can buy the Starter or the Growth plan and a
Growth site can email its posts to subscribers: Stripe billing in #4840 and
newsletter sending in #4083 are the gates. Everything on the marketing site,
the legal pages, the restore drills and the production stand-up ships before
that launch, in the order below.

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
| **#5047** | Plans and entitlements. Free = the 13 blog modules; Growth adds testimonial, team, logoWall, stats, pricing, featureList, featureHighlights and timeline. On a downgrade gated modules stop rendering and nothing is deleted. Seats (#5055) and the AI quota (#5056) are decided under "Plans and prices", which also adds the Starter plan; a super admin granting one tenant a feature outside its plan is #6779.                                                                                                                                                                                                                                                                                           |
| **#5085** | Launch readiness: legal pages and links (#5086 → #5087 → #3726 → #5088 → #5089, then #5090's final text), newsletter guards, rehearsed restores of the Neon point-in-time window and of the encrypted tenant exports each release takes before migrating (#5096; daily backups, #5095, are deferred), production error shipping and uptime checks (#5349), and Lighthouse on the marketing pages (#5097, after the apex cutover).                                                                                                                                                                                                                                                                             |
| **#4979** | The two apps stay separate: language, sign-in and sessions per app. Left: its manual test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **#4987** | Accessible text and colour on the public site, guarded by a brand-matrix CI job.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### Added to the launch (owner, 2026-11-11)

Decided after comparing the product with Ghost, beehiiv, Substack, Kit,
WordPress.com, Squarespace, Wix, Webflow and Framer. Each epic named carries
the decision at the top of its Shape, and the build tickets are cut. The
build chain and what can start now are in each epic's Order.

| Item                      | What it delivers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Newsletter (#4083)**    | A published post is emailed once to confirmed subscribers, by a "Send to subscribers" switch on the post, on by default. A post dated in the future is sent when its date arrives: the worker run waits for it, with no extra scheduled job. The email carries the title, cover, takeaways, an excerpt and a link, never the full body. A per-site setting turns sending off for owners who use their own tool. A Subscribers page lists, counts, removes and exports. Per-tenant caps, bounce and complaint tracking and an automatic pause ship with it, as does a "Send me a test" action. Standalone issues, scheduling, digests and segments are out. It starts first: a new sending domain needs weeks at low volume (#7165). The send runs in the worker. Build tickets #7158 to #7166; the Subscribers page waits on design #7157. |
| **Three plans (#5047)**   | Free, Starter and Growth, as under "Plans and prices" below, with subscriber bands on Growth and the AI allowances. The Starter plan is #7146; its manual test is #7148.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Team (#5151, #5055)**   | A minimal Team page: invite an editor by email, list members, remove one. Growth has 3 seats. A member becomes a Sanity administrator through the owner's access flow, because Sanity's free plan has no editor role, and the invite form says what a member can do. In the platform a member can't change look, settings or billing. Build tickets #7167 to #7170; the page waits on design #7156.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Draft preview (#1036)** | A Preview action in the Studio opens the draft on the real site behind a signed link. A side-by-side preview is later. The investigation (#7171) found the tenant's read token already reads drafts and Draft Mode keeps the cached page for ordinary visitors. The link is signed with a shared `PREVIEW_LINK_SECRET` and lasts 10 minutes. Build tickets #7178 (service), #7179 (web), #7180 (platform), #7181 (studio), manual test #7183.                                                                                                                                                                                                                                                                                                                                                                                              |
| **Embed module (#2788)**  | The module ships before the launch (#3771 to #3774), so the marketing page can carry its demo video, loaded after the visitor allows external media. All five designed providers stay, since one parser covers them. Embeds inside a post (#3775 to #3777) and video structured data (#3778) follow the launch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Own analytics (#7149)** | A field for the owner's Google Analytics or Plausible ID replaces today's Analytics switch, which loads numbers only the operator can read. Google Analytics loads after consent. It stays once the built-in stats page exists.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **First run (#7154)**     | The first dashboard view leads with the live site (provisioning takes about 10 seconds), a short checklist, Google first on `/signup`, and the wizard's last step explains the Sanity invite. Signing owners into the Studio ourselves is closed: Sanity's third-party login is deprecated and Enterprise-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Coming soon rows**      | A row on a paid plan either works or is absent. Comments (#1040) are hidden until built; ratings (#1041) are dropped and closed. The Features page and sidebar change is #7147.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Growth layers (#5714)** | A site that moves to Growth gets its type's Growth sections added at fixed slots, with placeholder images, so the paid modules arrive with an example. Applied at provisioning and on an upgrade, the Stripe one included; a downgrade removes nothing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Support (#7184)**       | A Help entry in the platform opens a short form whose message reaches a support address with the site, plan, account and page already attached. A help centre runs as a Docs site on the product itself. The marketing site's contact page stays for people who aren't customers yet. No chat widget or support tool until volume asks for one. Tickets #7184 to #7187, under #5085.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Takeaways (#5056)**     | A monthly allowance per plan replaces unlimited generation. Generation moves from `claude-haiku-4-5` to `claude-haiku-5-5`, a tenth of the price. The new model rejects the temperature the call sends today.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Owner tasks before the first payment: register for the EU's One Stop Shop VAT
scheme for non-EU sellers (no EU company is needed; confirm with an
accountant), open an API account with its own budget for the product's model
calls (a Claude subscription does not cover them), and confirm Resend's
current prices before the subscriber bands are fixed in Stripe.

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

## Plans and prices

Decided 2026-11-11. Amounts live only in Stripe (#5066); this table is the
decision, not a second source.

|                                    | Free                          | Starter                   | Growth         |
| ---------------------------------- | ----------------------------- | ------------------------- | -------------- |
| Monthly                            | $0                            | $6                        | $19            |
| Yearly, per month                  | $0                            | $5                        | $15            |
| Address                            | Subdomain                     | Own domain                | Own domain     |
| "Powered by" mark                  | Shown                         | Removed                   | Removed        |
| Languages                          | 1                             | 1                         | 3              |
| Modules                            | Blog set                      | Blog set and contact form | All            |
| Look                               | Preset, accent, logo, favicon | As Free                   | Everything     |
| Own analytics                      | No                            | Yes                       | Yes            |
| Newsletter                         | No                            | No                        | Yes            |
| Reader accounts and bookmarks      | No                            | No                        | Yes            |
| Seats                              | 1                             | 1                         | 3              |
| Own Google and GitHub sign-in apps | No                            | No                        | Yes            |
| Takeaways a month                  | 5 posts                       | 20 posts                  | 100 posts      |
| Translation drafts a month         | None                          | None                      | 60, once built |
| Preview link, embed module         | Yes                           | Yes                       | Yes            |

Growth includes 1,000 confirmed subscribers. Above that it adds, per month:
$12 to 2,500, $25 to 5,000, $50 to 10,000 and $110 to 25,000; beyond that the
owner talks to us. Only confirmed subscribers count. A site that passes its
band gets an email and a grace period and moves up at its next billing date.
Each band includes about six sends per subscriber a month.

- **Currencies:** dollars, euros and pounds ($19, €19, £16; $6, €6, £5).
  Regional discounts come after launch as Stripe coupons, never as a second
  price list.
- **Tax:** Stripe with Stripe Tax, no merchant of record. Prices include tax
  in the EU and UK and add it in the US.
- **Yearly** is two months free. The 14-day trial with no card stands.
- The contact form moves out of the Growth module pack so Starter can hold it.

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

First, in this order (owner, 2026-11-11; no tickets cut except where named):

1. Keyword search on `/search`. The semantic design (#1045) comes later, for
   large sites.
2. A built-in stats page: views per post, top posts, referrers, subscriber
   growth and sends.
3. AI translation drafts: a post written once gets a draft in the site's
   other languages.
4. AI starter copy in onboarding, from one sentence about the site.
5. The Business and Product site types.
6. Editor helpers (SEO description, alt text, title), one at a time.
7. Regional discounts as Stripe coupons.
8. AI-search controls: an `llms.txt` and crawler rules per site.
9. A webhook for contact-form leads.
10. A gallery module: an image grid with a lightbox, the first new module.
11. The project content type with its latest-projects cards and archive
    (#1291).

No other new module is needed for the launch: the embed module is the only
one in its scope. The location module (#2792) ships with the Business site type.

When a client asks, or once signups show who the audience is: an import skill
the owner runs locally (WordPress and Substack first; a script copies body
text, the model only maps and reports), reader payments (until then an owner
links their own payment page from a Call to Action), comments (#1040),
semantic search, and standalone newsletter issues and digests.

Unchanged, behind those:

| Epic      | What it delivers                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| **#5028** | Text roles: one `TEXT_ROLE` registry, so the same role looks identical in every module.                                |
| **#5016** | Skins: a palette tier and a role tier on `[data-skin]`, generated from `SKIN_REGISTRY`.                                |
| **#5067** | Per-tenant module styles: more Look settings, then per-module overrides, then plan-gated named variants.               |
| **#5106** | Convention infrastructure: shared types, helpers, recipes, test fakes, and file-size and prop-ceiling gates.           |
| **#5134** | Component structure: long prop lists and oversized files fixed at their source.                                        |
| **#5150** | Docs: retire the design docs and SPEC.md sections the feature catalogue now covers, and add a feature-docs check.      |
| **#5197** | Retire the legacy hero. Also ready to pull: location #2792, price-period wording #4022, post-module image shape #3245. |

## Ideas

Filed as `prio:someday` idea epics under #5150's sweep of the old backlog:
visibility windows on modules, popular posts by bookmarks, series, a hero
search field, generated hero art, light/dark image pairs, living posts,
constellation home, reader lenses and a fine-tuned voice model. Also: continue
reading (#2799), live subscriber count (#2801) and module presets (#2803).

## Open decisions

- **Domain:** the admin is `platform.<domain>`, but the domain itself is not
  chosen. It doesn't block development.
- **Translation model:** Sonnet or Haiku for translation drafts, settled by
  testing both on real posts. Sonnet costs about $0.05 a post and language,
  Haiku about $0.002.
- **Vendor plans**: Resend Pro timing, now tied to the newsletter. Vercel is
  on paid Pro.
- **Status page:** none for the launch (owner, 2026-11-11); during an outage owners are emailed. The support channel is decided: see "Added to the launch".

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
  tenants selling their own plans through Stripe Connect. Reader payments
  are revisited once signups show whether writers are the audience (owner,
  2026-11-11); if built, we take no percentage.
