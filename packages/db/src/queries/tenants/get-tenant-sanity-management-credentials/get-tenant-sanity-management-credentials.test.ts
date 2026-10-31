import { setTenantSanityManagementToken } from '@blog/db/queries/tenants/set-tenant-sanity-management-token';
import { setTenantSanityWriteToken } from '@blog/db/queries/tenants/set-tenant-sanity-write-token';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  useTenantTokenEncryptionKey,
} from '@blog/db/testing/tenant-token-encryption-key';
import {
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_MANAGEMENT_ROBOT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
  MOCK_TENANT_VALUES,
  MOCK_TENANT_WRITE_TOKEN,
} from '@blog/db/testing/tenants/fixtures';

import { getTenantSanityManagementCredentials } from './get-tenant-sanity-management-credentials';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useTenantTokenEncryptionKey();

const { sanityProjectId } = MOCK_TENANT_VALUES;

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantSanityManagementCredentials, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db(), { sanityProjectId });
  });

  describe('with a management token set', () => {
    beforeEach(async () => {
      await setTenantSanityManagementToken(tenant.id, {
        token: MOCK_TENANT_MANAGEMENT_TOKEN,
        robotId: MOCK_TENANT_MANAGEMENT_ROBOT_ID,
      });
    });

    it('resolves the decrypted token, its robot id and the project it is scoped to', async () => {
      const credentials = await getTenantSanityManagementCredentials(tenant.id);

      expect(credentials).toEqual({
        projectId: sanityProjectId,
        token: MOCK_TENANT_MANAGEMENT_TOKEN,
        managementRobotId: MOCK_TENANT_MANAGEMENT_ROBOT_ID,
      });
    });

    it('throws when the encryption key is not configured', async () => {
      vi.stubEnv('TENANT_TOKEN_ENCRYPTION_KEY', undefined);

      await expect(
        getTenantSanityManagementCredentials(tenant.id),
      ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
    });
  });

  it('resolves undefined when the tenant has no management token set yet', async () => {
    const credentials = await getTenantSanityManagementCredentials(tenant.id);

    expect(credentials).toBeUndefined();
  });

  it('resolves undefined when only the write token is set', async () => {
    await setTenantSanityWriteToken(tenant.id, MOCK_TENANT_WRITE_TOKEN);

    const credentials = await getTenantSanityManagementCredentials(tenant.id);

    expect(credentials).toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    const credentials = await getTenantSanityManagementCredentials(
      MOCK_MISSING_TENANT_ID,
    );

    expect(credentials).toBeUndefined();
  });
});
