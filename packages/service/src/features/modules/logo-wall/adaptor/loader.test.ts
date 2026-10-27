import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  mockRawLogoItem,
  mockRawLogoWallModule,
} from '@blog/service/testing/modules/fixtures';
import {
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

import { getLogoWallModule } from './loader';
import { logoWallModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_LOGO_WALL_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_LOGO_KEYS = [
  faker.string.uuid(),
  faker.string.uuid(),
  faker.string.uuid(),
];

describe(getLogoWallModule, () => {
  it('maps the module document with its logos in authored order', async () => {
    mockRun.mockResolvedValue(
      mockRawLogoWallModule({
        headingBlock: mockRawHeadingBlock(MOCK_HEADING),
        logos: MOCK_LOGO_KEYS.map((_key) => mockRawLogoItem({ _key })),
      }),
    );

    const logoWall = await getLogoWallModule(MOCK_LOGO_WALL_ID, MOCK_TENANT);

    expect(logoWall.headingBlock.heading).toBe(MOCK_HEADING);
    expect(logoWall.logos.map((logo) => logo.id)).toEqual(MOCK_LOGO_KEYS);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getLogoWallModule(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('fetches for the tenant with tags scoped to the module', async () => {
    mockRun.mockResolvedValue(mockRawLogoWallModule());

    await getLogoWallModule(MOCK_LOGO_WALL_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(logoWallModuleQuery, {
      parameters: { id: MOCK_LOGO_WALL_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:logoWall'),
          mockCacheTag(`module:${MOCK_LOGO_WALL_ID}`),
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
