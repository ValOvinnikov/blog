import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_RECENT_POSTS_HEADING } from '@blog/service/testing/modules/fixtures';
import { mockRawPostLatestModule } from '@blog/service/testing/modules/post-latest/fixtures';
import {
  MOCK_POST_LATEST_MODULE_ID,
  mockRawPostCard,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_LINK_TARGET_CACHE_TAGS,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPostLatest } from './loader';
import { postLatestModulePostsQuery } from './posts.query';
import { postLatestModuleQuery } from './query';
import type { TPostLatestModule } from './types';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_LIMIT = 3;
const MOCK_POST_CARD_ID = faker.string.uuid();

describe(getPostLatest, () => {
  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getPostLatest(MOCK_MISSING_ID, MOCK_TENANT)).rejects.toThrow();
  });

  describe('with a resolved module', () => {
    let postLatest: TPostLatestModule;

    beforeEach(async () => {
      mockRun
        .mockResolvedValueOnce(
          mockRawPostLatestModule({
            headingBlock: mockRawHeadingBlock(MOCK_RECENT_POSTS_HEADING),
            limit: MOCK_LIMIT,
          }),
        )
        .mockResolvedValueOnce([mockRawPostCard({ _id: MOCK_POST_CARD_ID })]);

      postLatest = await getPostLatest(MOCK_POST_LATEST_MODULE_ID, MOCK_TENANT);
    });

    it('maps the module and its posts', () => {
      expect(postLatest.headingBlock.heading).toBe(MOCK_RECENT_POSTS_HEADING);
      expect(postLatest.posts.map(({ id }) => id)).toEqual([MOCK_POST_CARD_ID]);
    });

    it('fetches only as many posts as the module limit allows', () => {
      const [postsQuery] = mockRun.mock.calls[1] ?? [];

      expect(postsQuery.query).toBe(
        postLatestModulePostsQuery(MOCK_LIMIT).query,
      );
    });

    it('queries within the tenant and tags both queries to it', () => {
      const [, postsOptions] = mockRun.mock.calls[1] ?? [];

      expect(mockRun).toHaveBeenNthCalledWith(1, postLatestModuleQuery, {
        parameters: { id: MOCK_POST_LATEST_MODULE_ID },
        tenant: MOCK_TENANT,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            mockCacheTag('modules:postLatest'),
            mockCacheTag(`module:${MOCK_POST_LATEST_MODULE_ID}`),
          ],
        },
      });
      expect(postsOptions).toEqual({
        tenant: MOCK_TENANT,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            MOCK_POSTS_CACHE_TAG,
            MOCK_AUTHOR_CACHE_TAG,
            MOCK_TOPIC_CACHE_TAG,
            ...MOCK_LINK_TARGET_CACHE_TAGS,
          ],
        },
      });
    });
  });
});
