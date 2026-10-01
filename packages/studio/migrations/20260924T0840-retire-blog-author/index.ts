// Must run after 20260924T0835-create-person-from-blog-author — Sanity refuses to delete a still-referenced document.
import { defineMigration, del, type Mutation } from 'sanity/migrate';

import { toPersonId } from '../20260924T0835-create-person-from-blog-author/id';
import { assertCounterpartDeletable } from '../lib/assert-counterpart-deletable';

const BLOG_AUTHOR_TYPE = 'blog_author';
const PERSON_TYPE = 'person';

const hasName = (name: unknown): boolean => Boolean(name);

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

        await assertCounterpartDeletable(context, doc._id, personId, {
          sourceType: BLOG_AUTHOR_TYPE,
          counterpartType: PERSON_TYPE,
          counterpartIdParam: 'personId',
          field: 'name',
          hasValue: hasName,
        });
        mutations.push(del(doc._id));
      }

      return mutations;
    },
  },
});
