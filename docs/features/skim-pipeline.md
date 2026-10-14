---
title: Skim pipeline
status: partial
layers: [studio, service, web, db]
code:
  - apps/web/src/app/api/generate-skim/**
  - apps/web/src/server/skim/**
  - packages/service/src/features/editorial/skim/**
  - packages/service/src/sanity/write-client/**
  - packages/studio/src/schema-types/objects/post-takeaways/**
epics: [1028, 1027]
---

# Skim pipeline

## What it does

When a post is published, an endpoint on the public site can ask Claude for 3–7 one-sentence takeaways of it and write them onto the post's **draft** as its `postTakeaways`. Nothing reaches readers until an editor reviews the takeaways in the Studio and publishes the post again; publishing is the approval. Approved takeaways switch on the post's **30s** depth (./reading-experience.md). The endpoint is built and tested, but no Sanity webhook calls it yet, so today it runs only when something POSTs to it by hand. That is why the status is partial.

## Surfaces and routes

- **`POST /api/generate-skim?secret=<SANITY_GENERATE_SECRET>`** on `apps/web`, body `{ "_id": "<post id>" }` (a Sanity webhook payload carries `_id`). Node.js runtime. Returns `{ ok: true, count }` on success.
- **Studio:** the post's "Takeaways" field (`postTakeaways`, collapsed by default), between Published At and SEO. `takeaways` is editable; `generatedAt` and `model` are read-only. Its preview reads "N takeaways" or "No takeaways yet".
- **Platform:** none. No Studio action or platform button triggers generation.

## Data

- **Sanity:** `page_post.postTakeaways` of type `postTakeaways`: `takeaways` (array of strings, each at most 160 characters, 3–7 items), `generatedAt` (datetime), `model` (string). Written to `drafts.<postId>` only.
- **Read step:** `service.editorial.skim.v1.getPublishedPostBody` reads the published post's `content` by `_id`, behind `PUBLISHED_POST_FILTER`, with no ISR tags, so it is never served stale. A post scheduled for the future fails this read.
- **Neon (read only):** the tenant row resolved from the request host supplies the read credentials and the write credentials (`sanityProjectId`, `sanityDataset`, `sanityReadTokenEncrypted`, `sanityWriteTokenEncrypted`, decrypted with `TENANT_TOKEN_ENCRYPTION_KEY`), plus `status` and `deprovisionedAt` for the write gate.
- **Cache:** the route caches nothing. Writing a draft does not revalidate the site; readers see the takeaways after the next publish, through the normal publish webhook (./rendering-and-caching.md).

## Configuration

- No owner or editor setting turns it on or off. It is enabled by the presence of `ANTHROPIC_API_KEY` and `SANITY_GENERATE_SECRET` on the web deployment; without either the route answers 503 and readers are unaffected.
- Not plan-gated and not a capability: any active tenant whose host reaches the route gets a Claude call per request.
- Editors can write or edit takeaways by hand in the Studio; the reader path does not care where they came from.
- Look and Voice do not apply: the takeaways are content, written in the post's own voice.

## Constraints and invariants

- **No AI on the reader path.** Generation runs only inside this route; pages read only the published field.
- **Draft only.** `saveSkimDraft` creates the draft from the published document if none exists, then `set`s `postTakeaways` on it in one transaction. It never patches the published document and never touches other draft fields. Re-running overwrites the draft's takeaways, including any human edits there.
- **Order of checks:** missing key or secret → 503; wrong `secret` (constant-time `isSecretMatch`) → 401; malformed JSON or no `_id` → 400; host resolves to no servable tenant in production → 404; tenant without write credentials → 503; tenant not `ACTIVE` or deprovisioned → 403; body read fails → 500; generation fails → 422 with the draft untouched; no usable write context → 503; save fails → 500. Each failure logs a `generate_skim.*` event; a wrong secret or bad body does not.
- **Tenant comes from the `Host` header** (`getHostTenantSanityContext` / `getHostTenantSanityWriteContext`), because `/api/*` skips the proxy's tenant rewrite. A webhook must therefore call the tenant's own host. Outside production a host with no tenant falls back to the only tenant if exactly one servable tenant exists, otherwise to the platform project, writing with `SANITY_API_WRITE_TOKEN`.
- **Generation:** `generateTakeaways` sends the body's text blocks only (code, images and asides are skipped) to `claude-haiku-4-5` (`SKIM_GENERATION_MODEL`) at temperature 0, `max_tokens` 1024, with a zod output format of 3–7 strings of at most 160 characters. No parsed output throws. The same constant is stored as `model`.
- **Rendering threshold:** the service treats fewer than 3 takeaways as none, matching the schema's `min(3)`.
- The write client uses the `raw` perspective and `useCdn: false`, and refuses a tenant context missing project, dataset or token (`InvalidTenantSanityContextError`). It is the only Sanity write path in `@blog/service` (`service.editorial.*`) and is never used for page reads.

## Dependencies

- Layers: `apps/web` (route, Anthropic call, tenant resolution), `@blog/service` (`service.editorial.skim.v1`, write client), `@blog/db` (tenant credentials), `@blog/studio` (`postTakeaways`), `@blog/config` (generated `PostTakeaways`, `ArticleText`). SDK: `@anthropic-ai/sdk`.
- Features: ./reading-experience.md (renders the result), ./posts.md, ./rich-text.md (body shape), ./multi-tenancy.md (host resolution), ./tenant-provisioning.md (which registers only the revalidation webhook), ./rendering-and-caching.md.
- Env (web): `ANTHROPIC_API_KEY`, `SANITY_GENERATE_SECRET`, `TENANT_TOKEN_ENCRYPTION_KEY`; `SANITY_API_WRITE_TOKEN` for the non-production platform fallback. All declared in `turbo.json`.

## Entry points

- `apps/web/src/app/api/generate-skim/route.ts`
- `apps/web/src/server/skim/generate-takeaways/generate-takeaways.ts`
- `apps/web/src/server/tenant/tenant-sanity-context/tenant-sanity-context.ts`
- `packages/service/src/features/editorial/skim/application/service.ts`
- `packages/service/src/features/editorial/skim/adaptor/get-post-body/{query,loader}.ts`
- `packages/service/src/features/editorial/skim/adaptor/save-skim-draft/loader.ts`
- `packages/service/src/sanity/write-client/write-client.ts`
- `packages/studio/src/schema-types/objects/post-takeaways/post-takeaways.ts`

## Tests and stories

- `apps/web/src/app/api/generate-skim/route.test.ts`, `apps/web/src/server/skim/generate-takeaways/generate-takeaways.test.ts`.
- `packages/service/src/features/editorial/skim/**/*.test.ts`, `packages/service/src/sanity/write-client/write-client.test.ts`.
- No stories: the pipeline has no UI of its own.

## Related

- #1027 wire up the Sanity publish webhook for `/api/generate-skim`.
- #1028 epic: skip regeneration on redundant publishes, with a body fingerprint and a force override (#1029 studio, #1030 service, #1031 web).
