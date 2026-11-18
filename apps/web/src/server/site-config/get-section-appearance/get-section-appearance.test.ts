import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { SECTION_APPEARANCE_LOG } from '@web/constants/section-appearance';
import { getEffectiveEntitlements } from '@web/server/site-config/get-effective-entitlements/get-effective-entitlements';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_NO_SECTION_STYLE_OVERRIDES,
  MOCK_SECTION_LOOK,
  MOCK_SECTION_STYLE_OVERRIDES,
} from '@web/testing/shared/section-appearance/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getSectionAppearance } from './get-section-appearance';

vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock(
  '@web/server/site-config/get-effective-entitlements/get-effective-entitlements',
);

vi.mock(
  '@shinefold/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

const { cardStyle: PRESET_CARD_STYLE, buttonShape: PRESET_BUTTON_SHAPE } =
  PRESET_REGISTRY[PRESET_ID.CONSOLE];

describe(getSectionAppearance, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
    getSiteConfigMock.mockResolvedValue(mockSiteConfig(MOCK_SECTION_LOOK));
  });

  it("pairs a Growth site's overrides with its saved card style and button shape", async () => {
    await expect(
      getSectionAppearance(MOCK_TENANT_ID, MOCK_SECTION_STYLE_OVERRIDES),
    ).resolves.toEqual({
      overrides: MOCK_SECTION_STYLE_OVERRIDES,
      look: MOCK_SECTION_LOOK,
    });
  });

  it('drops the overrides on a Free site', async () => {
    vi.mocked(getEffectiveEntitlements).mockResolvedValueOnce(
      mockTenantEntitlements(TENANT_PLAN.FREE),
    );

    const { overrides } = await getSectionAppearance(
      MOCK_TENANT_ID,
      MOCK_SECTION_STYLE_OVERRIDES,
    );

    expect(overrides).toEqual(MOCK_NO_SECTION_STYLE_OVERRIDES);
  });

  it('reads the unresolved tenant without a request header lookup', async () => {
    await getSectionAppearance(undefined, MOCK_SECTION_STYLE_OVERRIDES);

    expect(getRequestTenantId).toHaveBeenCalledWith(
      UNRESOLVED_TENANT_PLACEHOLDER,
    );
    expect(getEffectiveEntitlements).toHaveBeenCalledWith(
      UNRESOLVED_TENANT_PLACEHOLDER,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it("falls back to the preset's card style and button shape", async () => {
      const { look } = await getSectionAppearance(
        MOCK_TENANT_ID,
        MOCK_SECTION_STYLE_OVERRIDES,
      );

      expect(look).toEqual({
        cardStyle: PRESET_CARD_STYLE,
        buttonShape: PRESET_BUTTON_SHAPE,
      });
    });

    it('logs the failure', async () => {
      await getSectionAppearance(MOCK_TENANT_ID, MOCK_SECTION_STYLE_OVERRIDES);

      expect(logger.error).toHaveBeenCalledWith(
        SECTION_APPEARANCE_LOG.SITE_CONFIG_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
