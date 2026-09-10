/**
 * Absorbs every `blog_post` content field onto its `page_post` counterpart
 * and rewrites every dataset reference from a `blog_post` id to the
 * matching `page_post` id. `blog_post` documents are read from, never
 * deleted, here — a Sanity `_type` is immutable, so retiring `blog_post`
 * is its own later migration.
 *
 * Anchor: no `documentTypes` filter — the reference rewrite in step 3 has
 * to see every document in the dataset, not just `blog_post`.
 *
 * Steps, per visited document:
 *   1. If it's a `blog_post` (published or draft — `drafts.<id>` maps to
 *      `drafts.page_post-<id>` via `toPagePostId`, so an unpublished edit
 *      survives), `createIfNotExists` the two shared modules, then
 *      `createOrReplace` the matching `page_post` with every content field
 *      merged in (see `build-page-post-fields.ts` for the conflict rules).
 *   2. Regardless of type, rewrite any `_ref` anywhere in the document that
 *      matches a `blog_post` id to its `page_post` id (see
 *      `rewrite-refs.ts`).
 *
 * Idempotency: step 1 recomputes the same `page_post` fields from the same
 * `blog_post` + already-migrated-page source data every run (a stable
 * function of its inputs, not a one-time flag), and `createIfNotExists` on
 * the shared modules is a no-op once they exist. Step 2 finds nothing left
 * to rewrite once every reference already points at its `page_post` id.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Safe to run against a dataset that never ran
 * `20260822T2057-seed-page-post-for-existing-post` (production, today) —
 * `page_post` is created from scratch in that case — and against one that
 * already did (development): the existing page's `slug`/`publishedAt`/`seo`
 * are read and kept.
 */
import {
  createIfNotExists,
  createOrReplace,
  defineMigration,
  type MigrationContext,
  type Mutation,
} from 'sanity/migrate';

import {
  buildPagePostFields,
  type TBlogPostDoc,
} from './build-page-post-fields';
import { toPagePostId } from './id';
import { collectRefRewritePatches } from './rewrite-refs';
import {
  sharedNewsletterModule,
  sharedPostRelatedModule,
} from './shared-modules';

const BLOG_POST_TYPE = 'blog_post';
const PAGE_POST_TYPE = 'page_post';

/**
 * Keyed by `context` (one stable object per migration run, per `run()` in
 * `@sanity/migrate`) rather than a plain module-level variable — a plain
 * variable would leak the first run's id map into every later run sharing
 * the same process (and every test sharing the same module instance).
 */
const blogPostIdMapCache = new WeakMap<
  MigrationContext,
  Promise<Map<string, string>>
>();

const getBlogPostIdMap = (
  context: MigrationContext,
): Promise<Map<string, string>> => {
  const cached = blogPostIdMapCache.get(context);

  if (cached) return cached;

  const computed = context.client
    .fetch<string[]>('*[_type == $type]._id', { type: BLOG_POST_TYPE })
    .then((ids) => new Map(ids.map((id) => [id, toPagePostId(id)])));

  blogPostIdMapCache.set(context, computed);

  return computed;
};

type TExistingPagePost = {
  title?: string;
  slug?: { _type: 'slug'; current?: string };
  publishedAt?: string;
  seo?: unknown;
};

const getExistingPagePost = (
  context: MigrationContext,
  pagePostId: string,
): Promise<TExistingPagePost | null> =>
  context.client.fetch<TExistingPagePost | null>(
    '*[_id == $id][0]{ title, slug, publishedAt, seo }',
    { id: pagePostId },
  );

type TRawDocument = { _id: string; _type: string; [key: string]: unknown };

export default defineMigration({
  title: 'Absorb blog_post content into page_post and rewrite references',
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TRawDocument;
      const idMap = await getBlogPostIdMap(context);
      const mutations: Mutation[] = [];

      if (doc._type === BLOG_POST_TYPE) {
        const post = doc as unknown as TBlogPostDoc;
        const pagePostId = toPagePostId(post._id);
        const existingPagePost = await getExistingPagePost(context, pagePostId);
        const fields = buildPagePostFields(
          post,
          existingPagePost ?? undefined,
          idMap,
        );

        mutations.push(
          createIfNotExists(sharedPostRelatedModule),
          createIfNotExists(sharedNewsletterModule),
          createOrReplace({
            _id: pagePostId,
            _type: PAGE_POST_TYPE,
            ...fields,
          }),
        );
      }

      const refRewrite = collectRefRewritePatches(doc, idMap);

      if (refRewrite) mutations.push(refRewrite);

      return mutations;
    },
  },
});
