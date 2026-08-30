/**
 * Renames `_type: 'imageWithAlt'` -> `_type: 'bodyImage'` for image objects
 * that are members of a `body[]` richText array (#1018). Body content used to
 * reuse the shared `imageWithAlt` object type; it now has its own dedicated
 * `bodyImage` type (adds a `layout` field that only makes sense inside body
 * content) so that hero/avatar/brand/OpenGraph/site-settings images — which
 * all stay on `imageWithAlt`, unmodified — never carry a meaningless layout
 * choice. See `../../src/schema-types/objects/body-image.ts` and
 * `../../src/schema-types/objects/rich-text.ts`.
 *
 * Scoping: only `blog_post`/`module_content` documents are visited
 * (`documentTypes` below — the only two document types with a `body` richText
 * field), and within those, only `object()` nodes at the exact path
 * `['body', { _key }]` — i.e. the array member itself — are eligible (see
 * `isBodyArrayItemPath` in `./transform.ts`). `blog_post.heroImage` is a
 * plain (non-array) `imageWithAlt` field, so its path is `['heroImage']` and
 * never matches; the same is true for `blog_author.avatar`, `brand`'s logo
 * fields, `openGraph.image`, and `settings_site`'s favicon/logo fields — none
 * of them are reached by this migration.
 *
 * Idempotency: `renameBodyImageType` only acts on nodes whose `_type` is
 * still the legacy `imageWithAlt`; a node already renamed to `bodyImage`
 * (from a prior partial run) no longer matches and is left untouched — safe
 * to re-run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` *before*
 * deploying app/service code that expects body images to be `bodyImage`
 * (rather than `imageWithAlt`), so there is no window where live documents
 * have the old `_type` for code that only recognizes the new one.
 */
import { defineMigration, set } from 'sanity/migrate';

import { renameBodyImageType, type TBodyArrayImageNode } from './transform';

export default defineMigration({
  title: 'Rename body image type from imageWithAlt to bodyImage',
  documentTypes: ['blog_post', 'module_content'],
  migrate: {
    object(node, path) {
      const renamed = renameBodyImageType(
        node as unknown as TBodyArrayImageNode,
        path,
      );

      return renamed ? set(renamed) : undefined;
    },
  },
});
