import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_RECENT_POSTS_HEADING,
  mockRawPostLatestModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_POST_LATEST_MODULE_ID,
  mockRawPostCard,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPostLatest } from './loader';
import { postLatestModulePostsQuery } from './posts.query';
import { postLatestModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const LIMIT = 3;

const tenant = mockTenant();

describe(getPostLatest, () => {
  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getPostLatest(MOCK_MISSING_ID, tenant)).rejects.toThrow();
  });

  describe('with a resolved module', () => {
    beforeEach(() => {
      mockRun
        .mockResolvedValueOnce(
          mockRawPostLatestModule({
            headingBlock: mockRawHeadingBlock(MOCK_RECENT_POSTS_HEADING),
            limit: LIMIT,
          }),
        )
        .mockResolvedValueOnce([mockRawPostCard({ _id: 'a' })]);
    });

    it('bounds the posts query by the module limit and maps the result', async () => {
      const postLatest = await getPostLatest(
        MOCK_POST_LATEST_MODULE_ID,
        tenant,
      );

      const [postsQuery] = mockRun.mock.calls[1] ?? [];

      expect(postsQuery.query).toBe(postLatestModulePostsQuery(LIMIT).query);
      expect(postLatest.headingBlock.heading).toBe(MOCK_RECENT_POSTS_HEADING);
      expect(postLatest.posts.map((p) => p.id)).toEqual(['a']);
    });

    it('threads tenant context into both queries and scopes their tags to it', async () => {
      await getPostLatest(MOCK_POST_LATEST_MODULE_ID, tenant);

      const [, postsOptions] = mockRun.mock.calls[1] ?? [];

      expect(mockRun).toHaveBeenNthCalledWith(1, postLatestModuleQuery, {
        parameters: { id: MOCK_POST_LATEST_MODULE_ID },
        tenant,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            mockCacheTag('modules:postLatest'),
            mockCacheTag(`module:${MOCK_POST_LATEST_MODULE_ID}`),
          ],
        },
      });
      expect(postsOptions).toEqual({
        tenant,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            MOCK_POSTS_CACHE_TAG,
            MOCK_AUTHOR_CACHE_TAG,
            MOCK_TOPIC_CACHE_TAG,
          ],
        },
      });
    });
  });
});
