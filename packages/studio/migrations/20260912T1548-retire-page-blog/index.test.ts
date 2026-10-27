import { mockReference } from '@blog/studio/testing/mock-documents';
import {
  MOCK_SYSTEM_FIELDS,
  mockMigrationContext,
} from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { del } from 'sanity/migrate';

import {
  PAGE_BLOG_TYPE,
  PAGE_POST_INDEX_TYPE,
} from '../20260912T0709-copy-page-blog-to-page-post-index/ids';

import migration from './index';

faker.seed(6018);

const DRAFTS_PREFIX = 'drafts.';
const MOCK_UNKNOWN_ID = faker.string.uuid();
const MOCK_MODULE_ID = faker.string.uuid();
const DELETABLE_RESULT = {
  target: { modules: [mockReference(MOCK_MODULE_ID)] },
  refCount: 0,
};

const mockContext = (result: {
  target: { modules?: unknown } | null;
  refCount: number;
}) => mockMigrationContext({ fetch: vi.fn().mockResolvedValue(result) });

const mockPageBlogDoc = (id: string) => ({
  ...MOCK_SYSTEM_FIELDS,
  _id: id,
  _type: PAGE_BLOG_TYPE,
});

describe('retire-page-blog migration', () => {
  it('deletes the published page_blog once its counterpart is deletable', async () => {
    const mutations = await migration.migrate.document(
      mockPageBlogDoc(PAGE_BLOG_TYPE),
      mockContext(DELETABLE_RESULT),
    );

    expect(mutations).toEqual([del(PAGE_BLOG_TYPE)]);
  });

  it('deletes the draft page_blog after checking the draft counterpart', async () => {
    const draftId = `${DRAFTS_PREFIX}${PAGE_BLOG_TYPE}`;
    const fetch = vi.fn().mockResolvedValue(DELETABLE_RESULT);

    const mutations = await migration.migrate.document(
      mockPageBlogDoc(draftId),
      mockMigrationContext({ fetch }),
    );
    const [, params] = fetch.mock.calls[0] ?? [];

    expect(mutations).toEqual([del(draftId)]);
    expect(params).toEqual({
      postIndexId: `${DRAFTS_PREFIX}${PAGE_POST_INDEX_TYPE}`,
      id: draftId,
    });
  });

  it('rejects when the page_postIndex counterpart does not exist', async () => {
    const context = mockContext({ target: null, refCount: 0 });

    await expect(
      migration.migrate.document(mockPageBlogDoc(PAGE_BLOG_TYPE), context),
    ).rejects.toThrow(
      `Cannot delete ${PAGE_BLOG_TYPE} "${PAGE_BLOG_TYPE}": its ${PAGE_POST_INDEX_TYPE} counterpart "${PAGE_POST_INDEX_TYPE}" does not exist.`,
    );
  });

  it('rejects a page_blog id that is not a known singleton id', async () => {
    await expect(
      migration.migrate.document(
        mockPageBlogDoc(MOCK_UNKNOWN_ID),
        mockContext(DELETABLE_RESULT),
      ),
    ).rejects.toThrow(
      `Encountered page_blog "${MOCK_UNKNOWN_ID}", which is not one of the known singleton ids. It was NOT deleted — a human must decide how to handle it before this migration can proceed.`,
    );
  });
});
