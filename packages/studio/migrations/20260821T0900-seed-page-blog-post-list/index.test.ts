import { MOCK_SYSTEM_FIELDS } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { at, createIfNotExists, patch, set } from 'sanity/migrate';

import migration from './index';

faker.seed(14);

const PAGE_BLOG_ID = 'page_blog';
const BLOG_POST_LIST_ID = 'postList-blog';
const MOCK_ITEMS_PER_PAGE = faker.number.int({ min: 1, max: 50 });

describe('seed-page-blog-post-list migration', () => {
  it.each([
    ['published', PAGE_BLOG_ID, BLOG_POST_LIST_ID],
    ['draft', `drafts.${PAGE_BLOG_ID}`, `drafts.${BLOG_POST_LIST_ID}`],
  ])(
    'seeds the post list and references it from a %s page_blog',
    (_label, pageId, postListId) => {
      const page = {
        ...MOCK_SYSTEM_FIELDS,
        _id: pageId,
        _type: 'page_blog',
        itemsPerPage: MOCK_ITEMS_PER_PAGE,
      };

      const result = migration.migrate.document(page);

      expect(result).toEqual([
        createIfNotExists({
          _id: postListId,
          _type: 'module_postList',
          pageSize: MOCK_ITEMS_PER_PAGE,
          limit: MOCK_ITEMS_PER_PAGE,
        }),
        patch(pageId, [
          at('postList', set({ _type: 'reference', _ref: postListId })),
        ]),
      ]);
    },
  );

  it('leaves a page_blog that already has a postList alone', () => {
    const page = {
      ...MOCK_SYSTEM_FIELDS,
      _id: PAGE_BLOG_ID,
      _type: 'page_blog',
      itemsPerPage: MOCK_ITEMS_PER_PAGE,
      postList: { _type: 'reference', _ref: BLOG_POST_LIST_ID },
    };

    const result = migration.migrate.document(page);

    expect(result).toBeUndefined();
  });
});
