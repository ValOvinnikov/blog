import { LOCALE_ISO_CODES } from '@shinefold/config';
import { getTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { isLiveLocale } from './is-live-locale';

vi.mock('@web/server/tenant/tenant-live-locales/tenant-live-locales');

const getTenantLiveLocalesMock = vi.mocked(getTenantLiveLocales);

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
