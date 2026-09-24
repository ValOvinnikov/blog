/**
 * Retires `blog_author`: deletes every `blog_author` document (published and
 * draft) once its `person` counterpart is verified deletable.
 *
 * Steps, per visited `blog_author` document:
 *   1. Verify at run time, never trusting a prior check against a
 *      now-possibly-moved dataset, that its `person-<id>` counterpart exists
 *      with `name` set and nothing still references the `blog_author`
 *      (`assertBlogAuthorDeletable`, throws to abort the whole run
 *      otherwise).
 *   2. `del` it.
 *
 * Idempotency: a `blog_author` id already deleted is never visited again, so
 * a re-run is a no-op.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this only after
 * `20260924T0835-create-person-from-blog-author` has already run against the
 * same dataset — that migration is what makes every `blog_author` safe to
 * delete.
 */
import { defineMigration, del, type Mutation } from 'sanity/migrate';

import { toPersonId } from '../20260924T0835-create-person-from-blog-author/id';

import { assertBlogAuthorDeletable } from './precondition';

const BLOG_AUTHOR_TYPE = 'blog_author';

type TRawDocument = { _id: string; _type: string };

export default defineMigration({
  title: 'Retire blog_author: delete documents now represented by person',
  documentTypes: [BLOG_AUTHOR_TYPE],
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TRawDocument;
      const mutations: Mutation[] = [];

      if (doc._type === BLOG_AUTHOR_TYPE) {
        const personId = toPersonId(doc._id);

        await assertBlogAuthorDeletable(context, doc._id, personId);
        mutations.push(del(doc._id));
      }

      return mutations;
    },
  },
});
