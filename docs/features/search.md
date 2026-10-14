---
title: Search
status: planned
layers: [db, service, web]
code:
  - packages/db/migrations/0000_enable_pgvector_extension.sql
epics: [1045, 1046, 1047, 1048]
---

# Search

## What it does

Readers will search a site's posts from a `/search` page and get results ranked by meaning rather than keyword match, which matters on a small corpus where exact words rarely line up. Nothing of it is built: the site has no search route, no search box and no search index. The only piece in place is the `pgvector` extension, switched on in the first database migration.

## Surfaces and routes

- **Public site** — planned `/search?q=…` under the tenant's locale segment. No route, header control or results view exists.
- **Platform and Studio** — nothing planned.

## Data

- `pgvector` — enabled by `0000_enable_pgvector_extension.sql`. No table uses it. The test database (pglite) cannot load the extension, so `packages/db/src/testing/migration-files.ts` skips that migration.
- Planned `posts_embeddings (post_id, embedding, model, updated_at)` in Neon. `post_id` is the Sanity `_id` string — a cross-store reference, not a foreign key, the same pattern as bookmarks.
- Content stays in Sanity. Postgres holds only the vector and the id; titles, excerpts and images for the results come from the existing post loaders.
- Embeddings are generated at publish time by a pipeline that has no design yet; search depends on it.

## Configuration

- No plan or capability gate is decided; no `CAPABILITY` key exists for search.
- No Look or Voice reach is decided; result-page copy gets classified Voice or fixed when the work is planned.

## Constraints and invariants

These are decided in the design and must hold when it is built:

- Three layers, three owners: `db` runs the similarity query (`searchPostIds(vector, limit)` returning `[{ postId, score }]`, ordered by `embedding <=> vector`); `service` hydrates the ranked ids into post view models from Sanity, preserving the database's order; `web` owns the route and the query-time embedding call.
- `service` never talks to Postgres and `db` never imports a Sanity SDK.
- Query-time embedding is the only AI call on the reader's request path. It uses a small hosted embedding model; the exact model is not fixed (the design names OpenAI `text-embedding-3-small` only as an example), and queries must use the same model as the stored vectors, which is why each row records `model`.
- If the embedding provider is down or slow, search degrades rather than erroring: either a plain Sanity keyword search or an explicit "search unavailable" state — which one is not decided.
- Results reuse the existing post-list card, not a new component.
- The design's table has no tenant column; it needs a `tenant_id`. Every other engagement table carries a `tenant_id` foreign key with cascade delete, so the embeddings table must carry one too, and every query must filter by it — one tenant's posts never rank in another's results.

## Dependencies

- Layers: `db` (`pgvector`, the embeddings table), `service` (hydration), `web` (route, embedding client).
- Features: ./posts.md (the corpus and the result cards), ./skim-pipeline.md (the existing publish-time AI pipeline a generation step would sit beside), ./multi-tenancy.md, ./rendering-and-caching.md, ./seo-and-feeds.md (a search page is not indexed content).
- Env vars: an embedding-provider key, not yet named or declared in `turbo.json`.

## Entry points

- `packages/db/migrations/0000_enable_pgvector_extension.sql`
- `packages/db/src/testing/migration-files.ts` (the pglite skip)
- `docs/superpowers/specs/2026-07-31-semantic-search-design.md` — the design of record.

## Tests and stories

None.

## Related

- #1045 — semantic search epic.
- #1046 — `db`: `posts_embeddings` table and the `pgvector` similarity query.
- #1047 — `service`: hydrate ranked post ids into search view models.
- #1048 — `web`: `/search` route with query-time embedding.
