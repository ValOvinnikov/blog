import { LOCALE_ISO_CODES } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { errorResult, okResult } from '@shinefold/utils';
import { routing } from '@web/i18n/routing';
import { resolveTenantPlanEntitlements } from '@web/server/tenant/tenant-entitlements/tenant-entitlements';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import {
  getTenantLiveLocales,
  resolveTenantLiveLocales,
  selectTenantLiveLocales,
} from './tenant-live-locales';

vi.mock('@shinefold/db', () => ({
  queries: {
    tenants: { getTenantLocales: vi.fn(), selectLiveLocalesWithin: vi.fn() },
  },
}));

vi.mock('@web/server/tenant/tenant-entitlements/tenant-entitlements');

const { EN, NL, DE, FR } = LOCALE_ISO_CODES;

const MOCK_LOCALE_TENANT = {
  id: MOCK_TENANT_ID,
  locale: EN,
  additionalLocales: [NL, DE, FR],
  plan: TENANT_PLAN.FREE,
};

const MOCK_LIVE_LOCALES = [EN, NL];

const getTenantLocalesMock = vi.mocked(queries.tenants.getTenantLocales);
const selectLiveLocalesWithinMock = vi.mocked(
  queries.tenants.selectLiveLocalesWithin,
);

beforeEach(() => {
  selectLiveLocalesWithinMock.mockReturnValue(MOCK_LIVE_LOCALES);
});

describe(selectTenantLiveLocales, () => {
  it("selects the tenant's languages within its plan and grants", async () => {
    expect(await selectTenantLiveLocales(MOCK_LOCALE_TENANT)).toEqual(
      MOCK_LIVE_LOCALES,
    );
    expect(resolveTenantPlanEntitlements).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      TENANT_PLAN.FREE,
    );
    expect(selectLiveLocalesWithinMock).toHaveBeenCalledWith(
      MOCK_LOCALE_TENANT,
      mockTenantEntitlements(TENANT_PLAN.FREE),
    );
  });
});

describe(getTenantLiveLocales, () => {
  it("reads the tenant's languages and plan by id", async () => {
    getTenantLocalesMock.mockResolvedValueOnce({
      defaultLocale: EN,
      additionalLocales: [NL],
      plan: TENANT_PLAN.FREE,
    });

    expect(await getTenantLiveLocales(MOCK_TENANT_ID)).toEqual(
      MOCK_LIVE_LOCALES,
    );
    expect(getTenantLocalesMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(selectLiveLocalesWithinMock).toHaveBeenCalledWith(
      {
        id: MOCK_TENANT_ID,
        locale: EN,
        additionalLocales: [NL],
        plan: TENANT_PLAN.FREE,
      },
      mockTenantEntitlements(TENANT_PLAN.FREE),
    );
  });

  it('resolves nothing for an unknown tenant', async () => {
    getTenantLocalesMock.mockResolvedValueOnce(undefined);

    expect(await getTenantLiveLocales(MOCK_TENANT_ID)).toBeUndefined();
  });
});

describe(resolveTenantLiveLocales, () => {
  it('falls back to the default locale for an unknown tenant', async () => {
    getTenantLocalesMock.mockResolvedValueOnce(undefined);

    expect(await resolveTenantLiveLocales(MOCK_TENANT_ID)).toEqual(
      okResult([routing.defaultLocale]),
    );
  });

  it('reports a thrown lookup as an error result', async () => {
    getTenantLocalesMock.mockRejectedValueOnce(MOCK_ERROR);

    expect(await resolveTenantLiveLocales(MOCK_TENANT_ID)).toEqual(
      errorResult(MOCK_ERROR),
    );
  });
});
