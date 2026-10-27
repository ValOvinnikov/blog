import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawHeroStatementModule } from '@blog/service/testing/modules/fixtures';
import {
  MOCK_LINK_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getHeroStatement } from './loader';
import { heroStatementModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6);

const MOCK_HERO_STATEMENT_ID = faker.string.uuid();
const MOCK_HERO_STATEMENT_HEADING = faker.lorem.words(3);

describe(getHeroStatement, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawHeroStatementModule({
        headingBlock: mockRawHeadingBlock(MOCK_HERO_STATEMENT_HEADING),
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
          MOCK_LINK_CACHE_TAG,
        ],
      },
    });
  });
});
