import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockRawHeroStatementModule } from '@shinefold/service/testing/modules/hero-statement/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getHeroStatement } from './loader';
import { heroStatementModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(6);

const MOCK_HERO_STATEMENT_ID = faker.string.uuid();
const MOCK_HERO_STATEMENT_HEADING = faker.lorem.words(3);

describe(getHeroStatement, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawHeroStatementModule({
        headingBlock: mockRawModuleHeadingBlock(MOCK_HERO_STATEMENT_HEADING),
      }),
    );
  });

  it('resolves the hero in a single round trip', async () => {
    const hero = await getHeroStatement(MOCK_HERO_STATEMENT_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(hero.headingBlock.heading).toBe(MOCK_HERO_STATEMENT_HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getHeroStatement(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('queries with the tenant and the cache tags scoped to it', async () => {
    await getHeroStatement(MOCK_HERO_STATEMENT_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(heroStatementModuleQuery, {
      parameters: { id: MOCK_HERO_STATEMENT_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:heroStatement'),
          mockCacheTag(`module:${MOCK_HERO_STATEMENT_ID}`),
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
