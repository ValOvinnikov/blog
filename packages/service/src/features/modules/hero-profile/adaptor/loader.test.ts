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
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getHeroProfile } from './loader';
import { heroProfileModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_HERO_PROFILE_ID = faker.string.uuid();
const MOCK_HERO_PROFILE_HEADING = faker.lorem.words(3);

describe(getHeroProfile, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawHeroProfileModule({
        headingBlock: mockRawHeadingBlock(MOCK_HERO_PROFILE_HEADING),
      }),
    );
  });

  it('resolves the hero from a single query', async () => {
    const hero = await getHeroProfile(MOCK_HERO_PROFILE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(hero.headingBlock.heading).toBe(MOCK_HERO_PROFILE_HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getHeroProfile(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });

  it('queries with the tenant and tenant-scoped cache tags', async () => {
    await getHeroProfile(MOCK_HERO_PROFILE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenNthCalledWith(1, heroProfileModuleQuery, {
      parameters: { id: MOCK_HERO_PROFILE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:heroProfile'),
          mockCacheTag(`module:${MOCK_HERO_PROFILE_ID}`),
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
