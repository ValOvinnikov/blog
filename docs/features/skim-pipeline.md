---
title: Skim pipeline
status: done
layers: [studio, service, web, worker, db]
code:
  - apps/web/src/app/api/generate-skim/**
  - apps/web/src/server/revalidate/start-skim-generation/**
  - apps/web/src/server/skim/**
  - apps/worker/src/workflows/generate-scheduled-post-skim.ts
  - apps/worker/src/units/scheduled-post-skim/**
  - packages/service/src/features/editorial/skim/**
  - packages/service/src/sanity/write-client/**
  - packages/studio/src/schema-types/objects/post-takeaways/**
  - packages/studio/src/schema-types/validation/validate-max-words/**
epics: [1028]
---

# Skim pipeline

## What it does

When a post is first published, the public site asks Claude for a short summary of it — at most 100 words of rich text, prose by default and a list only where the post lists things — and writes it onto the post's **draft** as its `postTakeaways.summary`. Nothing reaches readers until an editor reviews the summary in the Studio and publishes the post again; publishing is the approval. An approved summary gives the post its Summary card (./reading-experience.md) and the Takeaways box in its newsletter email (./email.md). Generation rides the tenant's existing revalidation webhook; a manual endpoint regenerates on demand. A post first published with a future date gets its summary from a worker run when it goes live.

## Triggers

- **First publish:** `POST /api/revalidate` (./rendering-and-caching.md), on a `create` of a `page_post` from a tenant project, calls `startSkimGeneration`, which works in `after()` so the webhook answers first. No second Sanity webhook is registered. It starts nothing for an `update` (so the editor's approval publish never spends the allowance again), a `delete` (which includes an unpublish), a starter post (`starter.` id), a platform-project webhook, a tenant with no read credentials or a missing `ANTHROPIC_API_KEY`. In `after()` it reads `publishedAt` uncached: a post with no date gets nothing; one already live resolves the servable tenant by id (a tenant no longer servable logs `generate_skim.tenant_not_servable`), skips a post whose draft or published document already has a summary (`hasExistingTakeaways`, shared with the go-live route; a failed read logs `generate_skim.summary_lookup_failed`), and otherwise runs the shared pipeline with the tenant's own read and write credentials; one dated ahead is handed to the worker for its go-live (below) and nothing is generated now. A failed date read logs `generate_skim.published_at_lookup_failed`; anything that throws logs `generate_skim.publish_start_failed`; neither reaches the webhook's response. Unpublishing and republishing a post sends a `create`, as does a redelivered webhook; for a post that has a summary it generates nothing, claims no allowance and leaves its summary as it was.
- **Go-live of a post first published with a future date:** web `POST`s `{ tenantId, postId, publishedAt }` to `<WORKER_ENQUEUE_URL>/api/scheduled-post-skim`, signed under `WORKER_NEWSLETTER_ENQUEUE_SECRET` (`generate_skim.go_live_enqueue_skipped`, `_refused`, `_failed` when it does not start). The worker refuses a date more than 60 seconds past (`SCHEDULED_POST_GRACE_MS`) and starts a `generateScheduledPostSkim` run, the same sleep-and-recheck run as the scheduled-post purge ([posts](./posts.md)): it sleeps until the post's current date, re-reading it at least daily. Unlike the purge, it follows a re-dated post, since web enqueues it on the first `create` only and an `update` starts nothing: a date moved later is slept until, and a date moved to the past is due at once. It ends with nothing done only when the post has no readable date (unpublished, deleted or malformed) or the tenant can no longer be read. When the date arrives it calls `POST /api/generate-skim/scheduled` with `{ tenantId, postId }` and the post's current `publishedAt`, signed with the enqueue signature under `SANITY_REVALIDATE_SECRET` and that path. The route generates at most once: an unsigned call answers 401, a malformed body 400, an unknown or no longer servable tenant 404 (`generate_skim.tenant_not_servable`), a tenant lookup that throws 500 (`generate_skim.tenant_resolve_failed`); a post whose current `publishedAt` differs from the signed one, or is missing, answers 204 with nothing done; a matching date still ahead answers 425 Too Early with a `Retry-After` naming the seconds left until the date (at least 1), which the worker retries after those seconds, so a run waking slightly early still generates; a post whose draft or published document already has a summary (`hasExistingTakeaways`) answers 204, which makes a retried or duplicated call a no-op and never overwrites a hand-written summary. A failed date or summary read answers 500 (`generate_skim.published_at_lookup_failed`, `generate_skim.summary_lookup_failed`), a missing `ANTHROPIC_API_KEY` 503 (`generate_skim.config_missing`); otherwise it runs the shared pipeline and answers as the manual route does from the write gate on (200 with the block count, or the gate's refusal). No table records the go-live; the worker's run hook token (`scheduled-post-skim:<tenantId>:<postId>:<publishedAt>`, on the enqueued date even after a re-date) keeps one run per tenant, post and first publish. The worker's call to the route waits up to 90 seconds, and the route's `maxDuration` of 80 seconds stops it first, so a retry never overlaps a call still generating; a 408, 425 or 429 is retried (at its `Retry-After` when sent), any other 4xx (a 403 for a used allowance or an unwritable tenant, a 422 for a failed or over-long generation) ends the run, and a 5xx or timeout is retried on the step's default backoff. Retries are capped at 3 (`SCHEDULED_POST_SKIM_MAX_RETRIES`, set on the step rather than left to the Workflow default), shared by every retryable answer, after which the run fails. Retrying a 5xx is deliberate: most happen before the claim or give it back, so a retry is the only way the post still gets a summary. A slow Claude call cannot be cut off holding its claim: one 60-second deadline (`SKIM_GENERATION_DEADLINE_MS`) covers every attempt and every retry wait Anthropic asks for, inside the route's 80 seconds, and a call that hits it gives the claim back as any failed generation does, answering 422, which ends the go-live run. The one that keeps its claim, a failed save, costs one generation per attempt, so a save that keeps failing spends at most 4 generations (the first call plus 3 retries) on one post, as a webhook retry does on the publish path, and never drains the rest of the monthly allowance. A run that still fails after its retries logs `scheduled_post_skim.run_failed`; one that cannot be started logs `scheduled_post_skim.start_failed` and answers web 500.
- **Manual:** `POST /api/generate-skim?secret=` regenerates on demand, for any post, whatever its earlier summary.

## Surfaces and routes

- **`POST /api/generate-skim?secret=<SANITY_GENERATE_SECRET>`** on `apps/web`, body `{ "_id": "<post id>" }` (a Sanity webhook payload carries `_id`). Node.js runtime. Returns `{ ok: true, count }` on success, `count` being the number of summary blocks saved.
- **Studio:** the post's "Summary" object (`postTakeaways`, collapsed by default), between Published At and SEO. Its "Summary" field (`summary`) is editable; `generatedAt` and `model` are read-only. Its preview reads "N words" or "No summary yet".
- **Platform:** none. No Studio action or platform button triggers generation.

## Data

- **Sanity:** `page_post.postTakeaways` of type `postTakeaways`: `summary` (restricted Portable Text: style `normal` only, `bullet` and `number` lists, `strong` and `em` decorators, no annotations or custom blocks; required once the object is set, at most 8 blocks (`POST_SUMMARY_MAX_BLOCKS`) and at most 100 words (`POST_SUMMARY_MAX_WORDS`, checked by `validateMaxWords`)), `generatedAt` (datetime), `model` (string). Written to `drafts.<postId>` only. A dev post still carrying a `takeaways` value shows it as an unknown field until its summary is regenerated or the field cleared; no content migration runs before launch.
- **Read step:** `service.editorial.skim.v1.getPublishedPostBody` reads the published post's `content` by `_id`, behind `PUBLISHED_POST_FILTER`, with no ISR tags, so it is never served stale. A post scheduled for the future fails this read.
- **Neon:** the tenant row resolved from the request host supplies the read credentials and the write credentials (`sanityProjectId`, `sanityDataset`, `sanityReadTokenEncrypted`, `sanityWriteTokenEncrypted`, decrypted with `TENANT_TOKEN_ENCRYPTION_KEY`), and `status` and `deprovisionedAt` for the write gate.
- **Allowance counter:** `takeaway_generation_counts` holds one row per tenant per UTC calendar month (`month` is the month's first day) with the number of generations claimed. `queries.takeawayGenerations.claimTakeawayGeneration` adds one in a single upsert only while the count is under `takeawaysPerMonth` for the plan on the uncached `tenants` row, which that same statement reads, so two requests racing for the last generation get one claim; `releaseTakeawayGeneration` gives a claim back and never goes below zero. `countTakeawayGenerationsThisMonth` reads the current UTC month's count on the same month rule as the claim, 0 when the month has no row. Rows cascade with the tenant.
- **Cache:** no trigger caches anything. Writing a draft does not revalidate the site; readers see the summary after the next publish, through the normal publish webhook (./rendering-and-caching.md).

## Configuration

- No owner or editor setting turns it on or off. The publish trigger is enabled by `ANTHROPIC_API_KEY` on the web deployment; the manual route also needs `SANITY_GENERATE_SECRET`, and without either answers 503. Readers are unaffected either way.
- **Monthly allowance per plan** (`PLAN_ENTITLEMENTS[plan].takeawaysPerMonth`): Free 5, Starter 20, Growth 100 generations per calendar month. Not a capability, and no owner setting. The check never reads a cached plan, so a plan change applies to the next request.
- The reader path is not gated: a saved summary keeps rendering on every plan and after a downgrade.
- Editors can write or edit the summary by hand in the Studio; the reader path does not care where it came from.
- Look and Voice do not apply: the summary is content, written in the post's own voice.

## Constraints and invariants

- **No AI on the reader path.** Generation runs only in `generatePostSkim`, called by the triggers; pages read only the published field.
- **Draft only.** `saveSkimDraft` creates the draft from the published document if none exists, then `set`s `postTakeaways` (`summary`, `generatedAt`, `model`) on it in one transaction. It never patches the published document and never touches other draft fields. Re-running overwrites the draft's summary, including any human edits there.
- **One pipeline:** `generatePostSkim` (write gate, allowance claim, body read, `draftSummary`, `saveSkimDraft`) is shared by every trigger; each resolves the read and write tenant contexts and passes them in.
- **Order of checks (manual route):** missing key or secret → 503; wrong `secret` (constant-time `isSecretMatch`) → 401; malformed JSON or no `_id` → 400; host resolves to no servable tenant in production → 404; tenant without write credentials → 503; tenant not writable (ACTIVE, TRIAL or PAST_DUE) or deprovisioned → 403; monthly allowance used → 403 with the same message, no post read and no Claude call; body read fails → 500; generation fails, or the summary runs over 100 words → 422 with the draft untouched; no usable write context → 503; save fails → 500. A claim that fails on the database → 503, logged. A body-read failure, a failed generation or an over-long summary gives the claim back. A save failure keeps it: the count tracks Claude calls, so a webhook retry after that 5xx claims, and calls Claude, again. Each failure logs a `generate_skim.*` event; a wrong secret or bad body does not, and a used allowance logs `generate_skim.allowance_used` at info, since it is expected.
- **Manual route: tenant comes from the `Host` header** (`getHostTenantSanityContext` / `getHostTenantSanityWriteContext`), because `/api/*` skips the proxy's tenant rewrite, so a manual call must use the tenant's own host. The publish trigger takes the tenant from the signed revalidation webhook instead, and the go-live route from its signed body. Outside production a host with no tenant falls back to the only tenant if exactly one servable tenant exists, otherwise to the platform project, writing with `SANITY_API_WRITE_TOKEN`. With no tenant there is no plan, so nothing is claimed.
- **Generation:** `generateTakeaways` sends the body's text blocks only (code, images and asides are skipped) in one call to `claude-haiku-5-5` (`SKIM_GENERATION_MODEL`), which rejects `temperature`, so none is sent; `max_tokens` 1024. The prompt asks for at most 100 words in the post's own voice, prose by default and a list only where the post lists things. The zod output format is 1–8 blocks of `{ style, text }`, `style` one of `SUMMARY_BLOCK_STYLE` (`PARAGRAPH`, `BULLET`, `NUMBER`), with `**bold**` and `*italic*` the only inline marks. No parsed output throws. The same constant is stored as `model`.
- **Conversion and word limit:** `draftSummary` turns the blocks into Portable Text with `toSummaryPortableText` (`BULLET` and `NUMBER` blocks become list items, so consecutive ones render as one list; the marks become `strong` and `em` spans), then counts words (`countBlockWords`). A reply over 100 words is refused: nothing is saved, the claim is given back, the route answers 422 and `generate_skim.summary_over_word_limit` is logged at warn. A failed call logs `generate_skim.generation_failed` and answers the same way.
- **Rendering threshold:** the service treats a summary with no block that has text as none (`toPostTakeaways`).
- `hasPostTakeaways` reads the draft and the published post through the write client, since only it sees drafts; any non-empty `summary` counts.
- The write client uses the `raw` perspective and `useCdn: false`, and refuses a tenant context missing project, dataset or token (`InvalidTenantSanityContextError`). It is the only Sanity write path in `@shinefold/service` (`service.editorial.*`) and is never used for page reads.

## Dependencies

- Layers: `apps/web` (routes, Anthropic call, tenant resolution), `apps/worker` (the go-live run), `@shinefold/service` (`service.editorial.skim.v1`, write client), `@shinefold/db` (tenant credentials, `PLAN_ENTITLEMENTS`, the allowance counter), `@shinefold/studio` (`postTakeaways`), `@shinefold/config` (generated `PostTakeaways`, `ArticleText`, `TPostSummary`, `POST_SUMMARY_MAX_WORDS`, `POST_SUMMARY_MAX_BLOCKS`), `@shinefold/utils` (`countWords`, and `toBlockText`, `countBlockWords`, `hasBlockText` from `@shinefold/utils/portable-text`). SDK: `@anthropic-ai/sdk`.
- Features: ./reading-experience.md (renders the result), ./posts.md, ./rich-text.md (body shape), ./multi-tenancy.md (host resolution), ./tenant-provisioning.md (which registers only the revalidation webhook, the one this rides), ./rendering-and-caching.md.
- Env (web): `ANTHROPIC_API_KEY`, `SANITY_GENERATE_SECRET`, `SANITY_REVALIDATE_SECRET` (go-live route), `WORKER_ENQUEUE_URL` and `WORKER_NEWSLETTER_ENQUEUE_SECRET` (go-live enqueue), `TENANT_TOKEN_ENCRYPTION_KEY`; `SANITY_API_WRITE_TOKEN` for the non-production platform fallback. All declared in `turbo.json`.

## Entry points

- `apps/web/src/app/api/generate-skim/route.ts`
- `apps/web/src/app/api/generate-skim/scheduled/route.ts`
- `apps/web/src/server/revalidate/start-skim-generation/start-skim-generation.ts`
- `apps/web/src/server/skim/generate-post-skim/generate-post-skim.ts`
- `apps/web/src/server/skim/has-existing-takeaways/has-existing-takeaways.ts`
- `apps/web/src/server/skim/generate-takeaways/generate-takeaways.ts`
- `apps/web/src/server/skim/draft-summary/draft-summary.ts`
- `apps/web/src/server/skim/to-summary-portable-text/to-summary-portable-text.ts`
- `apps/web/src/server/skim/skim-write-gate/skim-write-gate.ts`
- `apps/worker/src/app/api/scheduled-post-skim/route.ts`
- `apps/worker/src/workflows/generate-scheduled-post-skim.ts`
- `apps/worker/src/units/scheduled-post-skim/request-scheduled-post-skim.ts`
- `packages/db/src/queries/takeaway-generations/`
- `apps/web/src/server/tenant/tenant-sanity-context/tenant-sanity-context.ts`
- `packages/service/src/features/editorial/skim/application/service.ts`
- `packages/service/src/features/editorial/skim/adaptor/get-post-body/{query,loader}.ts`
- `packages/service/src/features/editorial/skim/adaptor/save-skim-draft/loader.ts`
- `packages/service/src/sanity/write-client/write-client.ts`
- `packages/studio/src/schema-types/objects/post-takeaways/post-takeaways.ts`
- `packages/studio/src/schema-types/validation/validate-max-words/`

## Tests and stories

- `apps/web/src/app/api/generate-skim/route.test.ts` (the shared pipeline, through the manual route), `apps/web/src/app/api/generate-skim/scheduled/route.test.ts` (go-live guard, including the retry no-op), `apps/web/src/server/revalidate/start-skim-generation/start-skim-generation.test.ts`, `apps/web/src/app/api/revalidate/route.test.ts`, `apps/web/src/server/skim/generate-takeaways/generate-takeaways.test.ts`, `apps/web/src/server/skim/to-summary-portable-text/to-summary-portable-text.test.ts`, `apps/web/src/server/tenant/tenant-sanity-context/tenant-sanity-context.test.ts`.
- `packages/db/src/queries/takeaway-generations/**/*.test.ts`.
- `apps/worker/src/app/api/scheduled-post-skim/route.test.ts`, `apps/worker/src/workflows/generate-scheduled-post-skim.test.ts`, `apps/worker/src/units/scheduled-post-skim/request-scheduled-post-skim.test.ts`; the shared run, enqueue route and web call are covered by `apps/worker/src/workflows/scheduled-post-run.test.ts`, `apps/worker/src/utils/scheduled-post/start-scheduled-post-run.test.ts` and `apps/worker/src/utils/scheduled-post/post-to-web.test.ts`.
- `packages/service/src/features/editorial/skim/**/*.test.ts`, `packages/service/src/sanity/write-client/write-client.test.ts`.
- No stories: the pipeline has no UI of its own.

## Related

- #1028 epic: skip regeneration on redundant publishes, with a body fingerprint and a force override (#1029 studio, #1030 service, #1031 web); it could widen the publish trigger to `update`.
