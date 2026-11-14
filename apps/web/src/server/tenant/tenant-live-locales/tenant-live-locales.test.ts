import { LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { routing } from '@web/i18n/routing';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { resolveTenantLiveLocales } from './tenant-live-locales';

const { getTenantLiveLocalesMock } = vi.hoisted(() => ({
  getTenantLiveLocalesMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantLiveLocales: getTenantLiveLocalesMock } },
}));

const { EN, NL } = LOCALE_ISO_CODES;

describe(resolveTenantLiveLocales, () => {
  it('resolves the tenant’s live locales', async () => {
    getTenantLiveLocalesMock.mockResolvedValue([EN, NL]);

    expect(await resolveTenantLiveLocales(MOCK_TENANT_ID)).toEqual(
      okResult([EN, NL]),
    );
    expect(getTenantLiveLocalesMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('falls back to the default locale for an unknown tenant', async () => {
    getTenantLiveLocalesMock.mockResolvedValue(undefined);

    expect(await resolveTenantLiveLocales(MOCK_TENANT_ID)).toEqual(
      okResult([routing.defaultLocale]),
    );
  });

  it('reports a thrown lookup as an error result', async () => {
    getTenantLiveLocalesMock.mockRejectedValue(MOCK_ERROR);

    expect(await resolveTenantLiveLocales(MOCK_TENANT_ID)).toEqual(
      errorResult(MOCK_ERROR),
    );
  });
});
