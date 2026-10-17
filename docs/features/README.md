# Feature catalogue

One page per feature — the per-feature reference that `CLAUDE.md`'s "Feature
docs" bullet names: what the feature does, its surfaces and routes, its data
(Sanity documents, Neon tables), configuration and plan gating, constraints and
invariants, dependencies, entry points, tests and stories, and related epics.
`SPEC.md` stays the architecture core — layer contracts, data flow and
cross-cutting rules — and a feature page never restates it. A PR that changes a
feature's behaviour updates its page in the same PR, and a PR that adds a
feature adds its page and a row here. Status is `built`, `partial` (some of the
feature ships, the rest is designed or ticketed) or `planned` (nothing of it is
on the public site or the platform yet).

## Tenancy and platform

| Page                                                                  | Status  | Layers                                    | One-line purpose                                                                                                        |
| --------------------------------------------------------------------- | ------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Multi-tenancy](multi-tenancy.md)                                     | built   | web, service, db, config                  | One `apps/web` deployment serves every tenant, matched by `Host` header to its own Sanity project and Neon rows.        |
| [Tenant provisioning](tenant-provisioning.md)                         | built   | db, platform, web, config                 | An operator creates a tenant; a workflow gives it a Sanity project, starter content, tokens, a domain and a webhook.    |
| [Tenant access](tenant-access.md)                                     | built   | db, auth, email, platform                 | Who may run which tenant: operators via `admins`, owners via `memberships`, pending owners via invites.                 |
| [Plans and entitlements](plans-and-entitlements.md)                   | partial | config, db, studio, web, platform         | A tenant's `FREE` or `GROWTH` plan caps which capabilities, how many languages and which platform pages it gets.        |
| [Platform shell](platform-shell.md)                                   | built   | platform, db, auth, config                | The sidebar, topbar and content column every signed-in `apps/platform` page renders inside, in three gated trees.       |
| [Platform sign-in and onboarding](platform-sign-in-and-onboarding.md) | partial | platform, auth, db, email, config, worker | How a person gets into `apps/platform` and into a workspace: one `/sign-in`, a `/signup` gate, an `/onboarding` wizard. |
| [Embedded Studio](embedded-studio.md)                                 | built   | studio, platform, db, config              | One Studio from `@blog/studio`, mounted in the platform per tenant and pointed at that tenant's Sanity project.         |
| [Audit events and findings](audit-and-findings.md)                    | partial | db, platform, config                      | An append-only log of who did what to a tenant, and open/resolved conditions an operator should act on.                 |
| [Operator alerts](operator-alerts.md)                                 | built   | platform, email, db, config               | Emails SUPERADMINs when a background job finds a tenant needing a human, such as stuck Sanity access.                   |
| [Cross-tenant migrations](cross-tenant-migrations.md)                 | built   | studio, db                                | Runs content migrations for the one shared schema against every tenant's Sanity project.                                |
| [Platform releases](platform-releases.md)                             | planned | config, utils                             | A SUPERADMIN sees the release candidate, runs the contrast check and cuts a production release.                         |

## Look, copy and languages

| Page                                                        | Status | Layers                                     | One-line purpose                                                                                               |
| ----------------------------------------------------------- | ------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| [Look](look.md)                                             | built  | config, db, web, platform                  | The owner styles the public site without code: preset, hues, fonts, radius, density and card style.            |
| [Voice](voice.md)                                           | built  | config, db, web, platform                  | The owner rewords the site's page-level prose — empty states, 404 and error pages — per live language.         |
| [Languages](languages.md)                                   | built  | config, db, studio, service, web, platform | A site publishes in one or more curated languages, the default unprefixed and the rest under a prefix.         |
| [Design tokens and surfaces](design-tokens-and-surfaces.md) | built  | config, ui, web, platform                  | One token layer feeds every colour, size, radius, spacing, shadow and duration; Look overrides a fixed subset. |
| [Toasts](toasts.md)                                         | built  | ui, web, platform, config                  | Short non-blocking notices confirming or reporting the outcome of an action, on both apps.                     |

## Content and pages

| Page                                                | Status  | Layers                           | One-line purpose                                                                                                |
| --------------------------------------------------- | ------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [Page types](page-types.md)                         | built   | config, studio, service, web     | Every public page is a Sanity document of one of eight fixed types, each with its own heading, SEO and slug.    |
| [Landing tree](landing-tree.md)                     | built   | config, studio, service, web     | Free-form landing pages nest under parents to build sections with their own sidebar navigation and breadcrumbs. |
| [Module system](module-system.md)                   | built   | config, studio, service, web     | Pages are built from reusable module documents that a page template references in order.                        |
| [Links](links.md)                                   | built   | config, studio, service, web     | A link is authored once as a `link` document and every place that links points at it.                           |
| [People](people.md)                                 | built   | config, studio, service, ui, web | One reusable record for an author, team member or profile subject, shown wherever the site credits them.        |
| [Studio authoring](studio-authoring.md)             | built   | studio, config                   | How content is modelled and edited in the Studio: the desk, the shared field kit, previews and validation.      |
| [Navigation](navigation.md)                         | built   | studio, service, ui, web         | The site header: brand lockup, curated top-level links and trailing controls, collapsing below `lg`.            |
| [Footer and legal pages](footer-and-legal-pages.md) | partial | studio, service, ui, web         | The footer closes every page with copyright, social links and settings; legal pages are not built yet.          |
| [Errors and 404](errors-and-404.md)                 | built   | web, platform, config            | A tenant-themed, translated 404 and error panels with recovery actions, on both apps.                           |

## Reading

| Page                                        | Status  | Layers                           | One-line purpose                                                                                               |
| ------------------------------------------- | ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [Posts](posts.md)                           | built   | studio, service, ui, web, db     | An article written in the Studio and rendered at `/blog/{slug}` with byline, reading time, share and bookmark. |
| [Rich text](rich-text.md)                   | built   | config, studio, service, ui, web | Portable Text authored in the Studio and rendered by one shared renderer, in three allowed shapes.             |
| [Topics and tags](topics-and-tags.md)       | built   | studio, service, web             | Each post has one topic and up to six tags, each with an archive page, plus index pages for both.              |
| [Reading experience](reading-experience.md) | built   | config, utils, service, ui, web  | A post offers three depths — 30s takeaways, Read and Deep — from a control above the article.                  |
| [Skim pipeline](skim-pipeline.md)           | partial | studio, service, web, db         | On publish, Claude drafts 3–7 takeaways onto the post's draft for an editor to review.                         |

## Modules

| Page                                                      | Status | Layers                           | One-line purpose                                                                                              |
| --------------------------------------------------------- | ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [Heroes](heroes.md)                                       | built  | config, studio, service, ui, web | The optional opening band of a page, owning its `<h1>`, in Blog, Statement or Profile kinds.                  |
| [Post modules](post-modules.md)                           | built  | config, studio, service, ui, web | Latest Posts, Featured Posts, Post List and Related Reading — four modules that put posts on a page as cards. |
| [Content module](content-module.md)                       | built  | studio, service, ui, web         | A section of rich text placed between a page's other modules.                                                 |
| [Call to Action module](cta-module.md)                    | built  | config, studio, service, ui, web | A focused section asking the reader to do one thing, with up to two actions in one of three shapes.           |
| [FAQ module](faq-module.md)                               | built  | config, studio, service, ui, web | Reusable question-and-answer items shown as disclosure rows.                                                  |
| [Feature Highlights module](feature-highlights-module.md) | built  | config, studio, service, ui, web | Two to six alternating image-and-text rows telling a short story.                                             |
| [Feature List module](feature-list-module.md)             | built  | config, studio, service, ui, web | A grid or carousel of reusable feature cards summarising capabilities or offerings.                           |
| [Logo wall module](logo-wall-module.md)                   | built  | studio, service, ui, web         | Partner or client logos in same-size tiles, as a wrapping row or a carousel.                                  |
| [Pricing module](pricing-module.md)                       | built  | config, studio, service, ui, web | A table of up to four plan tiers with prices, features, actions and a recommendation badge.                   |
| [Section Pages module](section-pages-module.md)           | built  | studio, service, ui, web         | Turns a landing page into a hub with one card per direct child page.                                          |
| [Stats module](stats-module.md)                           | built  | studio, service, web             | A band of figures, each with a value, a label and optional context.                                           |
| [Taxonomy List module](taxonomy-list-module.md)           | built  | config, studio, service, ui, web | A browsable grid of topics or tags with descriptions, post counts and newest posts.                           |
| [Team module](team-module.md)                             | built  | studio, service, web             | Introduces people picked from Person documents as a spotlight, card grid or carousel.                         |
| [Testimonial module](testimonial-module.md)               | built  | studio, service, ui, web         | Reusable quotes shown as a spotlight, card grid or carousel.                                                  |
| [Timeline module](timeline-module.md)                     | built  | config, studio, service, ui, web | Steps or milestones as points on one connected line.                                                          |

## Readers

| Page                                              | Status  | Layers                                        | One-line purpose                                                                                       |
| ------------------------------------------------- | ------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Reader sign-in](reader-auth.md)                  | built   | auth, db, email, web                          | A reader signs in from the header with GitHub, Google or a magic link, on a Neon database session.     |
| [Reader account](reader-account.md)               | built   | db, web, ui                                   | A signed-in reader manages name, linked providers, newsletter, data export and deletion at `/account`. |
| [Bookmarks](bookmarks.md)                         | built   | db, service, ui, web                          | A signed-in reader privately saves posts and finds them on `/bookmarks`.                               |
| [Newsletter](newsletter.md)                       | partial | studio, service, ui, web, db, email, platform | A signup module with double opt-in confirmation and one-click unsubscribe.                             |
| [Consent and analytics](consent-and-analytics.md) | partial | config, ui, web                               | A cookie consent banner and reopenable preferences dialog, read from a first-party cookie.             |

## Delivery

| Page                                              | Status  | Layers                                 | One-line purpose                                                                                         |
| ------------------------------------------------- | ------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [Rendering and caching](rendering-and-caching.md) | built   | service, web, config, platform, db     | Pages render on first request and are cached; a signed publish webhook expires the affected tags.        |
| [SEO and feeds](seo-and-feeds.md)                 | built   | studio, service, web                   | Every page emits its authored metadata and `hreflang` alternates, with structured data and feeds.        |
| [Email](email.md)                                 | partial | email, db, auth, web, platform, config | Every email is built and sent by `@blog/email`; tenant mail carries the tenant's look and editable copy. |
| [Client error capture](client-error-capture.md)   | built   | web                                    | Browser-side failures are reported to the site's own endpoint and written to the server log.             |

## Planned

| Page                                            | Status  | Layers                                                 | One-line purpose                                                                            |
| ----------------------------------------------- | ------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [Comments and ratings](comments-and-ratings.md) | planned | config, db, ui, web, platform, studio                  | Threaded, moderated comments and a 1–5 rating per reader per post.                          |
| [Contact form](contact-form.md)                 | built   | config, db, email, ui, platform, studio, service, web  | A visitor messages the owner from a form; each message is stored as a lead and emailed.     |
| [Embed module](embed-module.md)                 | planned | config, studio, service, ui, web                       | Video, booking calendar or map embeds, loaded only after the visitor allows External media. |
| [Location module](location-module.md)           | planned | studio, service, ui, web                               | Address, opening hours and a map, feeding `LocalBusiness` structured data.                  |
| [Public front door](public-front-door.md)       | planned | config, db, auth, email, studio, web, platform, worker | A marketing site, self-serve signup and Stripe billing with trials for the platform.        |
| [Search](search.md)                             | planned | db, service, web                                       | A `/search` page ranking a site's posts by meaning rather than keyword match.               |
