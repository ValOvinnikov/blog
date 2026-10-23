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
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPostList } from './loader';
import { postListModulePaginatedPostsQuery } from './posts.query';
import { postListModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const POST_LIST_ID = 'post-list-1';

const tenant = mockTenant();

describe(getPostList, () => {
  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getPostList(MOCK_MISSING_ID, 1, tenant)).rejects.toThrow();
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
          posts: [mockRawPostCard({ _id: 'a' })],
          total: 25,
        });
    });

    it('maps the module and its page of posts', async () => {
      const postList = await getPostList(POST_LIST_ID, 1, tenant);

      expect(postList.headingBlock.heading).toBe(MOCK_RECENT_POSTS_HEADING);
      expect(postList.posts.map((p) => p.id)).toEqual(['a']);
    });

    it.each([
      [1, undefined],
      [2, 2],
    ])(
      'windows page %i by the module pageSize and counts every page',
      async (expectedPage, page) => {
        const postList = await getPostList(POST_LIST_ID, page, tenant);

        const [postsQuery] = mockRun.mock.calls[1] ?? [];

        expect(postsQuery.query).toBe(
          postListModulePaginatedPostsQuery(
            expectedPage,
            MOCK_POST_LIST_PAGE_SIZE,
          ).query,
        );
        expect(postList.currentPage).toBe(expectedPage);
        expect(postList.totalPages).toBe(3);
      },
    );

    it('binds the scope term id as a posts-query parameter when scoped', async () => {
      await getPostList(POST_LIST_ID, 1, tenant, { termId: MOCK_TAG_ID });

      const [, postsOptions] = mockRun.mock.calls[1] ?? [];

      expect(postsOptions.parameters).toEqual({ termId: MOCK_TAG_ID });
    });

    it('threads tenant context into both queries and scopes their tags to it', async () => {
      await getPostList(POST_LIST_ID, 1, tenant);

      const [, postsOptions] = mockRun.mock.calls[1] ?? [];

      expect(mockRun).toHaveBeenNthCalledWith(1, postListModuleQuery, {
        parameters: { id: POST_LIST_ID },
        tenant,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            MOCK_MODULES_POST_LIST_CACHE_TAG,
            't:tenant-a:module:post-list-1',
          ],
        },
      });
      expect(postsOptions).toEqual({
        parameters: {},
        tenant,
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
