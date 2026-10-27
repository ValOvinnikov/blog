import { faker } from '@faker-js/faker';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { checkTenantSlug } from '@platform/server/tenants/check-tenant-slug';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/env/fixtures';
import { env } from '@platform/utils/env/env';

import { checkSiteAddressAction } from './check-site-address-action';
import { requireOnboardingUser } from './require-onboarding-user';

vi.mock('@platform/utils/env/env');

vi.mock('./require-onboarding-user', () => ({
  requireOnboardingUser: vi.fn(),
}));

vi.mock('@platform/server/tenants/check-tenant-slug', () => ({
  checkTenantSlug: vi.fn(),
}));

const checkTenantSlugMock = vi.mocked(checkTenantSlug);

faker.seed(6104);

const MOCK_SITE_SLUG = faker.lorem.word().toLowerCase();

describe(checkSiteAddressAction, () => {
  beforeEach(() => {
    Object.assign(env, { TENANT_ROOT_DOMAIN: MOCK_TENANT_ROOT_DOMAIN });
  });

  it('checks the address the user typed under the root domain', async () => {
    checkTenantSlugMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);

    const result = await checkSiteAddressAction(
      ` ${MOCK_SITE_SLUG.toUpperCase()} `,
    );

    expect(result).toBe(TENANT_FIELD_ERROR.SLUG_TAKEN);
    expect(requireOnboardingUser).toHaveBeenCalled();
    expect(checkTenantSlugMock).toHaveBeenCalledWith(
      MOCK_SITE_SLUG,
      MOCK_TENANT_ROOT_DOMAIN,
    );
  });

  it('reports nothing without a root domain to check against', async () => {
    Object.assign(env, { TENANT_ROOT_DOMAIN: undefined });

    const result = await checkSiteAddressAction(MOCK_SITE_SLUG);

    expect(result).toBeUndefined();
    expect(checkTenantSlugMock).not.toHaveBeenCalled();
  });
});
