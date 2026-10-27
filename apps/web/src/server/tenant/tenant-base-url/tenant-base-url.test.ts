import { faker } from '@faker-js/faker';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import {
  MOCK_TENANT_HOST,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { env } from '@web/utils/env/env';

import { getTenantBaseUrl } from './tenant-base-url';

faker.seed(4410);

vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock('@web/utils/env/env', () => ({ env: {} }));

const MOCK_SITE_URL = faker.internet.url();

describe(getTenantBaseUrl, () => {
  beforeEach(() => {
    Reflect.deleteProperty(env, 'NEXT_PUBLIC_SITE_URL');
  });

  it("builds an https URL from the resolved tenant's primary domain", async () => {
    await expect(getTenantBaseUrl()).resolves.toBe(
      `https://${MOCK_TENANT_HOST}`,
    );
  });

  describe('with a site URL configured', () => {
    beforeEach(() => {
      Object.assign(env, { NEXT_PUBLIC_SITE_URL: MOCK_SITE_URL });
    });

    it.each([
      ['no tenant resolves', undefined],
      [
        'the resolved tenant has no primary domain',
        mockTenant({ primaryDomain: '' }),
      ],
    ])('falls back to the site URL when %s', async (_, tenant) => {
      vi.mocked(resolveRequestTenant).mockResolvedValueOnce(tenant);

      await expect(getTenantBaseUrl()).resolves.toBe(MOCK_SITE_URL);
    });
  });

  it('returns undefined when no tenant resolves and no site URL is configured', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

    await expect(getTenantBaseUrl()).resolves.toBeUndefined();
  });
});
