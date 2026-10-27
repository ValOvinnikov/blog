---
title: Site templates
status: partial
layers: [config, worker, db, studio]
code:
  - packages/config/src/starter-content/**
  - apps/worker/src/units/apply-site-template.ts
  - apps/worker/src/steps/seed-content.ts
  - apps/worker/src/utils/migration-ledger/**
  - packages/db/src/queries/site-config/insert-site-config-if-missing/**
  - packages/db/src/queries/tenants/set-tenant-site-template-version/**
  - packages/studio/src/starter-content.test.ts
epics: [2798, 4840]
---

# Site templates

## What it does

A new tenant starts on a site that matches what it is building rather than an empty home. Provisioning seeds the starter documents of the tenant's site type, in its default language, and gives it the look that suits the type. Three types are built: **Blog**, **Portfolio** and **Blank**. Every other site type starts from Blank until its template ships.

## Surfaces and routes

No route of its own. The seeded documents are what the public site renders and what the owner edits in the Studio.

- **Blank** — Site Settings, the primary navigation (empty), the footer, a home page with a heading and no modules, and the `/blog` index.
- **Portfolio** — everything Blank seeds, plus: a home that opens with a profile hero for an author named after the site (initials until the owner adds a photo), then an introduction and a call to action linking to Work; a Work page whose section-pages module lists its child pages; two sample projects under it at `/work/<slug>`, each with its own template and body; and a navigation link to Work.
- **Blog** — everything Blank seeds, plus: a home that opens with a blog hero pinning the welcome post, then the latest posts, a topic list and a call to action linking to About; `/blog` listing every post; the topic and tag indexes; one topic with its page; an About page; a welcome post by an author named after the site; and navigation links to the blog and About.

## Data

- **Sanity** — `@blog/config`'s `buildStarterDocuments({ siteType, siteName, locale, publishedAt })` builds the documents, each typed against the generated Sanity types. Copy comes from one catalogue per locale (`src/starter-content/copy/starter-copy.<locale>.json`, `en` the shape the others match). Slugs are localised with the copy (About is `about`, `over`, `a-propos`, `ueber` or `acerca-de`).
- **Ids** — the base documents keep their `provisioning.*` ids, a contract with tenants seeded before templates existed. Template documents use `starter.<type>.<doc>`. The topic and tag index pages and their lists reuse the ids the Studio migrations seed (`page_topicIndex`, `taxonomyList-topics`, `page_tagIndex`, `taxonomyList-tags`), so a later migration converges on the same documents instead of duplicating them.
- **`tenants.site_type`** — which template to seed. Nothing writes it yet, so every tenant seeds Blank until signup records a type.
- **`tenants.site_template_version`** — set to `STARTER_TEMPLATE_VERSION` (1) once the template is applied.
- **`site_config`** — the type's preset (Blog and Portfolio `EDITORIAL`, Blank `CONSOLE`) with that preset's theme tokens, card style and header control style, inserted only when the tenant has no row.
- **`settings_features`** — provisioning writes no row, so features follow the tenant's current preset defaults ([Plans and entitlements](plans-and-entitlements.md)).
- **Currency** — Site Settings seeds `DEFAULT_SITE_CURRENCY` (USD); choosing it at signup is #5681.
- **Migration ledger** — the seed transaction also creates the dataset's `migrationState` ledger, listing every id in `@blog/config`'s generated `STUDIO_MIGRATION_IDS` as applied, so the next cross-tenant run replays none of them on content that is already at the current schema.

## Constraints and invariants

- **Create-if-missing, everywhere.** Sanity documents use `createIfNotExists`; `site_config` uses an insert that does nothing when a row exists. A re-run never overwrites an owner's content or look.
- **Seeding runs once per dataset.** The seed step skips a dataset that already has a `settings_site`, so changing a tenant's type later adds nothing; "change type" is future work.
- **Every seeded document is schema-valid.** No placeholder images: no Blog or Blank field needs one, and the hero renders without media.
- **No Growth layer yet.** Every built type seeds the same documents on every plan; Growth layers, their placeholder images and applying them on upgrade are #5714.

## Dependencies

[Tenant provisioning](tenant-provisioning.md) runs the `applySiteTemplate` unit (`SEED_CONTENT` step). [Cross-tenant migrations](cross-tenant-migrations.md) seeds the index pages for tenants seeded before templates, and reads the migration ledger the seed writes.

## Tests

- `packages/studio/src/starter-content.test.ts` — every Blog, Portfolio and Blank document passes Studio validation in every default language.
- `packages/config/src/starter-content/starter-content.test.ts` — ids are stable and unique, every reference resolves, values carry the requested locale, SEO stays within its bounds.
- `packages/config/src/starter-content/copy/starter-copy.test.ts` — every locale matches the `en` catalogue's shape.
- `apps/worker/src/units/apply-site-template.test.ts`, `apps/worker/src/steps/seed-content.test.ts`, `apps/worker/src/utils/migration-ledger/migration-ledger.test.ts`.

## Related epics

#2798 (site templates), #5714 (Growth layers), #4840 (platform front door), #5681 (currency at signup), #5669 (migration ledger). Portfolio #4967. Next types: Personal #4968, Docs #4969.
