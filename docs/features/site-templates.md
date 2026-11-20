---
title: Site templates
status: partial
layers: [config, worker, db, studio]
code:
  - packages/config/src/starter-content/**
  - apps/worker/src/units/apply-site-template.ts
  - apps/worker/src/units/remove-sample-content.ts
  - apps/worker/src/app/api/sample-content/remove/route.ts
  - apps/worker/src/utils/sample-content/**
  - apps/worker/src/steps/seed-content.ts
  - apps/worker/src/utils/migration-ledger/**
  - packages/db/src/queries/site-config/insert-site-config-if-missing/**
  - packages/db/src/queries/tenants/set-tenant-site-template-version/**
  - packages/studio/src/starter-content.test.ts
epics: [2798, 4840]
---

# Site templates

## What it does

A new tenant starts on a site that matches what it is building rather than an empty home. Provisioning seeds the starter documents of the tenant's site type, in its default language, and gives it the look that suits the type. Every site type is built: **Blog**, **Portfolio**, **Personal**, **Docs**, **Business**, **Product** and **Blank**. A tenant with no site type starts from Blank.

## Surfaces and routes

No route of its own. The seeded documents are what the public site renders and what the owner edits in the Studio.

- **Blank** — Site Settings, the primary navigation (empty), the footer, a home page with a heading and no modules, and the `/blog` index.
- **Portfolio** — everything Blank seeds, plus: a home that opens with a profile hero for an author named after the site (initials until the owner adds a photo), then an introduction and a call to action linking to Work; a Work page whose section-pages module lists its child pages; two sample projects under it at `/work/<slug>`, each with its own template and body; and a navigation link to Work.
- **Personal** — everything Blank seeds, plus: a home that opens with a profile hero for an author named after the site (initials until the owner adds a photo), then an introduction, three sample questions and answers, and a call to action linking to the blog; a post list on `/blog`, so posts appear there once the owner publishes; and a navigation link to the blog, labelled Writing.
- **Docs** — everything Blank seeds, plus: a home that opens with a statement hero whose action links to Guides, then an introduction and three sample questions and answers; a Guides page that turns on section navigation (titled after the page) and whose section-pages module lists its child pages; three sample guides under it at `/guides/<slug>` (getting started, core concepts, troubleshooting), each with its own template and body, so the sidebar and breadcrumbs work across them; and a navigation link to Guides. Slugs are localised (`guides`, `handleidingen`, `guides`, `anleitungen`, `guias`).
- **Business** — everything Blank seeds, plus: a home that opens with a statement hero whose action links to Services, then an introduction, three sample questions and answers, and a call to action linking to Contact; three top-level pages, Services, About and Contact, each with its own template and body; and navigation links to all three. Slugs are localised (`services`/`diensten`/`leistungen`/`servicios`, `about`/`over-ons`/`a-propos`/`ueber-uns`/`sobre-nosotros`, `contact`/`kontakt`/`contacto`). It uses Free modules only; there is no agency copy variant yet.
- **Product** — everything Blank seeds, plus: a home that opens with a statement hero whose action links to the changelog, then an introduction, three sample questions and answers, and a call to action linking to the changelog; a post list on `/blog`, so release notes appear there once the owner publishes posts; and a navigation link to the blog, labelled Changelog. It uses Free modules only.
- **Blog** — everything Blank seeds, plus: a home that opens with a blog hero pinning the welcome post, then the latest posts, a topic list and a call to action linking to About; `/blog` listing every post; the topic and tag indexes; one topic with its page; an About page; a welcome post by an author named after the site; and navigation links to the blog and About.

## Data

- **Sanity** — `@shinefold/config`'s `buildStarterDocuments({ siteType, siteName, locale, publishedAt })` builds the documents, each typed against the generated Sanity types. Copy comes from one catalogue per locale (`src/starter-content/copy/starter-copy.<locale>.json`, `en` the shape the others match). Slugs are localised with the copy (About is `about`, `over`, `a-propos`, `ueber` or `acerca-de`).
- **Ids** — the base documents keep their `provisioning.*` ids, a contract with tenants seeded before templates existed. Template documents use `starter.<type>.<doc>`. The topic and tag index pages and their lists reuse the ids the Studio migrations seed (`page_topicIndex`, `taxonomyList-topics`, `page_tagIndex`, `taxonomyList-tags`), so a later migration converges on the same documents instead of duplicating them.
- **`tenants.site_type`** — which template to seed. Nothing writes it yet, so every tenant seeds Blank until signup records a type.
- **`tenants.site_template_version`** — set to `STARTER_TEMPLATE_VERSION` (1) once the template is applied.
- **`site_config`** — the type's preset (Blog, Portfolio and Personal `EDITORIAL`, Docs, Business, Product and Blank `CONSOLE`) with that preset's theme tokens, card style and header control style, inserted only when the tenant has no row.
- **`settings_features`** — provisioning writes no row, so features follow the tenant's current preset defaults ([Plans and entitlements](plans-and-entitlements.md)).
- **Currency** — Site Settings seeds `DEFAULT_SITE_CURRENCY` (USD); choosing it at signup is #5681.
- **Migration ledger** — the seed transaction also creates the dataset's `migrationState` ledger, listing every id in `@shinefold/config`'s generated `STUDIO_MIGRATION_IDS` as applied, so the next cross-tenant run replays none of them on content that is already at the current schema.

## Constraints and invariants

- **Create-if-missing, everywhere.** Sanity documents use `createIfNotExists`; `site_config` uses an insert that does nothing when a row exists. A re-run never overwrites an owner's content or look.
- **Seeding runs once per dataset.** The seed step skips a dataset that already has a `settings_site`, so changing a tenant's type later adds nothing; "change type" is future work.
- **Every seeded document is schema-valid.** No placeholder images: no Blog or Blank field needs one, and the hero renders without media.
- **No Growth layer yet.** Every built type seeds the same documents on every plan; Growth layers (Portfolio's, Personal's, Business's and Product's), their placeholder images and applying them on upgrade are #5714.

## Removing samples

The worker's `removeSampleContent(tenantId)` unit clears the samples in one Sanity transaction and returns what it removed, what it kept as **edited** and what it kept as **referenced**. The platform triggers it with a signed `POST /api/sample-content/remove` (`{ tenantId }`, under `WORKER_ENQUEUE_SECRET`), which runs the removal in the request — not as a Workflow run — and answers `200` with `{ removed, keptEdited, keptReferenced }`: `removed` lists document ids, and each kept item is `{ id, type, title }` — its `_type`, and its `title` in the tenant's default locale, omitted when the document has none (the platform then labels it by type alone). An unknown tenant gets `404 NOT_FOUND`, one without a Sanity project or write token `409 NOT_PROVISIONED`, one whose status is outside `WRITABLE_TENANT_STATUSES` (suspended or archived) `409 NOT_WRITABLE` — the worker is the backstop behind #4972's own status check — and a failed removal is logged once (`sample_content.removal_failed`) and answered `500 SERVER_ERROR`, which the platform shows as retryable. The owner-facing action is #4972.

- **Edited** — a `starter.*` document changed since seeding (`_updatedAt` differs from `_createdAt`), or one with a pending draft or release version, is kept.
- **Unlinked** — each unedited sample is deleted, and the array items referencing it are removed by `_key` from the seeded home template's modules, the navigation's links and the post-index template's modules, guarded by each document's revision.
- **Referenced** — an unedited sample is kept when a single field holds it (the home hero, the topic and tag index templates), when the array item holding it also holds something else (a navigation link with the owner's sub-items, so no array drops below its minimum), or when any other document references it: the owner's own content, a draft, or an edited sample. A kept document keeps the samples it references in turn.
- **Revision-guarded** — every removed document and every unlinked seeded document carries the revision the step read, so an edit published mid-run fails the commit, and the owner's retry re-plans from a fresh read.
- **Known edges** — a draft started mid-run on an unedited sample survives as an orphaned draft of a deleted document; a retry after a commit whose response was lost reports nothing removed, because the samples are already gone.

## Dependencies

[Tenant provisioning](tenant-provisioning.md) runs the `applySiteTemplate` unit (`SEED_CONTENT` step). [Cross-tenant migrations](cross-tenant-migrations.md) seeds the index pages for tenants seeded before templates, and reads the migration ledger the seed writes.

## Tests

- `packages/studio/src/starter-content.test.ts` — every Blog, Portfolio, Personal, Docs, Business, Product and Blank document passes Studio validation in every default language.
- `packages/config/src/starter-content/starter-content.test.ts` — ids are stable and unique, every reference resolves, values carry the requested locale, SEO stays within its bounds.
- `packages/config/src/starter-content/copy/starter-copy.test.ts` — every locale matches the `en` catalogue's shape.
- `apps/worker/src/units/remove-sample-content.test.ts`, `apps/worker/src/utils/sample-content/plan-sample-content-removal.test.ts` — what is removed, unlinked and kept, and why; `apps/worker/src/utils/sample-content/kept-samples.test.ts` — how each kept sample is named.
- `apps/worker/src/app/api/sample-content/remove/route.test.ts` — the signature, tenant, provisioning and status refusals, the result body and a failed removal.
- `apps/worker/src/units/apply-site-template.test.ts`, `apps/worker/src/steps/seed-content.test.ts`, `apps/worker/src/utils/migration-ledger/migration-ledger.test.ts`.

## Related epics

#2798 (site templates), #5714 (Growth layers), #4840 (platform front door), #5681 (currency at signup), #5669 (migration ledger). Portfolio #4967, Personal #4968, Docs #4969, Business #4973, Product #4974.
