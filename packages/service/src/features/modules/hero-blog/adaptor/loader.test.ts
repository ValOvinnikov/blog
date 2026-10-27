import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawHeroBlogModule } from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_PAGE_TAG_INDEX_CACHE_TAG,
  MOCK_PAGE_TOPIC_CACHE_TAG,
  MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
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
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getHeroBlog } from './loader';
import { heroBlogModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_HERO_BLOG_ID = faker.string.uuid();
const MOCK_PINNED_POST_ID = faker.string.uuid();

describe(getHeroBlog, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawHeroBlogModule({
        post: mockRawPostCard({ _id: MOCK_PINNED_POST_ID }),
      }),
    );
  });

  it('resolves the hero from a single query', async () => {
    const hero = await getHeroBlog(MOCK_HERO_BLOG_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledTimes(1);
    if (!hero.hasPost) throw new Error('expected a resolved post');
    expect(hero.heading).toBe(MOCK_POST_TITLE);
    expect(hero.ctaButtons[0]?.link.href).toBe(MOCK_POST_HREF);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getHeroBlog(MOCK_MISSING_ID, MOCK_TENANT)).rejects.toThrow();
  });

  it('queries with the tenant and tenant-scoped cache tags', async () => {
    await getHeroBlog(MOCK_HERO_BLOG_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenNthCalledWith(1, heroBlogModuleQuery, {
      parameters: { id: MOCK_HERO_BLOG_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:heroBlog'),
          mockCacheTag(`module:${MOCK_HERO_BLOG_ID}`),
          MOCK_POSTS_CACHE_TAG,
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
          MOCK_PAGE_POST_INDEX_CACHE_TAG,
          MOCK_PAGE_TOPIC_CACHE_TAG,
          MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
          MOCK_PAGE_TAG_CACHE_TAG,
          MOCK_PAGE_TAG_INDEX_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
        ],
      },
    });
  });
});
