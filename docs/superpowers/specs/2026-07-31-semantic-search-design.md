# Semantic Search — Approach Spike

**Status:** Spike / approach design (no code in this issue). Informs whether
M3.4 becomes an epic + per-layer sub-issues or a single issue.
**Date:** 2026-07-31
**Issue:** #963 (spike). Scopes backlog **M3.4** (`docs/BACKLOG.md`).
**Related / dependencies:**

- **M3.2** publish-time AI generation pipeline (`docs/BACKLOG.md`) — the
  source of the embeddings this feature searches. Hard prerequisite. Has **no
  design doc yet**; this spike constrains one field of its output (see
  §"The M3.2 contract").
- **`packages/db` (Neon + Drizzle)** — the non-Sanity persistence layer,
  fully designed in the archived Phase 5/6 roadmap
  (`docs/archive/ROADMAP.md` §"Phase 5 — Engagement", §"Phase 6", Appendix A).
  Not yet scaffolded; no open implementation issue (the historical tracking
  issue #13 was a doc-alignment ticket and is closed). Hard prerequisite.
- **M1.4** revalidation webhook (`apps/web/src/app/api/revalidate/route.ts`) —
  the existing publish-time webhook pattern M3.2 extends.

## Purpose of this spike

M3.4 asks for a `/search` route "genuinely better than keyword search on a
small corpus," over "the embeddings index from M3.2." The backlog leaves the
consequential decisions open: **where the embeddings live**, **what runs at
query time**, and **which layer owns the search**. This document answers those
so the M3.4 implementation can be ticketed correctly — and, per the steer that
opened this spike, answers the storage question **for the whole app, not for
search in isolation**.

## Key finding: the database is already chosen — search just rides it

The decisive input is not a fresh vendor comparison. Surveying every
non-Sanity persistence need across the roadmap shows the app already has a
coherent, single-database strategy — designed in the (archived but canonical)
Phase 5/6 roadmap, deferred, not yet built:

| Feature                        | Roadmap home       | Data shape                     | Storage (already designed)       |
| ------------------------------ | ------------------ | ------------------------------ | -------------------------------- |
| Comments (threaded)            | Phase 5a           | relational rows                | Neon Postgres via Drizzle        |
| Ratings (1 per user/post)      | Phase 5a           | relational + unique constraint | Neon Postgres via Drizzle        |
| Auth sessions                  | Phase 5b           | Auth.js adapter tables         | Neon Postgres via Drizzle        |
| Rate limiting                  | Phase 5c           | key-value counters             | Upstash Redis                    |
| Newsletter subscribers         | Phase 6            | relational rows                | Neon Postgres via Drizzle        |
| Bookmarks / likes              | Phase 6            | relational rows                | Neon Postgres via Drizzle        |
| **Semantic-search embeddings** | **Phase 6 / M3.4** | **vectors**                    | **Neon Postgres via `pgvector`** |

Everything relational lands in **one Neon Postgres**, accessed through a
**`packages/db`** workspace that obeys the same contract as `service` (typed
async functions, no React, no Sanity). Phase 6 already names the vector
target explicitly: _"embed post bodies, store vectors in Neon `pgvector`, serve
NL search + related articles"_ (`docs/archive/ROADMAP.md`).

**So M3.4 does not choose a vector store.** Standing up a separate vector DB
(Pinecone, Upstash Vector, etc.) for search alone would fragment persistence
across two systems the day before comments need Postgres anyway. Embeddings go
in the same Neon instance as the engagement data, in a `posts_embeddings`
table with a `pgvector` column. This is the spike's central conclusion and the
reason the storage question could not be answered by looking at search alone.

### Why not the two alternatives considered

- **Embeddings as a `float[]` field on the Sanity post + in-memory cosine at
  query time.** Zero new infrastructure, and viable for a few dozen posts.
  Rejected because it is a dead-end that ignores the already-committed DB: it
  can't share storage/tooling with comments/ratings, re-fetches every vector
  on every search (O(n) transfer, not just O(n) math), and would be thrown
  away the moment `packages/db` exists. It optimizes for "search in isolation"
  — exactly the framing this spike was told to reject.
- **A dedicated managed vector store (Pinecone / Upstash Vector).** Purpose-built
  ANN and scales past a small corpus. Rejected because it adds a _second_
  persistence vendor, its own SDK/env/billing, for a corpus that `pgvector` on
  the already-present Neon handles comfortably — and it still wouldn't serve
  comments. One database beats two.

## Query-time flow

```
web  /search?q=…            (new route, apps/web/src/app/[locale]/search)
      │
      ├─ embed(q)           ← query-time embedding API call  (the ONE reader-path AI cost)
      │                       returns a query vector
      ├─ db.searchPostIds(vec, limit)
      │                       pgvector similarity (ORDER BY embedding <=> vec)
      │                       returns [{ postId, score }] — top-K, no content
      ├─ service…hydrate(postIds)
      │                       fetch post view-models from Sanity for those ids,
      │                       preserving the db-provided rank order
      └─ render results (reuse the existing post-list card/organism)
```

Two properties worth stating outright:

- **This is the only AI call on the reader hot path in the entire product.**
  Every other AI feature (M3.2 summaries/embeddings, M3.3 skim, M3.5 critique)
  runs at publish time and ships static. Search is the one exception: the
  _query_ text must be embedded at request time to get a vector to compare
  against the stored post vectors. It's a single, cheap embedding call per
  search (see §"Model, cost, latency"), but it is a runtime dependency on an
  embedding provider and must be budgeted, cached where possible, and
  degrade gracefully if the provider is down (fall back to a plain
  Sanity keyword/GROQ search, or an explicit "search unavailable" state).
- **Content still comes from Sanity, not Postgres.** Postgres stores only the
  vector + the Sanity `_id` (a cross-store reference, exactly as the Phase 5
  `comments.postId` design already does — string ref, not a foreign key). The
  post's title/excerpt/image for the results list are hydrated from Sanity, so
  there is one source of truth for content and no duplication into the DB.

## Layer placement (recommended)

The M3.4 backlog line names `service.pages.search.v1`. That predates the
`db`/`service` split the Phase 5 design established, so this spike reconciles
it. Because the similarity query runs against **Neon**, not Sanity, keeping it
inside `service` would make `service` talk to Postgres — eroding the clean
"`service` = the Sanity read path, `db` = the Neon read/write path" contract.

**Recommended split (three layers):**

| Layer              | Owns                                                          | New surface                                                                               |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `packages/db`      | the pgvector similarity query                                 | `searchPostIds(queryVector, limit) → [{ postId, score }]`                                 |
| `packages/service` | hydrating Sanity content for ranked ids                       | a search-oriented fetch that takes ordered ids and returns post view-models in that order |
| `apps/web`         | the `/search` route + query-time embedding call + composition | `/[locale]/search` route; calls the embedding API, then `db`, then `service`              |

This keeps each layer single-purpose and testable in isolation: `db` is pure
vector-SQL over Neon, `service` stays Sanity-only, `web` composes and owns the
one external embedding call. The embedding-provider client itself is a small
`web` (or shared util) concern, not a `service`/`db` concern, since it is
neither Sanity nor Neon.

> The backlog's `service.pages.search.v1` naming should be updated to reflect
> this split when M3.4 is ticketed. The M3.4 implementation epic may confirm or
> override this recommendation, but the reasoning (preserve the db/service
> boundary) should be the default.

## The M3.2 contract (what this spike needs upstream)

M3.4 is unbuildable until M3.2 produces embeddings **in the right place**. The
backlog currently says M3.2 writes generated output "back into Sanity as fields
on the post" and notes "embeddings … double as the search index for M3.4" —
which reads as _embeddings in a Sanity field_. This spike corrects that for the
embedding specifically:

- **Human-facing generated output** (TL;DR, key takeaways) → Sanity draft
  fields, as M3.2 already plans (human-approvable, renders statically).
- **The embedding vector** → **Neon `pgvector`**, not a Sanity field. It is
  machine-only data with no editorial value, it must live where the similarity
  query runs, and Sanity is not a vector database.

Concretely, M3.2's publish-time webhook (extending the existing
`/api/revalidate` pattern — Sanity webhook → secret-verified route → work →
revalidate) gains one step: after generating summaries, compute the post's
body embedding and `upsert` it into `posts_embeddings (post_id, embedding,
model, updated_at)` in Neon. This is the single interface M3.4 depends on;
everything else about M3.2's generation pipeline is out of scope here and
belongs in M3.2's own (not-yet-written) design doc.

## Model, cost, latency (small corpus)

Order-of-magnitude scoping, not a locked vendor choice (the embedding provider
is an M3.2 decision, since M3.2 generates the stored vectors and the query
side must use the **same** model to compare in the same space):

- **Model:** a small, cheap text-embedding model (e.g. OpenAI
  `text-embedding-3-small` at 1536 dims, or an equivalent) is ample for a
  blog-sized corpus. The exact model is fixed by M3.2; M3.4 must embed queries
  with the identical model, so store the model name alongside each vector
  (the `model` column above) to detect drift on re-index.
- **Storage:** dozens–low-hundreds of posts × ~1.5K floats each is trivial for
  Postgres; a single `ivfflat`/`hnsw` `pgvector` index is optional at this
  scale (exact search is fine) and can be added later if the corpus grows.
- **Publish-time cost:** one embedding call per post per publish — fractions of
  a cent, off the reader path.
- **Query-time cost/latency:** one embedding call per search (tens of ms +
  provider latency) plus one indexed SQL query. Cache identical query strings
  (short TTL) to blunt repeated searches. Budget the provider call with a
  timeout + the keyword-search fallback noted above.

## Non-goals (for the eventual M3.4 build, recorded here)

- Re-ranking, hybrid keyword+vector fusion, typo tolerance, filters/facets —
  V1 is nearest-neighbour over the query embedding, nothing more.
- Backfilling embeddings for existing posts as an automated batch — the M3.2
  endpoint should support re-embedding, but the batch runner is later.
- "Related articles" on the post page. It shares the same embeddings and is
  the natural second consumer, but it is a separate feature; this spike is the
  `/search` route only.
- Search analytics / query logging (a later, separate persistence concern).

## Conclusion — how M3.4 should be ticketed

M3.4 spans three layers (`db` + `service` + `web`), so per this repo's
"epic + one sub-issue per layer" rule it should be an **epic with per-layer
sub-issues**, not a single flat issue. Its dependency chain, in order:

1. **`packages/db` bootstrap (Phase 5a).** Neon project + `packages/db`
   scaffold (Drizzle, `@neondatabase/serverless`) + the `pgvector` extension.
   This has **no open issue today** and blocks M3.4 (and all of Phase 5).
   Filing it is the true first step — it is not M3.4-specific work, so it
   should be its own issue that M3.4 (and comments/ratings) depend on.
2. **M3.2** must write embeddings to Neon `pgvector` per §"The M3.2 contract"
   (needs its own design doc first — also not yet written).
3. **M3.4 epic**, then its sub-issues in dependency order:
   `db` (the `searchPostIds` vector query + `posts_embeddings` table/migration)
   → `service` (ranked-id hydration) → `web` (`/search` route + query
   embedding + composition).

The spike's acceptance criterion — "a design doc informing whether M3.4 is an
epic or single issue" — resolves to: **epic + per-layer sub-issues, gated on a
new `packages/db` bootstrap issue and on M3.2's embedding-to-Neon output.**
No code changes in this issue.
