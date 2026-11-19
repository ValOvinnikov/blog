import { LOCALE_ISO_CODES } from '@shinefold/config';

export * from '@shinefold/db/constants';

export const queries = {
  siteConfig: { getSiteConfig: vi.fn(async () => undefined) },
  tenants: { selectLiveLocalesWithin: vi.fn(() => [LOCALE_ISO_CODES.EN]) },
};
