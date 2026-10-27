import {
  MOCK_SITE_CONFIG_REVALIDATE_SECRET,
  MOCK_WEB_APP_URL,
} from '@blog/db/testing/invalidate-tenant-cache/fixtures';

import { loadInvalidateCacheEnv } from './env';

const REQUIRED_ENV: Record<string, string> = {
  WEB_APP_URL: MOCK_WEB_APP_URL,
  SITE_CONFIG_REVALIDATE_SECRET: MOCK_SITE_CONFIG_REVALIDATE_SECRET,
};

beforeEach(() => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    vi.stubEnv(key, value);
  }
});

describe(loadInvalidateCacheEnv, () => {
  it.each([true, false])(
    'resolves both required vars with dryRun=%s',
    (dryRun) => {
      const env = loadInvalidateCacheEnv(dryRun);

      expect(env).toEqual({
        webAppUrl: MOCK_WEB_APP_URL,
        siteConfigRevalidateSecret: MOCK_SITE_CONFIG_REVALIDATE_SECRET,
        dryRun,
      });
    },
  );

  it.each(Object.keys(REQUIRED_ENV))(
    'throws when %s is missing',
    (missingKey) => {
      vi.stubEnv(missingKey, undefined);

      expect(() => loadInvalidateCacheEnv(true)).toThrow(
        `invalidate-tenant-cache: missing required env var ${missingKey}.`,
      );
    },
  );
});
