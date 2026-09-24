/**
 * Creates a `person` document from every `blog_author` and rewrites every
 * dataset reference from a `blog_author` id to the matching `person` id.
 * `blog_author` documents are read from, never deleted, here — a Sanity
 * `_type` is immutable, so retiring `blog_author` is its own later migration
 * (`../20260924T0840-retire-blog-author`).
 *
 * Anchor: no `documentTypes` filter — the reference rewrite in step 2 has to
 * see every document in the dataset, not just `blog_author`. The two live
 * datasets don't even agree on who the referrers are: `production` is still
 * on the pre-#2960 content model, so its author references live on
 * `blog_post.author`, while `development` already carries `page_post.author`
 * and `module_heroProfile.author`. Rewriting by `_ref` value rather than by a
 * fixed list of referrer types is what makes this migration correct against
 * both without a dataset-specific branch.
 *
 * Steps, per visited document:
 *   1. If it's a `blog_author` (published or draft — `drafts.<id>` maps to
 *      `drafts.person-<id>` via `toPersonId`, so an unpublished edit
 *      survives), `createOrReplace` the matching `person` with every field
 *      carried across 1:1 (see `build-person-fields.ts` — the two types share
 *      the same fields, so this is a plain carry, not a merge).
 *   2. Regardless of type, rewrite any `_ref` anywhere in the document that
 *      matches a `blog_author` id to its `person` id (see `rewrite-refs.ts`).
 *
 * Idempotency: step 1 recomputes the same `person` fields from the same
 * `blog_author` source data every run (a stable function of its inputs, not a
 * one-time flag). Step 2 finds nothing left to rewrite once every reference
 * already points at its `person` id.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 */
import {
  createOrReplace,
  defineMigration,
  type MigrationContext,
  type Mutation,
} from 'sanity/migrate';

import { buildPersonFields, type TBlogAuthorDoc } from './build-person-fields';
import { toPersonId } from './id';
import { collectRefRewritePatches } from './rewrite-refs';

const BLOG_AUTHOR_TYPE = 'blog_author';
const PERSON_TYPE = 'person';

/**
 * Keyed by `context` (one stable object per migration run, per `run()` in
 * `@sanity/migrate`) rather than a plain module-level variable — a plain
 * variable would leak the first run's id map into every later run sharing
 * the same process (and every test sharing the same module instance).
 */
const blogAuthorIdMapCache = new WeakMap<
  MigrationContext,
  Promise<Map<string, string>>
>();

const getBlogAuthorIdMap = (
  context: MigrationContext,
): Promise<Map<string, string>> => {
  const cached = blogAuthorIdMapCache.get(context);

  if (cached) return cached;

  const computed = context.client
    .fetch<string[]>('*[_type == $type]._id', { type: BLOG_AUTHOR_TYPE })
    .then((ids) => new Map(ids.map((id) => [id, toPersonId(id)])));

  blogAuthorIdMapCache.set(context, computed);

  return computed;
};

type TRawDocument = { _id: string; _type: string; [key: string]: unknown };

export default defineMigration({
  title: 'Create person from blog_author and rewrite references',
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TRawDocument;
      const idMap = await getBlogAuthorIdMap(context);
      const mutations: Mutation[] = [];

      if (doc._type === BLOG_AUTHOR_TYPE) {
        const author = doc as unknown as TBlogAuthorDoc;
        const personId = toPersonId(author._id);
        const fields = buildPersonFields(author, idMap);

        mutations.push(
          createOrReplace({
            _id: personId,
            _type: PERSON_TYPE,
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
