import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { MOCK_TENANT_BASE_URL } from '@web/testing/shared/tenant/fixtures';
import { env } from '@web/utils/env/env';
import { PRODUCTION_DATASET } from '@web/utils/is-production-environment';

import robots from './robots';

const STAGING_DATASET = 'development';
const SITEMAP_PATH = '/sitemap.xml';
const ALLOW_ALL_RULES = { userAgent: '*', allow: '/' };

const { envMock } = vi.hoisted(() => ({
  envMock: { NEXT_PUBLIC_SANITY_DATASET: '' },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));
vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

describe(robots, () => {
  describe('production', () => {
    beforeEach(() => {
      vi.mocked(env).NEXT_PUBLIC_SANITY_DATASET = PRODUCTION_DATASET;
    });

    it('allows all crawlers and points sitemap at the absolute site URL', async () => {
      await expect(robots()).resolves.toEqual({
        rules: ALLOW_ALL_RULES,
        sitemap: `${MOCK_TENANT_BASE_URL}${SITEMAP_PATH}`,
      });
    });

    it('falls back to a relative sitemap path when no base URL resolves', async () => {
      vi.mocked(getTenantBaseUrl).mockResolvedValueOnce(undefined);

      await expect(robots()).resolves.toEqual({
        rules: ALLOW_ALL_RULES,
        sitemap: SITEMAP_PATH,
      });
    });
  });

  describe('non-production', () => {
    beforeEach(() => {
      vi.mocked(env).NEXT_PUBLIC_SANITY_DATASET = STAGING_DATASET;
    });

    it('allows crawling but omits the sitemap', async () => {
      await expect(robots()).resolves.toEqual({ rules: ALLOW_ALL_RULES });
    });

    it('never resolves the tenant base URL', async () => {
      await robots();

      expect(getTenantBaseUrl).not.toHaveBeenCalled();
    });
  });
});
