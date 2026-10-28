import { isDomainHeldByAnyTenant } from '@blog/db/queries/tenant-domains/is-domain-held-by-any-tenant';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_CUSTOM_DOMAIN } from '@worker/testing/tenant/fixtures';
import { MOCK_WORKER_ENV } from '@worker/testing/worker-env/mock-worker-env';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';

import { getDisconnectRefusal } from './disconnect-guard';

vi.mock('@worker/utils/env/env');
vi.mock('@blog/db/queries/tenant-domains/is-domain-held-by-any-tenant');

describe(getDisconnectRefusal, () => {
  beforeEach(() => {
    Object.assign(mockEnv, MOCK_WORKER_ENV);
    vi.mocked(isDomainHeldByAnyTenant).mockResolvedValue(false);
  });

  it('allows a domain nothing holds', async () => {
    await expect(getDisconnectRefusal(MOCK_CUSTOM_DOMAIN)).resolves.toBeNull();
  });

  it('refuses a domain a tenant row or primary domain holds', async () => {
    vi.mocked(isDomainHeldByAnyTenant).mockResolvedValue(true);

    await expect(getDisconnectRefusal(MOCK_CUSTOM_DOMAIN)).resolves.toBe(
      ENQUEUE_ERROR.DOMAIN_STILL_ASSIGNED,
    );
  });

  it.each([
    ['web app', MOCK_PROVISION_ENV.webAppBaseUrl],
    ['platform app', MOCK_PROVISION_ENV.platformAppBaseUrl],
  ])('refuses the %s host', async (_name, url) => {
    await expect(getDisconnectRefusal(new URL(url).hostname)).resolves.toBe(
      ENQUEUE_ERROR.DOMAIN_RESERVED,
    );
    expect(isDomainHeldByAnyTenant).not.toHaveBeenCalled();
  });

  it.each(['WEB_APP_URL', 'PLATFORM_APP_BASE_URL'])(
    'throws when %s is unset, so the check never skips',
    async (name) => {
      mockEnv[name] = undefined;

      await expect(getDisconnectRefusal(MOCK_CUSTOM_DOMAIN)).rejects.toThrow(
        name,
      );
    },
  );
});
