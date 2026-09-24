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

// WeakMap keyed by context — a plain module variable would leak one run's id map into the next.
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
