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
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  MOCK_POST_HREF,
  MOCK_POST_TITLE,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getHeroBlog } from './loader';
import { heroBlogModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const HERO_BLOG_ID = 'hero-blog-1';

const tenant = mockTenant();

describe(getHeroBlog, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawHeroBlogModule({
        post: mockRawPostCard({ _id: 'pinned-post' }),
      }),
    );
  });

  it('resolves the hero in a single round trip — exactly one runQuery call', async () => {
    const hero = await getHeroBlog(HERO_BLOG_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    if (!hero.hasPost) throw new Error('expected a resolved post');
    expect(hero.heading).toBe(MOCK_POST_TITLE);
    expect(hero.ctaButtons[0]?.link.href).toBe(MOCK_POST_HREF);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getHeroBlog(MOCK_MISSING_ID, tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getHeroBlog(HERO_BLOG_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(1, heroBlogModuleQuery, {
      parameters: { id: HERO_BLOG_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          't:tenant-a:modules:heroBlog',
          't:tenant-a:module:hero-blog-1',
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
