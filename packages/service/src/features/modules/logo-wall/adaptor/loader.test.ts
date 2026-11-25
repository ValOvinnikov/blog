import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  mockRawLogoItem,
  mockRawLogoWallModule,
} from '@shinefold/service/testing/modules/fixtures';
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

import { getLogoWallModule } from './loader';
import { logoWallModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

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
        headingBlock: mockRawModuleHeadingBlock(MOCK_HEADING),
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
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
