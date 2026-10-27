import { MOCK_SYSTEM_FIELDS } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { at, createIfNotExists, set, unset } from 'sanity/migrate';

import migration from './index';

faker.seed(10);

const MOCK_CATEGORY_ID = faker.string.uuid();
const MOCK_POST_ID = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words();
const MOCK_SLUG = { _type: 'slug', current: faker.lorem.slug() };
const MOCK_DESCRIPTION = faker.lorem.sentence();

describe('create-blog-topic-from-category migration', () => {
  describe('blog_category documents', () => {
    it('creates a blog_topic carrying title, slug and description', () => {
      const category = {
        ...MOCK_SYSTEM_FIELDS,
        _id: MOCK_CATEGORY_ID,
        _type: 'blog_category',
        title: MOCK_TITLE,
        slug: MOCK_SLUG,
        description: MOCK_DESCRIPTION,
      };

      const result = migration.migrate.document(category);

      expect(result).toEqual([
        createIfNotExists({
          _id: `topic-${MOCK_CATEGORY_ID}`,
          _type: 'blog_topic',
          title: MOCK_TITLE,
          slug: MOCK_SLUG,
          description: MOCK_DESCRIPTION,
        }),
      ]);
    });
  });

  describe('blog_post documents', () => {
    it('repoints a category reference onto the new topic and unsets category', () => {
      const post = {
        ...MOCK_SYSTEM_FIELDS,
        _id: MOCK_POST_ID,
        _type: 'blog_post',
        category: { _type: 'reference', _ref: MOCK_CATEGORY_ID },
      };

      const result = migration.migrate.document(post);

      expect(result).toEqual([
        at(
          'topic',
          set({ _type: 'reference', _ref: `topic-${MOCK_CATEGORY_ID}` }),
        ),
        at('category', unset()),
      ]);
    });

    it('leaves an already migrated post alone', () => {
      const post = {
        ...MOCK_SYSTEM_FIELDS,
        _id: MOCK_POST_ID,
        _type: 'blog_post',
        topic: { _type: 'reference', _ref: `topic-${MOCK_CATEGORY_ID}` },
      };

      const result = migration.migrate.document(post);

      expect(result).toBeUndefined();
    });
  });
});
