# Deploy first, then migrate — design

Design of record for shipping a breaking content change across every tenant after launch, and for the clean start at launch. Owner-approved 2026-10-27.

## The project

A multi-tenant website platform: blogs first, with Portfolio, Personal, Docs, Blank, Business and Product site types built from page-builder modules. Each customer (a "tenant") gets their own public site on a subdomain or custom domain, and edits it in a Sanity Studio inside our admin app. Turborepo + pnpm monorepo; types are generated from the Sanity schema all the way through to the site. Studio is Sanity v6 (sanity ^6.19).

Three deployed apps, all on Vercel:

- apps/web: the public site, one deployment for every tenant. Each request is matched to a tenant by its domain; the page is rendered from that tenant's Sanity content.
- apps/platform: the admin app. Operators manage tenants, releases and data requests; tenant owners manage settings, domain and look, and edit content in the Studio mounted inside it. The Studio ships with this app.
- apps/worker: a non-public background app (Vercel Workflow) that creates a new tenant: its Sanity project, tokens, webhook, starter content and the owner's invite.

Data:

- Sanity holds content: one Sanity project per tenant, using one dataset (the free tier allows two per project). All projects share one schema. Page-builder modules are documents referenced from pages, not inline objects. A separate "console" project serves only as the fallback outside production; production never renders it.
- Neon Postgres (Drizzle) holds everything relational: tenant registry (domains, Sanity project id, dataset, encrypted tokens, plan, status: ACTIVE, SUSPENDED or ARCHIVED), users and sessions, memberships, site settings, subscribers, leads, bookmarks (keyed by the post's Sanity _id), audit events. Comments and ratings are planned for Postgres; no tables exist yet.

How each part finds a tenant's dataset and token:

- Web: tenant row by request domain (cached up to an hour) gives project id, dataset and an encrypted read token. The revalidation webhook handler reads the tenant row straight from Postgres, not from that cache, to check the tenant's own webhook secret. On a delete it also removes bookmarks of the deleted document.
- Studio: the platform reads the same tenant row and mounts the Studio with that project and dataset; editors sign in with their own Sanity accounts.
- Release migrations, today: the job lists ACTIVE, not-deprovisioned tenants and decrypts each tenant's write token.

## Launch: a clean start

- The current production (an old version, paused since September 2026) is replaced, not upgraded. Nothing in it is kept.
- Postgres: both databases (production on Neon branch `main`, and `development`) are dropped and recreated, not truncated, because Drizzle's own table would still record the 64 old migrations and the new baseline would fail on tables that exist. The 64 migrations are replaced by one baseline generated from the current schema.
- Sanity: all 90 content migrations are deleted. The production console project serves nothing in production, so it is deleted at launch along with the release's console-migration step. The dev console project stays as dev's fallback. It stops being migrated now, so it is reseeded from the starter content at the reset and rejoins dev's migration scope after launch. Its ledger may still list deleted ids, which is harmless: the runner treats pending as the migration folders minus the ledger, so ids without a folder are ignored.
- The 3 dev test tenants are deprovisioned and recreated through the worker, not patched, which rehearses exactly what the first production tenant goes through.
- Fresh keys for each recreated database, generated with `openssl rand -base64 32` and backed up in the team password manager before first use: `TENANT_TOKEN_ENCRYPTION_KEY`, `PERSONAL_DATA_ENCRYPTION_KEY` (a one-entry keyring, `v1:<key>`), `PERSONAL_DATA_INDEX_KEY` and `NEWSLETTER_UNSUBSCRIBE_KEY`. Production gets its set before its first deploy; dev gets a new set when its database is recreated, set in every Vercel project and GitHub Environment that reads them (`docs/context/environment-variables.md`) before the dev test tenants are recreated. The current values cannot be carried over: no backup of them exists outside the deployed env vars, and no database dump exists.
- Until the reset, no Sanity content migrations or hand-written data fixes are written: nothing on dev is worth keeping. A change to a content shape updates the starter content the worker seeds instead, so every new tenant starts at the current shape. Postgres schema migrations are still generated for every table or column change, because dev's database only gets them that way; they must apply to dev's existing rows (a new required column needs a default).
- After launch, content migrations return for every change to an existing shape, in option C's form below.
- Production's first content comes from dev (owner, 2026-10-31): the `marketing.dev` and `demo.dev` tenants are its source. Production creates those two tenants through the worker like any other, then launch needs two things no tool does yet:
  - A dev→prod Sanity dataset copy for each. Cloud Clone is Enterprise-only, so it is an export from the dev project and an import into the production project the worker created. Asset files go first, so asset ids come back unchanged.
  - A way to carry each tenant's Postgres settings across: site config, Voice, feature toggles, and email config and templates. They live in dev's registry, keyed by dev's tenant ids, and must land on production's new tenant rows.
- Every other production tenant is created like every new tenant: the worker creates its Sanity project and seeds starter content at the current shape.
- Dev switches to the post-launch order (deploy first, then migrate) before launch, so the first breaking change after launch has already been rehearsed.
- So launch has no migration problem. Everything below is about breaking changes after launch.
- The migration tooling stays for that: a ledger in each dataset (the migration ids it has applied; a new tenant gets the ids its worker build knows, so a tenant created mid-release picks up the rest on the next run), the fan-out job, a record of which tenant failed, and a per-tenant retry.
- Timing of the dev reset: now, before launch (owner, 2026-10-31). Production's reset stays at launch. Dev's order:
  1. Merge the clean-ups, in either order: every content migration deleted (#6439) and one Drizzle baseline (#6440). Auto-deploy is off, so nothing runs on merge, and no dev deploy is dispatched until step 5.
  2. Deprovision the 3 dev test tenants with `deprovision-tenant` while their rows and the current key exist, then delete their archived Sanity projects in Manage.
  3. Drop and recreate the dev Neon database.
  4. Generate dev's fresh key set, back it up, and set it everywhere it is read.
  5. Dispatch `deploy-development.yml`: `migrate-db` applies the baseline.
  6. Reseed the dev console project from the starter content, bootstrap the super admin, and recreate the platform tenant and the test tenants through the worker.
- Dev's database is clean (owner, 2026-10-31): no content migrations, and one Drizzle baseline.

## How we deploy today

- Environments: development and production, each with its own registry database and Sanity projects.
- Development: deploys are manual since September 2026 (Vercel cost), but a merge to main migrates dev content immediately, so dev content can run days ahead of dev code.
- Production release (started from the platform's Releases page): full test gate → back up and migrate Postgres → export and migrate the console project and every active tenant's dataset, one after another → tag → deploy web and platform (worker too). If a tenant migration fails, the release stops before the tag.

## Numbers

- Tenants: 0 in production; 3 test tenants on dev. In a year: [owner to fill].
- Time per tenant on dev with nothing pending: about 2 seconds (ledger check only). The whole dev run takes 20–90 seconds, mostly job setup. Dev runs do not export; production runs export each dataset before migrating it. Time per tenant with real content and a pending migration: unknown until launch; to be recorded split into export and migrate.
- Documents and assets per dataset: starter content is small; [owner to fill: expected size].
- Pre-launch churn: 90 migrations in four months (40 in October), all removed at launch. After launch: [owner to fill: expected breaking changes per month].

## Constraints

- Migrations run one by one only because the job is a simple loop. Sanity caps mutations at 25 requests a second per client IP, and @sanity/client does not retry a mutation that hits the limit. Parallel runs inside one job share that budget; separate runners usually get separate IPs, but not always. Our runner does not back off on 429 errors yet; adding that is a prerequisite of parallel copies.
- Isolation: each tenant has its own project, tokens and webhook secret, and our caches are keyed per tenant. Tenant datasets are public on the free tier (private datasets need a paid plan), so published content is world-readable; the isolation promise covers drafts, credentials and caches.
- Every new Sanity project starts on a Growth trial, so tenants may have drafts, scheduled drafts and release versions, not only published documents.
- Our exports include asset files today (no --no-assets flag). Exports count against the API quota, and the free plan blocks requests at a limit rather than billing the overage, so a daily full export of every tenant would hit it. Uploaded asset files never change, so backups take each asset file once, when it appears, and export documents daily without assets. Together they can rebuild a deleted dataset or project, but only in this order: upload the asset files first (asset ids come from the file contents, so they come back unchanged), then import the documents without the old asset documents, which point at the old project's file URLs. A full export is still taken before an ARCHIVED tenant is deprovisioned.
- Cost goal: no per-tenant cost until the first paying tenant. Vercel itself already costs money.

## After launch: how a breaking change ships

A. Migrate, then deploy (today), with expand/contract.

- Deploy gap: the old web reads migrated content until the deploy lands; if a release fails partway, migrated tenants keep running old code against new content.
- Studio gap: the Studio ships with the platform, after the migration, so editors save old-shape content into datasets already marked migrated, and nothing repairs it. The worker has the same gap for a tenant created mid-release.
- Recovery is a re-import of the pre-migration export, which loses edits made since the export.

B. Dataset switch: migrate a copy into the second dataset, deploy, switch each tenant. Server-side copy (Cloud Clone) and dataset aliases are Enterprise-only, so on the free tier every release is a full export and import per tenant, counted against API quota. It also loses edits made between copy and switch, needs each deployment to know its dataset and a cache purge per switch, and uses up the second dataset. Rejected on the free tier.

C. Deploy first, then migrate (preferred).

Rules every breaking change follows:

- It lands in a new field. A field never changes type in place, so both shapes can sit side by side.
- Renaming an object type inside an array (inline blocks, link items): copy the whole array into a new field, or the site renders both versions.
- Each old field stays in the schema, marked deprecated with a reason and read-only, so the Studio neither edits it nor offers to delete it as an unknown field.
- New fields stay optional until the clean-up (already our rule), so uncopied documents still publish.
- A copy never overwrites a new field an editor has already filled, so no Studio freeze is needed.
- Copies cover published documents, drafts, scheduled drafts and release versions; a missed version brings the old shape back when it publishes.

Renaming a document type (module types included, since modules are documents here). A document's _type cannot change, so, as in Sanity's own guidance, each document gets a replacement with a new _id and _type and every reference is repointed. That makes it not copy-only:

- The new _id is derived from the old one and created with createIfNotExists, so a retried copy never creates a replacement twice.
- The new document stores the old _id. Every query that reads both types, listings and single lookups alike (a page found by its slug), prefers the replacement and skips an old document that has one, so nothing shows twice and nothing resolves to a stale original.
- Slug checks are per type today, so a replacement never clashes with its original; any check across types must exclude the replacement's original, or editors cannot publish the replacement.
- The old type stays in the schema, deprecated and read-only, so an editor cannot change an old document between reading it and creating its replacement.
- References are repointed in published documents, drafts and versions. That rewrites existing documents, so release 1 exports the dataset first.
- Anything in Postgres keyed by a Sanity _id (bookmarks today) is remapped in the same step, and again just before release 2 deletes anything, because the delete webhook removes the bookmarks of a deleted post and a bookmark made on a stale original in between would otherwise be lost. Comments and ratings have no tables yet; they should be keyed by a stable id stored on the document and copied to its replacement.
- Release 2's gate also checks that nothing, drafts and versions included, still references an old document; a referenced document cannot be deleted.
- Any rollback past that release must point the references back first.

Scope: every tenant that still has a dataset, whatever its status (ACTIVE, SUSPENDED, ARCHIVED), so the clean-up gate can pass. Suspending or archiving revokes no Sanity token and keeps the project until deprovisioning, so their write tokens keep working (checked in code). Needs a retention period after which an ARCHIVED tenant is deprovisioned: [owner to fill], or every release migrates every tenant we have ever had.

Release 1, the change, in order:

1.  Full test gate, including the new release's end-to-end tests against un-migrated content and the previous release's against copied content.
2.  Back up Postgres; run only additive Postgres migrations (new tables and columns).
3.  Tag.
4.  Deploy web, platform and worker. The web reads both shapes; the Studio and worker write the new one.
5.  For every tenant in scope, in parallel (needs back-off on 429 first): mark the tenant "copying" in the registry, with an expiry → (for a document-type rename, export first) → run the copy migrations → record them in its ledger → clear the mark → purge the tenant's cache once. The webhook itself is never touched:
    - While the mark is live, the webhook handler skips revalidation, since a copy changes nothing visitors see. The handler must keep reading the mark uncached; if it ever read the hour-cached row, it could miss a live mark, or keep skipping real edits for up to an hour after the mark is cleared.
    - If the handler finds an expired mark that was never cleared, it purges the tenant's cache once and clears the mark, so a crashed run with no retry leaves no edits unpublished.
    - The mark is also a per-tenant lock: a release and a restore never migrate the same dataset at once.
6.  A tenant whose copy fails is behind, not broken, and is retried on its own.

Release 2, the clean-up (batched, on a known cadence), in order:

1.  Full test gate.
2.  Ledger gate: refuse to run until every in-scope ledger shows every copy step.
3.  Export every dataset without asset files (removing fields never touches assets; test one restore to confirm), and back up Postgres.
4.  Under each tenant's "copying" mark, fill a default wherever a field is about to become required, so no document is left unpublishable; the fill only writes empty values. Clear the mark and purge the tenant's cache once.
5.  Tag.
6.  Deploy code without the fallbacks, with the newly required fields.
7.  Under the mark again: run the fill once more, for documents created between steps 4 and 6; re-run the bookmark remap; remove the old Sanity fields and delete replaced documents. Clear the mark and purge once.
8.  Run the Postgres drops.
    Fills and removals touch every document just as copies do, so they run under the same mark: no per-document revalidation, and no restore of that tenant while they run.

Rollback depth: after a clean-up, Instant Rollback is safe only to deployments made since that change's release 1; anything older breaks every tenant.

Restoring a tenant from an export:

1.  Take the tenant's "copying" mark as a lock, and import the export.
2.  Keep the tenant offline (suspended).
3.  Run every migration after the export's ledger point.
4.  Clear the mark, purge the tenant's cache once, and serve traffic again.
    So migration files are kept for as long as exports are kept.

Known effects:

- Until a tenant's copy runs, the new Studio shows empty new-shape fields on its documents.
- Rolling back after release 1's deploy keeps edits saved in the new shape, but the old code cannot see them. Accept and state it, or mirror new-shape edits back to the old fields during the transition.

## Acceptance checklist

- One release per breaking change, plus a batched clean-up release on a known cadence.
- No tenant's site or Studio runs against mismatched content for longer than [X minutes].
- A release finishes in under [Y minutes] at [N] tenants.
- Copies cover published documents, drafts and versions, and never overwrite a filled new field.
- The clean-up release refuses to run until every in-scope ledger shows the copy step and nothing references a replaced document.
- The webhook handler reads the copying mark uncached, and clears an expired one with a single purge.
- Every query that reads both types of a renamed document prefers the replacement, listings and single lookups alike.
- Every step that touches all documents (copies, fills, removals) runs under the copying mark, with one purge per tenant after it.
- Retry loses no editor changes; a rollback's effect on new-shape edits is stated.
- The new release's end-to-end tests pass against un-migrated content, and the previous release's pass against copied content.
- Two rehearsals done: an in-place restore from a documents-only export, and a rebuild into a fresh dataset from the asset backup plus a documents-only export.
