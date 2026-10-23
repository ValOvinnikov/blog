import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_FEATURED_POST_ID,
  mockRawHeroModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_HERO_MODULE_ID,
  mockRawPostCard,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_PAGE_POST_CACHE_TAG,
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  MOCK_POST_HREF,
  MOCK_POST_TITLE,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { heroFallbackFeaturedPostQuery } from './featured-post.query';
import { getHero } from './loader';
import { heroModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const POST_TAGS = [
  MOCK_POSTS_CACHE_TAG,
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
];

const tenant = mockTenant();

describe('getHero', () => {
  it('propagates when the hero document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getHero(MOCK_MISSING_ID, tenant)).rejects.toThrow();
  });

  describe('when the hero document resolves', () => {
    beforeEach(() => {
      mockRun
        .mockResolvedValueOnce(
          mockRawHeroModule({
            featuredPost: mockRawPostCard({ _id: MOCK_FEATURED_POST_ID }),
          }),
        )
        .mockResolvedValueOnce(null);
    });

    it('resolves the hero using the configured featured post', async () => {
      const hero = await getHero(MOCK_HERO_MODULE_ID, tenant);

      expect(hero.title).toBe(MOCK_POST_TITLE);
      expect(hero.primaryAction?.href).toBe(MOCK_POST_HREF);
    });

    it('threads tenant context into both queries and scopes their tags to it', async () => {
      await getHero(MOCK_HERO_MODULE_ID, tenant);

      expect(mockRun).toHaveBeenNthCalledWith(1, heroModuleQuery, {
        parameters: { id: MOCK_HERO_MODULE_ID },
        tenant,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            mockCacheTag('modules:hero'),
            mockCacheTag(`module:${MOCK_HERO_MODULE_ID}`),
            ...POST_TAGS,
            MOCK_PAGE_POST_CACHE_TAG,
            MOCK_PAGE_LANDING_CACHE_TAG,
            MOCK_PAGE_POST_INDEX_CACHE_TAG,
          ],
        },
      });
      expect(mockRun).toHaveBeenNthCalledWith(
        2,
        heroFallbackFeaturedPostQuery,
        {
          tenant,
          next: {
            revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
            tags: POST_TAGS,
          },
        },
      );
    });
  });
});
