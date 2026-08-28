# Test suite performance findings

Investigation of slow `pnpm test`. Reference run (clean machine, user-supplied):
`apps/web` 151 files / 976 tests, **325s**; `turbo run test` total **5m28s**.

## Where the time goes

The reference run's own breakdown, summed across parallel workers:

| phase           | time        |
| --------------- | ----------- |
| **environment** | **505.71s** |
| import          | 156.71s     |
| tests           | 145.97s     |
| setup           | 59.64s      |
| transform       | 32.84s      |

`environment` is jsdom construction, and it is larger than every other phase
combined. It is not the assertions that are slow.

## Root cause

`apps/web`, `apps/platform` and `packages/ui` set `environment: 'jsdom'` for
**every** test file. With `isolate: true` (the default) each test file gets a
fresh module registry, so each one re-imports the jsdom module.

Measured on this repo: importing the `jsdom` module costs **~1-10s**, while
constructing the DOM afterwards costs only **~155-240ms**. The repeated module
import is the cost, not the DOM itself.

Most of those files never touch a DOM:

| workspace       | total test files | need no DOM                                     |
| --------------- | ---------------- | ----------------------------------------------- |
| `apps/web`      | 151              | **62**                                          |
| `apps/platform` | 78               | ~35                                             |
| `packages/ui`   | 63               | 3 (correctly jsdom — it is a component library) |

## Validated fix: run non-DOM tests on the node environment

Splitting `apps/web` into a node project (62 files) and a jsdom project
(89 files) was verified to be **behaviour-preserving**:

- node project: 62 files / 366 tests pass — `environment 31ms`
- jsdom project: 89 files / 610 tests pass
- 62 + 89 = 151 files, 366 + 610 = 976 tests — exactly matches the baseline

`environmentMatchGlobs` was **removed in Vitest 4**. The supported routes are a
per-file `// @vitest-environment node` docblock, or `test.projects`.

Four files look node-safe by grep but genuinely need jsdom, because they use
`DOMParser` (XML parsing) or simulate a browser via `window`:

- `src/app/rss.xml/route.test.ts`
- `src/app/[locale]/tag/[slug]/rss.xml/route.test.ts`
- `src/utils/build-rss-feed/build-rss-feed.test.ts`
- `src/utils/env/env.test.ts`

## Measured effect of the split — wall-clock win NOT demonstrated

Two full `apps/web` runs, back to back on the same machine:

| config                         | wall    | environment |
| ------------------------------ | ------- | ----------- |
| baseline (all 151 under jsdom) | 516.12s | 1911.48s    |
| split (62 files on `node`)     | 543.49s | 1507.15s    |

Both runs: 151 files / 976 tests passing. The split removes ~21% of the
environment work, but **wall-clock did not improve** — the two runs are within
noise of each other.

The machine was saturated throughout (load 100-780 on 8 cores), so runtime was
bound by CPU starvation, not by the jsdom work being removed. Removing real
work from a queue that is already starved does not shorten it.

So the split is _correct and does less work_, but its wall-clock benefit is
unproven. Re-run the two-config comparison on a quiet machine before treating
it as a performance fix. That result would also indicate whether the
oversubscription below is the dominant term.

## Config gotcha: `include` merges, `exclude` replaces

A project's `include` is **merged** with the inherited root `include` rather
than replacing it, so an `include`-based split silently widens each project to
the whole suite. The first attempt matched 143 + 151 = 294 files (81 `.tsx`
render tests wrongly on `node`, 475 failures). Split via `exclude` instead, and
verify the partition with `vitest list --project <name> --filesOnly`.

The `.ts` files that do need a DOM opt back in with their own
`/** @vitest-environment jsdom */` docblock, which overrides the project's
environment per file.

## Rejected: `--no-isolate`

Fast (roughly halves the jsdom set) but **incorrect here**: the full `apps/web`
suite produced **207 failures**, DOM from one test file leaking into the next
(`getByRole` matching leftover elements). Do not enable without per-file
teardown discipline.

## Secondary: worker oversubscription

Nothing in the repo sets `maxWorkers`, `poolOptions` or `fileParallelism`, and
`turbo run test` has no `--concurrency` cap (turbo defaults to 10). Vitest
defaults to roughly `cores - 1` workers per instance, so `pnpm test` can run
~10 vitest instances x ~7 workers on an 8-core machine.

The shared preset already carries a symptom of this — `testTimeout: 20_000`,
whose comment cites "parallel-turbo contention across packages".

Worth measuring on a quiet machine: `turbo run test --concurrency=3`, or a
`maxWorkers` cap in `configs/vitest/preset.ts`.

## Caveat on absolute numbers

Timings measured during this investigation ran at load averages of 587-646 on
8 cores (parallel background jobs), inflating wall times up to ~3x. The
_ratios_ and the pass/fail results above are reliable; the absolute wall-clock
figures from that window are not, and the reference run at the top should be
treated as the baseline.

## The 62 node-safe `apps/web` files

```
src/app/api/account/export/route.test.ts
src/app/api/client-log/route.test.ts
src/app/api/generate-skim/route.test.ts
src/app/api/newsletter/confirm/route.test.ts
src/app/api/revalidate-site-config/route.test.ts
src/app/api/revalidate/route.test.ts
src/app/robots.test.ts
src/app/sitemap.test.ts
src/components/shared/portable-text-renderer/code-block-syntax-theme.test.ts
src/config/fonts.test.ts
src/context/toast-provider/toast-store.test.ts
src/i18n/request.test.ts
src/metadata/account-metadata/build-account-metadata.test.ts
src/metadata/author-metadata/build-author-metadata.test.ts
src/metadata/blog-list-metadata/build-blog-list-metadata.test.ts
src/metadata/bookmarks-metadata/build-bookmarks-metadata.test.ts
src/metadata/category-metadata/build-category-metadata.test.ts
src/metadata/generic-page-metadata/build-generic-page-metadata.test.ts
src/metadata/post-metadata/build-post-metadata.test.ts
src/metadata/tag-metadata/build-tag-metadata.test.ts
src/metadata/to-metadata.test.ts
src/metadata/topics-metadata/build-topics-metadata.test.ts
src/proxy.test.ts
src/server/account/account-actions.test.ts
src/server/account/identity-actions.test.ts
src/server/bookmarks/bookmark-actions.test.ts
src/server/client-log/client-log-rate-limiter.test.ts
src/server/client-log/client-log-schema.test.ts
src/server/email/send-email.test.ts
src/server/newsletter/newsletter-actions.test.ts
src/server/newsletter/newsletter-confirmation-email.test.ts
src/server/newsletter/newsletter-from-address.test.ts
src/server/newsletter/newsletter-subscription-actions.test.ts
src/server/site-config/get-site-config.test.ts
src/server/skim/generate-takeaways.test.ts
src/server/tenant/get-request-tenant-id.test.ts
src/server/tenant/get-tenant-sanity-context.test.ts
src/server/tenant/resolve-tenant-id.test.ts
src/utils/apply-voice-overrides/apply-voice-overrides.test.ts
src/utils/block-text-to-plain/block-text-to-plain.test.ts
src/utils/build-blog-posting-schema/build-blog-posting-schema.test.ts
src/utils/build-breadcrumb-list-schema/build-breadcrumb-list-schema.test.ts
src/utils/build-share-links/build-share-links.test.ts
src/utils/build-theme-style-block/build-theme-style-block.test.ts
src/utils/escape-xml/escape-xml.test.ts
src/utils/extract-post-headings/extract-post-headings.test.ts
src/utils/get-categories-safely/get-categories-safely.test.ts
src/utils/get-chrome-on/get-chrome-on.test.ts
src/utils/get-theme-tokens/get-theme-tokens.test.ts
src/utils/has-newsletter-subscribed-cookie/has-newsletter-subscribed-cookie.test.ts
src/utils/is-production-environment/is-production-environment.test.ts
src/utils/is-secret-match/is-secret-match.test.ts
src/utils/is-valid-email/is-valid-email.test.ts
src/utils/is-web-analytics-enabled/is-web-analytics-enabled.test.ts
src/utils/parse-page-param/parse-page-param.test.ts
src/utils/revalidate-tags/revalidate-tags.test.ts
src/utils/segment-portable-text-body/segment-portable-text-body.test.ts
src/utils/to-portable-text-image/to-portable-text-image.test.ts
src/utils/to-post-list-items/to-post-list-items.test.ts
src/utils/to-session-username/to-session-username.test.ts
src/utils/to-social-icon-name/to-social-icon-name.test.ts
src/utils/to-theme-tokens/to-theme-tokens.test.ts
```
