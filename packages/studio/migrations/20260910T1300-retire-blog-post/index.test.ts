import { mockDocument } from '@blog/studio/testing/mock-documents';
import {
  MOCK_SYSTEM_FIELDS,
  mockMigrationContext,
} from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { at, del, patch, unset, type MigrationContext } from 'sanity/migrate';

import migration from './index';

faker.seed(1300);

const BLOG_POST_TYPE = 'blog_post';
const PAGE_POST_TYPE = 'page_post';
const MOCK_POST_ID = faker.string.uuid();
const MOCK_PAGE_POST_ID = `page_post-${MOCK_POST_ID}`;
const MOCK_DELETABLE_RESULT = {
  target: { content: [{ _type: 'block' }] },
  refCount: 0,
};

const mockContext = (result: {
  target: { content?: unknown } | null;
  refCount: number;
}): MigrationContext =>
  mockMigrationContext({ fetch: vi.fn().mockResolvedValue(result) });

describe('retire-blog-post migration', () => {
  let context: MigrationContext;

  beforeEach(() => {
    context = mockContext(MOCK_DELETABLE_RESULT);
  });

  describe('blog_post documents', () => {
    it('deletes a blog_post once its page_post counterpart is deletable', async () => {
      const doc = mockDocument({
        _id: MOCK_POST_ID,
        _type: BLOG_POST_TYPE,
        ...MOCK_SYSTEM_FIELDS,
      });

      const mutations = await migration.migrate.document(doc, context);

      expect(mutations).toEqual([del(MOCK_POST_ID)]);
    });

    it('checks the draft page_post counterpart for a draft blog_post', async () => {
      const draftId = `drafts.${MOCK_POST_ID}`;
      const fetch = vi.fn().mockResolvedValue(MOCK_DELETABLE_RESULT);
      const draftDoc = mockDocument({
        _id: draftId,
        _type: BLOG_POST_TYPE,
        ...MOCK_SYSTEM_FIELDS,
      });

      const mutations = await migration.migrate.document(
        draftDoc,
        mockMigrationContext({ fetch }),
      );
      const [, params] = fetch.mock.calls[0] ?? [];

      expect(mutations).toEqual([del(draftId)]);
      expect(params).toEqual({
        pagePostId: `drafts.${MOCK_PAGE_POST_ID}`,
        id: draftId,
      });
    });

    it('rejects when the page_post counterpart does not exist', async () => {
      const doc = mockDocument({
        _id: MOCK_POST_ID,
        _type: BLOG_POST_TYPE,
        ...MOCK_SYSTEM_FIELDS,
      });
      const missingContext = mockContext({ target: null, refCount: 0 });

      await expect(
        migration.migrate.document(doc, missingContext),
      ).rejects.toThrow(
        `Cannot delete ${BLOG_POST_TYPE} "${MOCK_POST_ID}": its ${PAGE_POST_TYPE} counterpart "${MOCK_PAGE_POST_ID}" does not exist.`,
      );
    });
  });

  describe('other documents', () => {
    it('unsets a leftover post field on a page_post', async () => {
      const doc = mockDocument({
        _id: MOCK_PAGE_POST_ID,
        _type: PAGE_POST_TYPE,
        ...MOCK_SYSTEM_FIELDS,
        post: { _type: 'reference', _ref: MOCK_PAGE_POST_ID },
      });

      const mutations = await migration.migrate.document(doc, context);

      expect(mutations).toEqual([
        patch(MOCK_PAGE_POST_ID, [at('post', unset())]),
      ]);
    });

    it('leaves a page_post with no post field alone', async () => {
      const doc = mockDocument({
        _id: MOCK_PAGE_POST_ID,
        _type: PAGE_POST_TYPE,
        ...MOCK_SYSTEM_FIELDS,
      });

      const mutations = await migration.migrate.document(doc, context);

      expect(mutations).toEqual([]);
    });

    it('leaves unrelated document types alone', async () => {
      const doc = mockDocument({
        _id: faker.string.uuid(),
        _type: 'blog_author',
        ...MOCK_SYSTEM_FIELDS,
      });

      const mutations = await migration.migrate.document(doc, context);

      expect(mutations).toEqual([]);
    });
  });
});
