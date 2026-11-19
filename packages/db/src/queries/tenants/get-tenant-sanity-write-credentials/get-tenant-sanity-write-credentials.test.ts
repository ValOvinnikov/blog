import {
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@shinefold/db/constants';
import { archiveTenant } from '@shinefold/db/queries/tenants/archive-tenant';
import { setTenantProvisioningStatus } from '@shinefold/db/queries/tenants/set-tenant-provisioning-status';
import { setTenantSanityToken } from '@shinefold/db/queries/tenants/set-tenant-sanity-token';
import { setTenantSanityWriteToken } from '@shinefold/db/queries/tenants/set-tenant-sanity-write-token';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MISSING_TENANT_TOKEN_KEY_ERROR,
  unsetTenantTokenEncryptionKey,
  useTenantTokenEncryptionKey,
} from '@shinefold/db/testing/tenant-token-encryption-key';
import {
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_READ_TOKEN,
  MOCK_TENANT_VALUES,
  MOCK_TENANT_WRITE_TOKEN,
} from '@shinefold/db/testing/tenants/fixtures';
import {
  readTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import {
  getTenantSanityWriteCredentials,
  toTenantSanityWriteCredentials,
} from './get-tenant-sanity-write-credentials';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useTenantTokenEncryptionKey();
useFrozenClock();
const tenant = useTestTenant(db, {
  ...MOCK_TENANT_VALUES,
  status: TENANT_STATUS.ACTIVE,
});

const { sanityProjectId, sanityDataset } = MOCK_TENANT_VALUES;

const MOCK_ACTIVE_WRITE_CREDENTIALS = {
  projectId: sanityProjectId,
  dataset: sanityDataset,
  token: MOCK_TENANT_WRITE_TOKEN,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: null,
};

describe(getTenantSanityWriteCredentials, () => {
  describe('with a write token set', () => {
    beforeEach(async () => {
      await setTenantSanityWriteToken(tenant().id, MOCK_TENANT_WRITE_TOKEN);
    });

    it('resolves the decrypted token, project, dataset and state for an active tenant', async () => {
      const credentials = await getTenantSanityWriteCredentials(tenant().id);

      expect(credentials).toEqual(MOCK_ACTIVE_WRITE_CREDENTIALS);
    });

    it('resolves write credentials for an archived tenant, with its deprovisionedAt', async () => {
      await archiveTenant(tenant().id);

      const credentials = await getTenantSanityWriteCredentials(tenant().id);

      expect(credentials).toEqual({
        ...MOCK_ACTIVE_WRITE_CREDENTIALS,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: MOCK_NOW,
      });
    });

    it('throws when the encryption key is not configured', async () => {
      unsetTenantTokenEncryptionKey();

      await expect(
        getTenantSanityWriteCredentials(tenant().id),
      ).rejects.toThrow(MISSING_TENANT_TOKEN_KEY_ERROR);
    });
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PROVISIONING,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])(
    'resolves undefined for a %s tenant with no write token set yet',
    async (status) => {
      await setTenantProvisioningStatus(tenant().id, status);

      const credentials = await getTenantSanityWriteCredentials(tenant().id);

      expect(credentials).toBeUndefined();
    },
  );

  it('resolves undefined when the tenant has no write token set yet', async () => {
    const credentials = await getTenantSanityWriteCredentials(tenant().id);

    expect(credentials).toBeUndefined();
  });

  it('resolves undefined when only the read token is set, not the write token', async () => {
    await setTenantSanityToken(tenant().id, MOCK_TENANT_READ_TOKEN);

    const credentials = await getTenantSanityWriteCredentials(tenant().id);

    expect(credentials).toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    const credentials = await getTenantSanityWriteCredentials(
      MOCK_MISSING_TENANT_ID,
    );

    expect(credentials).toBeUndefined();
  });
});

describe(toTenantSanityWriteCredentials, () => {
  describe('a row with a write token', () => {
    let row: TTenant;

    beforeEach(async () => {
      await setTenantSanityWriteToken(tenant().id, MOCK_TENANT_WRITE_TOKEN);
      row = await readTestTenant(db(), tenant().id);
    });

    it('maps a row with a write token to decrypted credentials and state', () => {
      const credentials = toTenantSanityWriteCredentials(row);

      expect(credentials).toEqual(MOCK_ACTIVE_WRITE_CREDENTIALS);
    });

    it('throws mapping the row when the encryption key is not configured', () => {
      unsetTenantTokenEncryptionKey();

      expect(() => toTenantSanityWriteCredentials(row)).toThrow(
        MISSING_TENANT_TOKEN_KEY_ERROR,
      );
    });
  });

  it('returns undefined for a row with no write token', () => {
    const credentials = toTenantSanityWriteCredentials(tenant());

    expect(credentials).toBeUndefined();
  });
});
