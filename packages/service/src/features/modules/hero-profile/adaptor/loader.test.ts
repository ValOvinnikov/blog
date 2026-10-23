import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawHeroProfileModule } from '@blog/service/testing/modules/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getHeroProfile } from './loader';
import { heroProfileModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const HERO_PROFILE_ID = 'hero-profile-1';
const HERO_PROFILE_HEADING = 'Meet the author';

const tenant = mockTenant();

describe(getHeroProfile, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawHeroProfileModule({
        headingBlock: mockRawHeadingBlock(HERO_PROFILE_HEADING),
      }),
    );
  });

  it('resolves the hero in a single round trip — exactly one runQuery call', async () => {
    const hero = await getHeroProfile(HERO_PROFILE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(hero.headingBlock.heading).toBe(HERO_PROFILE_HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getHeroProfile(MOCK_MISSING_ID, tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getHeroProfile(HERO_PROFILE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(1, heroProfileModuleQuery, {
      parameters: { id: HERO_PROFILE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:heroProfile'),
          mockCacheTag(`module:${HERO_PROFILE_ID}`),
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
