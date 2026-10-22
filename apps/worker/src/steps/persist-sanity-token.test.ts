import { SANITY_ROBOT_ROLE } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';
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

const MANAGEMENT_TOKEN = 'mgmt-token';

const env: TProvisionEnv = {
  sanityManagementToken: MANAGEMENT_TOKEN,
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return makeTenant({
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
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

      await persistTenantSanityToken(tenant, env, { mintReadToken });

      expect(mintReadToken).not.toHaveBeenCalled();
      expect(setTenantSanityTokenMock).not.toHaveBeenCalled();
    });

    it('throws when the Sanity project has not been created yet', async () => {
      const tenant = baseTenant({ sanityProjectId: null });

      await expect(
        persistTenantSanityToken(tenant, env, { mintReadToken }),
      ).rejects.toThrow(/has no Sanity project yet/);
    });
  });

  it('mints a viewer-scoped token and persists it', async () => {
    const tenant = baseTenant();
    const mintReadToken: TPersistSanityTokenDeps['mintReadToken'] = vi
      .fn()
      .mockResolvedValue({ id: 'robot-2', token: 'sk-read' });

    await persistTenantSanityToken(tenant, env, { mintReadToken });

    expect(mintReadToken).toHaveBeenCalledWith({
      token: MANAGEMENT_TOKEN,
      projectId: 'proj123',
      label: expect.any(String),
      role: SANITY_ROBOT_ROLE.VIEWER,
    });
    expect(setTenantSanityTokenMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      'sk-read',
    );
  });
});
