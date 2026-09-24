// Must run after 20260924T0835-create-person-from-blog-author — Sanity refuses to delete a still-referenced document.
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
