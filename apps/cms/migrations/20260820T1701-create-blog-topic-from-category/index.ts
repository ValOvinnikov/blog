import {
  at,
  createIfNotExists,
  defineMigration,
  set,
  unset,
} from 'sanity/migrate';

import { toTopicId } from './id';

type TLegacyCategoryDoc = {
  _id: string;
  title?: string;
  slug?: { current?: string };
  description?: string;
};

type TLegacyPostDoc = {
  _id: string;
  category?: { _ref?: string };
};

export default defineMigration({
  title: 'Create blog_topic documents from blog_category and repoint posts',
  documentTypes: ['blog_category', 'blog_post'],

  migrate: {
    document(doc) {
      if (doc._type === 'blog_category') {
        const category = doc as unknown as TLegacyCategoryDoc;

        return [
          createIfNotExists({
            _id: toTopicId(category._id),
            _type: 'blog_topic',
            title: category.title,
            slug: category.slug,
            description: category.description,
          }),
        ];
      }

      const post = doc as unknown as TLegacyPostDoc;
      const ref = post.category?._ref;

      if (!ref) {
        return;
      }

      return [
        at('topic', set({ _type: 'reference', _ref: toTopicId(ref) })),
        at('category', unset()),
      ];
    },
  },
});
