import { SANITY_ROBOT_ROLE } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import { setTenantSanityToken } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { SANITY_READ_TOKEN_LABEL } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { faker } from '@faker-js/faker';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_READ_TOKEN,
  MOCK_TENANT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import type { Mock } from 'vitest';

import {
  persistTenantSanityToken,
  type TPersistSanityTokenDeps,
} from './persist-sanity-token';

faker.seed(7006);

const MOCK_PERSISTED_TOKEN = faker.string.alphanumeric(32);
const MOCK_ROBOT_ID = faker.string.uuid();

vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/tenant-management-token/tenant-management-token');

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockProvisionedTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    ...overrides,
  });
}

describe(persistTenantSanityToken, () => {
  describe('when no token can be minted', () => {
    let mintReadToken: Mock<TPersistSanityTokenDeps['mintReadToken']>;

    beforeEach(() => {
      mintReadToken = vi.fn();
    });

    it('skips minting when a token is already persisted', async () => {
      const tenant = baseTenant({
        sanityReadTokenEncrypted: MOCK_PERSISTED_TOKEN,
      });

      await persistTenantSanityToken(tenant, {
        mintReadToken,
      });

      expect(mintReadToken).not.toHaveBeenCalled();
      expect(setTenantSanityToken).not.toHaveBeenCalled();
    });

    it('throws when the Sanity project has not been created yet', async () => {
      const tenant = baseTenant({ sanityProjectId: null });

      await expect(
        persistTenantSanityToken(tenant, { mintReadToken }),
      ).rejects.toThrow(/has no Sanity project yet/);
    });
  });

  it('mints a viewer-scoped token and persists it', async () => {
    const tenant = baseTenant();
    const mintReadToken: TPersistSanityTokenDeps['mintReadToken'] = vi
      .fn()
      .mockResolvedValue({ id: MOCK_ROBOT_ID, token: MOCK_SANITY_READ_TOKEN });

    await persistTenantSanityToken(tenant, {
      mintReadToken,
    });

    expect(mintReadToken).toHaveBeenCalledWith({
      token: MOCK_TENANT_MANAGEMENT_TOKEN,
      projectId: MOCK_SANITY_PROJECT_ID,
      label: SANITY_READ_TOKEN_LABEL,
      role: SANITY_ROBOT_ROLE.VIEWER,
    });
    expect(setTenantSanityToken).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_SANITY_READ_TOKEN,
    );
  });
});
