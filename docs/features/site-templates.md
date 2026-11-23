---
title: Site templates
status: partial
layers: [config, worker, db, studio, platform-app]
code:
  - packages/config/src/starter-content/**
  - packages/config/src/constants/starter-document.ts
  - apps/worker/src/units/apply-site-template.ts
  - apps/worker/src/units/remove-sample-content.ts
  - apps/worker/src/app/api/sample-content/remove/route.ts
  - apps/worker/src/utils/sample-content/**
  - apps/worker/src/steps/seed-content.ts
  - apps/worker/src/utils/migration-ledger/**
  - packages/db/src/queries/site-config/insert-site-config-if-missing/**
  - packages/db/src/queries/tenants/set-tenant-site-template-version/**
  - packages/studio/src/starter-content.test.ts
  - apps/platform/src/server/sample-content/**
  - apps/platform/src/components/features/tenants/owner-home-view/components/sample-content-card/**
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
- **`tenants.site_type`** — which template to seed. Signup records the type the owner picks, and offers every type above (`SELF_SERVE_SITE_TYPE` in `apps/platform`); a type is offered only once its template is built. A tenant created without one seeds Blank.
- **`tenants.site_template_version`** — set to `STARTER_TEMPLATE_VERSION` (1) once the template is applied.
- **`site_config`** — the type's preset (Blog, Portfolio and Personal `EDITORIAL`, Docs, Business, Product and Blank `CONSOLE`) with that preset's theme tokens, card style and header control style, inserted only when the tenant has no row.
- **`settings_features`** — provisioning writes no row, so features follow the tenant's current preset defaults ([Plans and entitlements](plans-and-entitlements.md)).
- **Currency** — Site Settings seeds `DEFAULT_SITE_CURRENCY` (USD); choosing it at signup is #5681.
- **Migration ledger** — the seed transaction also creates the dataset's `migrationState` ledger, listing every id in `@shinefold/config`'s generated `STUDIO_MIGRATION_IDS` as applied, so the next cross-tenant run replays none of them on content that is already at the current schema. It also records the Growth layer once applied ([Applying a layer](#applying-a-layer)).

## Constraints and invariants

- **Create-if-missing, everywhere.** Sanity documents use `createIfNotExists`; `site_config` uses an insert that does nothing when a row exists. A re-run never overwrites an owner's content or look.
- **Seeding runs once per dataset.** The seed step skips a dataset that already has a `settings_site`, so changing a tenant's type later adds nothing; "change type" is future work.
- **Every seeded document is schema-valid.** The Free layouts need no image: no Blog or Blank field needs one, and the hero renders without media. A Growth layer's images are the placeholder SVGs the worker uploads.
- **Growth layers apply at provisioning and on upgrade.** The worker's `POST /api/growth-layer/apply` runs the same layer on an already-provisioned site, and every plan change that reaches the `GROWTH` module pack calls it ([plans and entitlements](./plans-and-entitlements.md)).

## Growth layer

`@shinefold/config`'s `buildGrowthLayer({ siteType, locale, placeholderImages })` returns the Growth sections a type adds to its Free site, or `null` for a type with none (Blog, Docs and Blank today).

- **What it returns** — `documents`, the module documents and the items they reference (feature cards, testimonials, team members), each typed against the generated Sanity types; and `homeSlots`, one `{ slot, after }` per section for the home template's `modules`, where `after` is the id of the slot it follows: a Free module, or the Growth slot before it.
- **Placeholder images** — `placeholderImages` maps each `STARTER_PLACEHOLDER_IMAGE` (`LOGO`, `ILLUSTRATION`) to a Sanity image asset id. A logo-wall logo and a feature-highlights row need an uploaded image to be schema-valid; every other section uses an icon or initials.
- **Portfolio** — after the introduction: feature highlights (two rows on the illustration placeholder), a logo wall (four logos on the logo placeholder), a timeline and two testimonials.
- **Personal** — after the introduction: a timeline and three feature cards with icons.
- **Business** — after the introduction: three feature cards with icons, a band of sample figures, a logo wall, three team members (initials until the owner adds photos) and two testimonials.
- **Product** — after the introduction: feature highlights (two rows on the illustration placeholder), three feature cards with icons, a band of sample figures, two testimonials, a logo wall and a pricing table of three tiers — a free tier, a recommended tier with sample monthly and yearly prices, and a contact-us tier — in the site's currency.
- **Ids** — `starter.<type>.<section>`, with each section's items under it (`starter.business.teamMember1`), so removing sample content treats them like the Free samples.
- **Copy** — each type's `growth` entry in the per-locale catalogue.

### Applying a layer

`applySiteTemplate` hands `seedTenantContent` the worker's `applyGrowthLayer` step when the tenant's resolved entitlements (`getTenantEntitlements`, grants included) hold the `GROWTH` module pack — the check is `isGrowthLayerEntitled`. Seeding runs it in the same `SEED_CONTENT` step with its own `editor` token, after persisting that token on a fresh dataset, and straight after its `settings_site` check on one already seeded — so a reactivated tenant whose write token was cleared still gets it. A failure keeps the persisted token, and the unit's retry runs the layer again on an already-seeded dataset.

- **Applied once per dataset** — the same transaction appends a `growth-layer` entry to the `migrationState` ledger's `applied` list (the migration runner ignores ids it has no migration for), and a run that finds the entry writes and uploads nothing. A section the owner deleted, or cleared with **Remove sample content**, therefore stays gone on a re-run. A dataset without a ledger (seeded before the ledger existed) gets no entry and the layer again on each run. A plan change never clears the entry, so a site that leaves Growth and returns keeps whatever the owner did with its sections.

- **On upgrade** — a signed `POST /api/growth-layer/apply` (`{ tenantId }`) starts the durable `applyGrowthLayerOnUpgrade` run, whose one step, `ensureGrowthLayerApplied`, re-checks `isGrowthLayerEntitled` (a tenant no longer entitled gets nothing written) and runs `applyGrowthLayer` on the tenant's write client. It answers 202 with `{ runId }`, 404 for an unknown tenant and 409 `NOT_PROVISIONED` without a write token; a failure retries `PROVISIONING_UNIT_MAX_RETRIES` times and is logged as `growth_layer.apply_failed` once they are spent.
- **Placeholder images** — on a run that applies the layer, it uploads the logo and illustration SVGs to the tenant's dataset on every Growth tenant, and passes their asset ids to `buildGrowthLayer`. Sanity keys an asset by its content hash, so a re-run reuses the assets already there.
- **Documents** — each layer document is created with `createIfNotExists`, so an owner's edits survive a re-run.
- **Home slots** — each slot missing from the published `template_home`'s `modules` (by `_key` or by reference) is placed after the slot it follows, or last when the owner removed that one; the owner's own order and modules stay as they are. The patch carries the template's revision, so an edit published mid-run fails the commit and the unit's retry re-reads it. A missing home template gets the documents and no slots.
- **Cost** — one fetch per Growth provisioning, plus two asset uploads and one transaction when the layer is applied.
- **Known edges** — a pending draft of `template_home` is not patched, so publishing it drops the new slots; a type with no layer (Blog, Docs, Blank) still receives the two placeholder assets.

## Removing samples

The worker's `removeSampleContent(tenantId)` unit clears the samples in one Sanity transaction and returns what it removed, what it kept as **edited** and what it kept as **referenced**. The platform triggers it with a signed `POST /api/sample-content/remove` (`{ tenantId }`, under `WORKER_ENQUEUE_SECRET`), which runs the removal in the request — not as a Workflow run — and answers `200` with `{ removed, keptEdited, keptReferenced }`: `removed` lists document ids, and each kept item is `{ id, type, title }` — its `_type`, and its `title` in the tenant's default locale — an author's `name`, which it has in place of a title — omitted when the document has neither (the platform then labels it by type alone). An unknown tenant gets `404 NOT_FOUND`, one without a Sanity project or write token `409 NOT_PROVISIONED`, one whose status is outside `WRITABLE_TENANT_STATUSES` (suspended or archived) `409 NOT_WRITABLE` — the worker is the backstop behind the platform's own status check, and the platform shows that refusal as the suspended-or-archived message — and a failed removal is logged once (`sample_content.removal_failed`) and answered `500 SERVER_ERROR`, which the platform shows as retryable.

The owner's overview (`/dashboard`) shows a **Sample content** card to the site's owner and operators once provisioning is ready, on every site type but Blank, which seeds no samples. **Remove sample content** asks for confirmation, then runs `removeSampleContentAction`, which checks the tenant is writable itself (a suspended or archived site gets the button disabled with the reason, and the action refuses it before calling the worker) and waits for the worker's answer. A success toasts how many samples were removed and lists the kept ones in the card, edited and referenced apart, each by its title above a translated label for its kind (section, page, post, page template, navigation link, author, topic) — or the label alone when it has no title. A failure keeps the dialog open with a retryable error.

- **Edited** — a `starter.*` document changed since seeding (`_updatedAt` differs from `_createdAt`), or one with a pending draft or release version, is kept.
- **Unlinked** — each unedited sample is deleted, and the array items referencing it are removed by `_key` from the seeded home template's modules, the navigation's links and the post-index template's modules, guarded by each document's revision.
- **Referenced** — an unedited sample is kept when a single field holds it (the home hero, the topic and tag index templates), when the array item holding it also holds something else (a navigation link with the owner's sub-items, so no array drops below its minimum), or when any other document references it: the owner's own content, a draft, or an edited sample. A kept document keeps the samples it references in turn.
- **Revision-guarded** — every removed document and every unlinked seeded document carries the revision the step read, so an edit published mid-run fails the commit, and the owner's retry re-plans from a fresh read.
- **Known edges** — a draft started mid-run on an unedited sample survives as an orphaned draft of a deleted document; a retry after a commit whose response was lost reports nothing removed, because the samples are already gone.

## Dependencies

[Tenant provisioning](tenant-provisioning.md) runs the `applySiteTemplate` unit (`SEED_CONTENT` step). [Cross-tenant migrations](cross-tenant-migrations.md) seeds the index pages for tenants seeded before templates, and reads the migration ledger the seed writes.

## Tests

- `packages/studio/src/starter-content.test.ts` — every Blog, Portfolio, Personal, Docs, Business, Product and Blank document, and every Growth layer document with its home slots, passes Studio validation in every default language.
- `packages/config/src/starter-content/starter-content.test.ts` — ids are stable and unique, every reference resolves, values carry the requested locale, SEO stays within its bounds; Growth layers add only new ids, place each section in the Free home and use the placeholder image of their kind.
- `packages/config/src/starter-content/copy/starter-copy.test.ts` — every locale matches the `en` catalogue's shape.
- `apps/worker/src/units/remove-sample-content.test.ts`, `apps/worker/src/utils/sample-content/plan-sample-content-removal.test.ts` — what is removed, unlinked and kept, and why; `apps/worker/src/utils/sample-content/kept-samples.test.ts` — how each kept sample is named.
- `apps/worker/src/app/api/sample-content/remove/route.test.ts` — the signature, tenant, provisioning and status refusals, the result body and a failed removal.
- `apps/platform/src/server/sample-content/remove-sample-content-action.test.ts`, `sample-content-for.test.ts` and the `sample-content-card` test — who is offered removal, the status refusal, the result by kind, and the failures.
- `apps/worker/src/steps/apply-growth-layer.test.ts`, `apps/worker/src/utils/growth-layer/growth-home-modules.test.ts` — the placeholder upload, the created documents and where each slot lands.
- `apps/worker/src/units/ensure-growth-layer-applied.test.ts`, `apps/worker/src/app/api/growth-layer/apply/route.test.ts` — the upgrade run applies the layer only while entitled, and the route's signature and refusals.
- `apps/worker/src/units/apply-site-template.test.ts`, `apps/worker/src/steps/seed-content.test.ts`, `apps/worker/src/utils/migration-ledger/migration-ledger.test.ts`.

## Related epics

#2798 (site templates), #5714 (Growth layers), #4840 (platform front door), #5681 (currency at signup), #5669 (migration ledger). Portfolio #4967, Personal #4968, Docs #4969, Business #4973, Product #4974.
