import { LOCALE_ISO_CODES } from '@blog/config';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { isLiveLocale } from './is-live-locale';

const { getTenantLiveLocalesMock } = vi.hoisted(() => ({
  getTenantLiveLocalesMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantLiveLocales: getTenantLiveLocalesMock } },
}));

const { EN, NL } = LOCALE_ISO_CODES;

describe(isLiveLocale, () => {
  beforeEach(() => {
    getTenantLiveLocalesMock.mockResolvedValue([EN]);
  });

  it("accepts a language the tenant's site serves", async () => {
    expect(await isLiveLocale(MOCK_TENANT_ID, EN)).toBe(true);
    expect(getTenantLiveLocalesMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
    );
  });

  it('refuses a language the tenant has not switched on', async () => {
    expect(await isLiveLocale(MOCK_TENANT_ID, NL)).toBe(false);
  });

  it('refuses every language for an unknown tenant', async () => {
    getTenantLiveLocalesMock.mockResolvedValue(undefined);

    expect(await isLiveLocale(MOCK_TENANT_ID, EN)).toBe(false);
  });
});
