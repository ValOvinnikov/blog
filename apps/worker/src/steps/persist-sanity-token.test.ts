import { SANITY_ROBOT_ROLE } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_READ_TOKEN,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import type { Mock } from 'vitest';

import {
  persistTenantSanityToken,
  type TPersistSanityTokenDeps,
} from './persist-sanity-token';

const { setTenantSanityTokenMock } = vi.hoisted(() => ({
  setTenantSanityTokenMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityToken: setTenantSanityTokenMock,
}));

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockProvisionedTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    ...overrides,
  });
}

beforeEach(() => {
  setTenantSanityTokenMock.mockReset();
});

describe(persistTenantSanityToken, () => {
  describe('when no token can be minted', () => {
    let mintReadToken: Mock<TPersistSanityTokenDeps['mintReadToken']>;

    beforeEach(() => {
      mintReadToken = vi.fn();
    });

    it('skips minting when a token is already persisted', async () => {
      const tenant = baseTenant({ sanityReadTokenEncrypted: 'already-set' });

      await persistTenantSanityToken(tenant, MOCK_PROVISION_ENV, {
        mintReadToken,
      });

      expect(mintReadToken).not.toHaveBeenCalled();
      expect(setTenantSanityTokenMock).not.toHaveBeenCalled();
    });

    it('throws when the Sanity project has not been created yet', async () => {
      const tenant = baseTenant({ sanityProjectId: null });

      await expect(
        persistTenantSanityToken(tenant, MOCK_PROVISION_ENV, { mintReadToken }),
      ).rejects.toThrow(/has no Sanity project yet/);
    });
  });

  it('mints a viewer-scoped token and persists it', async () => {
    const tenant = baseTenant();
    const mintReadToken: TPersistSanityTokenDeps['mintReadToken'] = vi
      .fn()
      .mockResolvedValue({ id: 'robot-2', token: MOCK_SANITY_READ_TOKEN });

    await persistTenantSanityToken(tenant, MOCK_PROVISION_ENV, {
      mintReadToken,
    });

    expect(mintReadToken).toHaveBeenCalledWith({
      token: MOCK_PROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
      label: expect.any(String),
      role: SANITY_ROBOT_ROLE.VIEWER,
    });
    expect(setTenantSanityTokenMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_SANITY_READ_TOKEN,
    );
  });
});
