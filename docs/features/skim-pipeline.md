---
title: Skim pipeline
status: partial
layers: [studio, service, web, worker, db]
code:
  - apps/web/src/app/api/generate-skim/**
  - apps/web/src/server/revalidate/start-skim-generation/**
  - apps/web/src/server/skim/**
  - packages/service/src/features/editorial/skim/**
  - packages/service/src/sanity/write-client/**
  - packages/studio/src/schema-types/objects/post-takeaways/**
epics: [1028, 1027]
---

# Skim pipeline

## What it does

When a post is first published, the public site asks Claude for 3–7 one-sentence takeaways of it and writes them onto the post's **draft** as its `postTakeaways`. Nothing reaches readers until an editor reviews the takeaways in the Studio and publishes the post again; publishing is the approval. Approved takeaways switch on the post's **30s** depth (./reading-experience.md). Generation rides the tenant's existing revalidation webhook; a manual endpoint regenerates on demand. The worker's go-live run is not built yet, so a post first published with a future date gets no takeaways today and its enqueue is logged as refused; that is why the status is partial.

## Triggers

- **First publish:** `POST /api/revalidate` (./rendering-and-caching.md), on a `create` of a `page_post` from a tenant project, calls `startSkimGeneration`, which works in `after()` so the webhook answers first. No second Sanity webhook is registered. It starts nothing for an `update` (so the editor's approval publish never spends the allowance again), a `delete` (which includes an unpublish), a starter post (`starter.` id), a platform-project webhook, a tenant with no read credentials or a missing `ANTHROPIC_API_KEY`. In `after()` it reads `publishedAt` uncached: a post with no date gets nothing; one already live resolves the servable tenant by id and runs the shared pipeline with the tenant's own read and write credentials; one dated ahead is handed to the worker for its go-live (below) and nothing is generated now. A failed date read logs `generate_skim.published_at_lookup_failed`; anything that throws logs `generate_skim.publish_start_failed`; neither reaches the webhook's response.
- **Go-live of a post first published with a future date:** web `POST`s `{ tenantId, postId, publishedAt }` to `<WORKER_ENQUEUE_URL>/api/scheduled-post-skim`, signed under `WORKER_NEWSLETTER_ENQUEUE_SECRET` (`generate_skim.go_live_enqueue_skipped`, `_refused`, `_failed` when it does not start). The worker run sleeps until the post's current date and calls `POST /api/generate-skim/scheduled` with the same body, signed with the enqueue signature under `SANITY_REVALIDATE_SECRET` and that path. The route generates at most once: an unsigned call answers 401, a malformed body 400, an unknown or no longer servable tenant 404; a post whose current `publishedAt` differs from the signed one, or is still ahead, or is missing, answers 204 with nothing done; so does a post whose draft or published document already has takeaways (`service.editorial.skim.v1.hasPostTakeaways`), which makes a retried or duplicated call a no-op and never overwrites hand-written takeaways. A failed date or takeaways read answers 500 (`generate_skim.published_at_lookup_failed`, `generate_skim.takeaways_lookup_failed`), a missing `ANTHROPIC_API_KEY` 503 (`generate_skim.config_missing`); otherwise it runs the shared pipeline and answers as the manual route does from the write gate on (200 with the count, or the gate's refusal). No table records the go-live; the worker's run hook token keeps one run per tenant, post and date.
- **Manual:** `POST /api/generate-skim?secret=` regenerates on demand, for any post, whatever its earlier takeaways.

## Surfaces and routes

- **`POST /api/generate-skim?secret=<SANITY_GENERATE_SECRET>`** on `apps/web`, body `{ "_id": "<post id>" }` (a Sanity webhook payload carries `_id`). Node.js runtime. Returns `{ ok: true, count }` on success.
- **Studio:** the post's "Takeaways" field (`postTakeaways`, collapsed by default), between Published At and SEO. `takeaways` is editable; `generatedAt` and `model` are read-only. Its preview reads "N takeaways" or "No takeaways yet".
- **Platform:** none. No Studio action or platform button triggers generation.

## Data

- **Sanity:** `page_post.postTakeaways` of type `postTakeaways`: `takeaways` (array of strings, each at most 160 characters, 3–7 items), `generatedAt` (datetime), `model` (string). Written to `drafts.<postId>` only.
- **Read step:** `service.editorial.skim.v1.getPublishedPostBody` reads the published post's `content` by `_id`, behind `PUBLISHED_POST_FILTER`, with no ISR tags, so it is never served stale. A post scheduled for the future fails this read.
- **Neon:** the tenant row resolved from the request host supplies the read credentials and the write credentials (`sanityProjectId`, `sanityDataset`, `sanityReadTokenEncrypted`, `sanityWriteTokenEncrypted`, decrypted with `TENANT_TOKEN_ENCRYPTION_KEY`), and `status` and `deprovisionedAt` for the write gate.
- **Allowance counter:** `takeaway_generation_counts` holds one row per tenant per UTC calendar month (`month` is the month's first day) with the number of generations claimed. `queries.takeawayGenerations.claimTakeawayGeneration` adds one in a single upsert only while the count is under `takeawaysPerMonth` for the plan on the uncached `tenants` row, which that same statement reads, so two requests racing for the last generation get one claim; `releaseTakeawayGeneration` gives a claim back and never goes below zero. Rows cascade with the tenant.
- **Cache:** no trigger caches anything. Writing a draft does not revalidate the site; readers see the takeaways after the next publish, through the normal publish webhook (./rendering-and-caching.md).

## Configuration

- No owner or editor setting turns it on or off. The publish trigger is enabled by `ANTHROPIC_API_KEY` on the web deployment; the manual route also needs `SANITY_GENERATE_SECRET`, and without either answers 503. Readers are unaffected either way.
- **Monthly allowance per plan** (`PLAN_ENTITLEMENTS[plan].takeawaysPerMonth`): Free 5, Starter 20, Growth 100 generations per calendar month. Not a capability, and no owner setting. The check never reads a cached plan, so a plan change applies to the next request.
- The reader path is not gated: saved takeaways keep rendering on every plan and after a downgrade.
- Editors can write or edit takeaways by hand in the Studio; the reader path does not care where they came from.
- Look and Voice do not apply: the takeaways are content, written in the post's own voice.

## Constraints and invariants

- **No AI on the reader path.** Generation runs only in `generatePostSkim`, called by the triggers; pages read only the published field.
- **Draft only.** `saveSkimDraft` creates the draft from the published document if none exists, then `set`s `postTakeaways` on it in one transaction. It never patches the published document and never touches other draft fields. Re-running overwrites the draft's takeaways, including any human edits there.
- **One pipeline:** `generatePostSkim` (write gate, allowance claim, body read, Claude call, `saveSkimDraft`) is shared by every trigger; each resolves the read and write tenant contexts and passes them in.
- **Order of checks (manual route):** missing key or secret → 503; wrong `secret` (constant-time `isSecretMatch`) → 401; malformed JSON or no `_id` → 400; host resolves to no servable tenant in production → 404; tenant without write credentials → 503; tenant not writable (ACTIVE, TRIAL or PAST_DUE) or deprovisioned → 403; monthly allowance used → 403 with the same message, no post read and no Claude call; body read fails → 500; generation fails → 422 with the draft untouched; no usable write context → 503; save fails → 500. A claim that fails on the database → 503, logged. A body-read or generation failure gives the claim back. A save failure keeps it: the count tracks Claude calls, so a webhook retry after that 5xx claims, and calls Claude, again. Each failure logs a `generate_skim.*` event; a wrong secret or bad body does not, and a used allowance logs `generate_skim.allowance_used` at info, since it is expected.
- **Manual route: tenant comes from the `Host` header** (`getHostTenantSanityContext` / `getHostTenantSanityWriteContext`), because `/api/*` skips the proxy's tenant rewrite, so a manual call must use the tenant's own host. The publish trigger takes the tenant from the signed revalidation webhook instead, and the go-live route from its signed body. Outside production a host with no tenant falls back to the only tenant if exactly one servable tenant exists, otherwise to the platform project, writing with `SANITY_API_WRITE_TOKEN`. With no tenant there is no plan, so nothing is claimed.
- **Generation:** `generateTakeaways` sends the body's text blocks only (code, images and asides are skipped) to `claude-haiku-5-5` (`SKIM_GENERATION_MODEL`), which rejects `temperature`, so none is sent; `max_tokens` 1024, with a zod output format of 3–7 strings of at most 160 characters. No parsed output throws. The same constant is stored as `model`.
- **Rendering threshold:** the service treats fewer than 3 takeaways as none, matching the schema's `min(3)`.
- `hasPostTakeaways` reads the draft and the published post through the write client, since only it sees drafts; any non-empty `takeaways` counts.
- The write client uses the `raw` perspective and `useCdn: false`, and refuses a tenant context missing project, dataset or token (`InvalidTenantSanityContextError`). It is the only Sanity write path in `@shinefold/service` (`service.editorial.*`) and is never used for page reads.

## Dependencies

- Layers: `apps/web` (routes, Anthropic call, tenant resolution), `apps/worker` (the go-live run), `@shinefold/service` (`service.editorial.skim.v1`, write client), `@shinefold/db` (tenant credentials, `PLAN_ENTITLEMENTS`, the allowance counter), `@shinefold/studio` (`postTakeaways`), `@shinefold/config` (generated `PostTakeaways`, `ArticleText`). SDK: `@anthropic-ai/sdk`.
- Features: ./reading-experience.md (renders the result), ./posts.md, ./rich-text.md (body shape), ./multi-tenancy.md (host resolution), ./tenant-provisioning.md (which registers only the revalidation webhook, the one this rides), ./rendering-and-caching.md.
- Env (web): `ANTHROPIC_API_KEY`, `SANITY_GENERATE_SECRET`, `SANITY_REVALIDATE_SECRET` (go-live route), `WORKER_ENQUEUE_URL` and `WORKER_NEWSLETTER_ENQUEUE_SECRET` (go-live enqueue), `TENANT_TOKEN_ENCRYPTION_KEY`; `SANITY_API_WRITE_TOKEN` for the non-production platform fallback. All declared in `turbo.json`.

## Entry points

- `apps/web/src/app/api/generate-skim/route.ts`
- `apps/web/src/app/api/generate-skim/scheduled/route.ts`
- `apps/web/src/server/revalidate/start-skim-generation/start-skim-generation.ts`
- `apps/web/src/server/skim/generate-post-skim/generate-post-skim.ts`
- `apps/web/src/server/skim/generate-takeaways/generate-takeaways.ts`
- `apps/web/src/server/skim/skim-write-gate/skim-write-gate.ts`
- `packages/db/src/queries/takeaway-generations/`
- `apps/web/src/server/tenant/tenant-sanity-context/tenant-sanity-context.ts`
- `packages/service/src/features/editorial/skim/application/service.ts`
- `packages/service/src/features/editorial/skim/adaptor/get-post-body/{query,loader}.ts`
- `packages/service/src/features/editorial/skim/adaptor/save-skim-draft/loader.ts`
- `packages/service/src/sanity/write-client/write-client.ts`
- `packages/studio/src/schema-types/objects/post-takeaways/post-takeaways.ts`

## Tests and stories

- `apps/web/src/app/api/generate-skim/route.test.ts` (the shared pipeline, through the manual route), `apps/web/src/app/api/generate-skim/scheduled/route.test.ts` (go-live guard, including the retry no-op), `apps/web/src/server/revalidate/start-skim-generation/start-skim-generation.test.ts`, `apps/web/src/app/api/revalidate/route.test.ts`, `apps/web/src/server/skim/generate-takeaways/generate-takeaways.test.ts`, `apps/web/src/server/tenant/tenant-sanity-context/tenant-sanity-context.test.ts`.
- `packages/db/src/queries/takeaway-generations/**/*.test.ts`.
- `packages/service/src/features/editorial/skim/**/*.test.ts`, `packages/service/src/sanity/write-client/write-client.test.ts`.
- No stories: the pipeline has no UI of its own.

## Related

- #1027 the worker's go-live run for a post first published with a future date.
- #1028 epic: skip regeneration on redundant publishes, with a body fingerprint and a force override (#1029 studio, #1030 service, #1031 web); it could widen the publish trigger to `update`.
