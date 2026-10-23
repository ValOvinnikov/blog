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
import { mockTenant } from '@blog/service/testing/tenant';

import { getHeroStatement } from './loader';
import { heroStatementModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const HERO_STATEMENT_ID = 'hero-statement-1';
const HERO_STATEMENT_HEADING = 'Ship confidently';

const tenant = mockTenant();

describe(getHeroStatement, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawHeroStatementModule({
        headingBlock: mockRawHeadingBlock(HERO_STATEMENT_HEADING),
      }),
    );
  });

  it('resolves the hero in a single round trip — exactly one runQuery call', async () => {
    const hero = await getHeroStatement(HERO_STATEMENT_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(hero.headingBlock.heading).toBe(HERO_STATEMENT_HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getHeroStatement(MOCK_MISSING_ID, tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getHeroStatement(HERO_STATEMENT_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(1, heroStatementModuleQuery, {
      parameters: { id: HERO_STATEMENT_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:heroStatement'),
          mockCacheTag(`module:${HERO_STATEMENT_ID}`),
          MOCK_LINK_CACHE_TAG,
        ],
      },
    });
  });
});
