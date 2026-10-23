import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_LOGO_WALL_MODULE_ID,
  mockRawLogoWallModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getLogoWallModule } from './loader';
import { logoWallModuleQuery } from './query';
import type { TLogoWallModule } from './types';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getLogoWallModule, () => {
  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getLogoWallModule(MOCK_MISSING_ID, tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  describe('with a resolved module', () => {
    let logoWall: TLogoWallModule;

    beforeEach(async () => {
      mockRun.mockResolvedValue(mockRawLogoWallModule());

      logoWall = await getLogoWallModule(MOCK_LOGO_WALL_MODULE_ID, tenant);
    });

    it('resolves the module in a single round trip', () => {
      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(logoWall.headingBlock.heading).toBe('Trusted by');
    });

    it('returns the referenced logos in authored order', () => {
      expect(logoWall.logos.map((logo) => logo.id)).toEqual([
        'block-logo-1',
        'block-logo-2',
        'block-logo-3',
      ]);
    });

    it('threads tenant context and scopes cache tags to it', () => {
      expect(mockRun).toHaveBeenCalledWith(logoWallModuleQuery, {
        parameters: { id: MOCK_LOGO_WALL_MODULE_ID },
        tenant,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [
            't:tenant-a:modules:logoWall',
            't:tenant-a:module:logo-wall-1',
            MOCK_LINK_CACHE_TAG,
            MOCK_HOME_PAGE_CACHE_TAG,
            MOCK_PAGE_LANDING_CACHE_TAG,
          ],
        },
      });
    });
  });
});
