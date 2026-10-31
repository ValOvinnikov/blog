import { SANITY_ROBOT_ROLE } from '@blog/config';
import {
  getTenantSanityManagementCredentials,
  setTenantSanityManagementToken,
} from '@blog/db/queries/tenants';
import {
  createSanityRobotToken,
  deleteSanityRobotToken,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { faker } from '@faker-js/faker';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_MANAGEMENT_ROBOT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
} from '@worker/testing/tenant/fixtures';
import { FatalError } from 'workflow';

import {
  ensureTenantManagementToken,
  requireTenantManagementToken,
} from './tenant-management-token';

faker.seed(7041);

vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/db/utils/sanity-management-client/sanity-robot-tokens');

const MOCK_MINTED_TOKEN = faker.string.alphanumeric(32);
const MOCK_MINTED_ROBOT_ID = faker.string.uuid();
const MOCK_STORE_FAILURE = 'store failed';
const MOCK_STORED_CREDENTIALS = {
  projectId: MOCK_SANITY_PROJECT_ID,
  token: MOCK_TENANT_MANAGEMENT_TOKEN,
  managementRobotId: MOCK_TENANT_MANAGEMENT_ROBOT_ID,
};
const MOCK_ENSURE_INPUT = {
  tenantId: MOCK_TENANT_ID,
  projectId: MOCK_SANITY_PROJECT_ID,
  organizationToken: MOCK_PROVISION_ENV.sanityManagementToken,
  productName: MOCK_PROVISION_ENV.productName,
};

describe(requireTenantManagementToken, () => {
  it("returns the tenant's stored management token", async () => {
    vi.mocked(getTenantSanityManagementCredentials).mockResolvedValue(
      MOCK_STORED_CREDENTIALS,
    );

    await expect(requireTenantManagementToken(MOCK_TENANT_ID)).resolves.toBe(
      MOCK_TENANT_MANAGEMENT_TOKEN,
    );
  });

  it('fails without retry, naming the missing token, when the tenant has none', async () => {
    const result = requireTenantManagementToken(MOCK_TENANT_ID);

    await expect(result).rejects.toBeInstanceOf(FatalError);
    await expect(result).rejects.toThrow(/sanityManagementTokenEncrypted/);
  });
});

describe(ensureTenantManagementToken, () => {
  it('reuses a stored token without minting another', async () => {
    vi.mocked(getTenantSanityManagementCredentials).mockResolvedValue(
      MOCK_STORED_CREDENTIALS,
    );

    await expect(ensureTenantManagementToken(MOCK_ENSURE_INPUT)).resolves.toBe(
      MOCK_TENANT_MANAGEMENT_TOKEN,
    );
    expect(createSanityRobotToken).not.toHaveBeenCalled();
    expect(setTenantSanityManagementToken).not.toHaveBeenCalled();
  });

  describe('when the tenant has no token yet', () => {
    beforeEach(() => {
      vi.mocked(createSanityRobotToken).mockResolvedValue({
        id: MOCK_MINTED_ROBOT_ID,
        token: MOCK_MINTED_TOKEN,
      });
    });

    it('mints a developer token with the organisation token', async () => {
      await ensureTenantManagementToken(MOCK_ENSURE_INPUT);

      expect(createSanityRobotToken).toHaveBeenCalledWith({
        token: MOCK_PROVISION_ENV.sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        label: MOCK_PROVISION_ENV.productName,
        role: SANITY_ROBOT_ROLE.DEVELOPER,
      });
    });

    it('stores the minted token with its robot id and returns it', async () => {
      await expect(
        ensureTenantManagementToken(MOCK_ENSURE_INPUT),
      ).resolves.toBe(MOCK_MINTED_TOKEN);
      expect(setTenantSanityManagementToken).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        { token: MOCK_MINTED_TOKEN, robotId: MOCK_MINTED_ROBOT_ID },
      );
      expect(deleteSanityRobotToken).not.toHaveBeenCalled();
    });

    it('revokes the minted token and fails when it cannot be stored', async () => {
      vi.mocked(setTenantSanityManagementToken).mockRejectedValue(
        new Error(MOCK_STORE_FAILURE),
      );

      await expect(
        ensureTenantManagementToken(MOCK_ENSURE_INPUT),
      ).rejects.toThrow(MOCK_STORE_FAILURE);
      expect(deleteSanityRobotToken).toHaveBeenCalledWith({
        token: MOCK_PROVISION_ENV.sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        robotId: MOCK_MINTED_ROBOT_ID,
      });
    });
  });
});
