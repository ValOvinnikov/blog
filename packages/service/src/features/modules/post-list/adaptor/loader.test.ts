import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { MOCK_TAG_ID } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_POST_LIST_PAGE_SIZE,
  MOCK_RECENT_POSTS_HEADING,
  mockRawPostListModule,
} from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_MODULES_POST_LIST_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TAG_CACHE_TAG,
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

import { getPostList } from './loader';
import { postListModulePaginatedPostsQuery } from './posts.query';
import { postListModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_POST_LIST_ID = faker.string.uuid();
const MOCK_POST_CARD_ID = faker.string.uuid();
const MOCK_TOTAL_POSTS = 25;
const MOCK_TOTAL_PAGES = 3;
const MOCK_SECOND_PAGE = 2;

describe(getPostList, () => {
  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getPostList(MOCK_MISSING_ID, 1, MOCK_TENANT),
    ).rejects.toThrow();
  });

  describe('with a module of nine posts a page and 25 matches', () => {
    beforeEach(() => {
      mockRun
        .mockResolvedValueOnce(
          mockRawPostListModule({
            headingBlock: mockRawHeadingBlock(MOCK_RECENT_POSTS_HEADING),
            pageSize: MOCK_POST_LIST_PAGE_SIZE,
          }),
        )
        .mockResolvedValueOnce({
          posts: [mockRawPostCard({ _id: MOCK_POST_CARD_ID })],
          total: MOCK_TOTAL_POSTS,
        });
    });

    it('maps the module and its page of posts', async () => {
      const postList = await getPostList(MOCK_POST_LIST_ID, 1, MOCK_TENANT);

      expect(postList.headingBlock.heading).toBe(MOCK_RECENT_POSTS_HEADING);
      expect(postList.posts.map(({ id }) => id)).toEqual([MOCK_POST_CARD_ID]);
    });

    it.each([
      [1, undefined],
      [MOCK_SECOND_PAGE, MOCK_SECOND_PAGE],
    ])(
      'loads page %i of the posts and counts every page',
      async (expectedPage, page) => {
        const postList = await getPostList(
          MOCK_POST_LIST_ID,
          page,
          MOCK_TENANT,
        );

        const [postsQuery] = mockRun.mock.calls[1] ?? [];

        expect(postsQuery.query).toBe(
          postListModulePaginatedPostsQuery(
            expectedPage,
            MOCK_POST_LIST_PAGE_SIZE,
          ).query,
        );
        expect(postList.currentPage).toBe(expectedPage);
        expect(postList.totalPages).toBe(MOCK_TOTAL_PAGES);
      },
    );

    it('scopes the posts query to the term when one is given', async () => {
      await getPostList(MOCK_POST_LIST_ID, 1, MOCK_TENANT, {
        termId: MOCK_TAG_ID,
      });

      const [, postsOptions] = mockRun.mock.calls[1] ?? [];

      expect(postsOptions.parameters).toEqual({ termId: MOCK_TAG_ID });
    });

    it('queries within the tenant and tags both queries to it', async () => {
      await getPostList(MOCK_POST_LIST_ID, 1, MOCK_TENANT);

      const [, postsOptions] = mockRun.mock.calls[1] ?? [];

      expect(mockRun).toHaveBeenNthCalledWith(1, postListModuleQuery, {
        parameters: { id: MOCK_POST_LIST_ID },
        tenant: MOCK_TENANT,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            MOCK_MODULES_POST_LIST_CACHE_TAG,
            mockCacheTag(`module:${MOCK_POST_LIST_ID}`),
          ],
        },
      });
      expect(postsOptions).toEqual({
        parameters: {},
        tenant: MOCK_TENANT,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            MOCK_POSTS_CACHE_TAG,
            MOCK_AUTHOR_CACHE_TAG,
            MOCK_TOPIC_CACHE_TAG,
            MOCK_TAG_CACHE_TAG,
          ],
        },
      });
    });
  });
});
